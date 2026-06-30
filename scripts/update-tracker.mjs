import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const TRACKER_PATH = path.join(ROOT, 'data', 'tracker.json');
const DAILY_PATH = path.join(ROOT, 'data', 'daily-results.json');

const TEAM_NORM = { CHW:'CWS', KCR:'KC', SDP:'SD', SFG:'SF', TBR:'TB', WAS:'WSH', AZ:'ARI' };
const normTeam = value => TEAM_NORM[String(value || '').toUpperCase().trim()] || String(value || '').toUpperCase().trim();
const pct = (wins, total) => total ? Math.round((wins / total) * 100) : 0;

async function readJson(file, fallback){
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { return fallback; }
}

async function fetchJson(url){
  const res = await fetch(url, { headers: { 'user-agent':'diamond-report-tracker-updater' }});
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

function normalizeStore(store){
  store.version ||= 4;
  store.picks ||= [];
  store.players ||= {};
  store.teams ||= {};
  store.days ||= {};
  store.market ||= { drp: [], kprop: [] };
  store.market.drp ||= [];
  store.market.kprop ||= [];
  store.dailyResults ||= [];
  store.debug ||= {};
  return store;
}

function rebuildIndexes(store){
  store.players = {};
  store.teams = {};
  store.days = {};
  for (const pick of store.picks || []) {
    if (!pick?.player) continue;
    pick.date ||= new Date().toISOString().slice(0,10);
    pick.key ||= `${pick.date}|${String(pick.player).toLowerCase()}|${pick.team || ''}`;
    store.days[pick.date] ||= { keys: [] };
    if (!store.days[pick.date].keys.includes(pick.key)) store.days[pick.date].keys.push(pick.key);
    const playerKey = String(pick.player).toLowerCase();
    store.players[playerKey] ||= { player: pick.player, team: pick.team, hits: 0, total: 0 };
    store.players[playerKey].total++;
    if (pick.hit) store.players[playerKey].hits++;
    if (pick.team) {
      store.teams[pick.team] ||= { team: pick.team, hits: 0, total: 0, correctPlayers: {} };
      store.teams[pick.team].total++;
      if (pick.hit) {
        store.teams[pick.team].hits++;
        store.teams[pick.team].correctPlayers[pick.player] = (store.teams[pick.team].correctPlayers[pick.player] || 0) + 1;
      }
    }
  }
}

function teamsFromRecord(rec){
  const labelTeams = String(rec.label || '').match(/\b[A-Z]{2,3}\b/g) || [];
  const keyTeams = String(rec.key || '').match(/\b[A-Z]{2,3}\b/g) || [];
  return [...new Set([...labelTeams, ...keyTeams].map(normTeam))];
}

async function finalsForDate(date){
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=linescore,team`;
  const data = await fetchJson(url);
  const games = data.dates?.[0]?.games || [];
  const byTeam = new Map();
  for (const game of games) {
    if (game.status?.abstractGameState !== 'Final') continue;
    const away = normTeam(game.teams?.away?.team?.abbreviation);
    const home = normTeam(game.teams?.home?.team?.abbreviation);
    const awayScore = Number(game.teams?.away?.score);
    const homeScore = Number(game.teams?.home?.score);
    if (!away || !home || Number.isNaN(awayScore) || Number.isNaN(homeScore)) continue;
    const winner = awayScore > homeScore ? away : homeScore > awayScore ? home : 'TIE';
    const rec = { gamePk: game.gamePk, away, home, awayScore, homeScore, winner, date };
    byTeam.set(away, rec);
    byTeam.set(home, rec);
  }
  return byTeam;
}

async function pitcherKsForGame(gamePk){
  const box = await fetchJson(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`);
  const ks = new Map();
  for (const side of ['away', 'home']) {
    const players = box.teams?.[side]?.players || {};
    for (const player of Object.values(players)) {
      const name = player.person?.fullName;
      const strikeOuts = player.stats?.pitching?.strikeOuts;
      if (name && strikeOuts != null) ks.set(name.toLowerCase(), Number(strikeOuts));
    }
  }
  return ks;
}

function gradeKProp(rec, strikeOuts){
  const line = Number(String(rec.line || '').match(/\d+(?:\.\d+)?/)?.[0]);
  if (Number.isNaN(line) || strikeOuts == null) return 'pending';
  if (/UNDER/i.test(rec.pick)) return strikeOuts < line ? 'win' : 'loss';
  if (/OVER/i.test(rec.pick)) return strikeOuts > line ? 'win' : 'loss';
  return 'pending';
}

async function main(){
  const store = normalizeStore(await readJson(TRACKER_PATH, {}));
  const daily = await readJson(DAILY_PATH, { version:1, generatedAt:null, results:[] });
  const dates = [...new Set([
    ...(store.market.drp || []).filter(r => r.result === 'pending').map(r => r.date),
    ...(store.market.kprop || []).filter(r => r.result === 'pending').map(r => r.date),
    ...(store.picks || []).filter(r => r.hit == null || r.finalChecked === false).map(r => r.date)
  ].filter(Boolean))];

  let changed = false;
  const finalsCache = new Map();
  const getFinals = async date => {
    if (!finalsCache.has(date)) finalsCache.set(date, await finalsForDate(date));
    return finalsCache.get(date);
  };

  for (const rec of store.market.drp || []) {
    if (rec.result !== 'pending' || !rec.date) continue;
    const finals = await getFinals(rec.date);
    const pick = normTeam(rec.pick);
    const game = finals.get(pick);
    if (!game) continue;
    rec.result = game.winner === 'TIE' ? 'push' : game.winner === pick ? 'win' : 'loss';
    rec.finalChecked = true;
    changed = true;
    daily.results.push({ key: `${rec.date}|DRP|${rec.key}`, date: rec.date, type:'drp', label:rec.label, pick:rec.pick, result:rec.result, game });
  }

  const gameKsCache = new Map();
  for (const rec of store.market.kprop || []) {
    if (rec.result !== 'pending' || !rec.date) continue;
    const finals = await getFinals(rec.date);
    const teams = teamsFromRecord(rec);
    const game = teams.map(t => finals.get(t)).find(Boolean) || [...finals.values()][0];
    if (!game) continue;
    if (!gameKsCache.has(game.gamePk)) gameKsCache.set(game.gamePk, await pitcherKsForGame(game.gamePk));
    const ksMap = gameKsCache.get(game.gamePk);
    const actualKs = ksMap.get(String(rec.label || '').toLowerCase());
    const result = gradeKProp(rec, actualKs);
    if (result === 'pending') continue;
    rec.actualKs = actualKs;
    rec.result = result;
    rec.finalChecked = true;
    changed = true;
    daily.results.push({ key: `${rec.date}|KPROP|${rec.key}`, date: rec.date, type:'kprop', label:rec.label, pick:rec.pick, line:rec.line, actualKs, result });
  }

  rebuildIndexes(store);
  store.generatedAt = new Date().toISOString();
  store.debug.lastSync = store.generatedAt;
  store.debug.lastUpdater = 'scripts/update-tracker.mjs';
  store.debug.summary = {
    hrAllTime: { wins: Object.values(store.players).reduce((a,p)=>a+p.hits,0), total: Object.values(store.players).reduce((a,p)=>a+p.total,0) },
    drpAllTime: (() => { const graded = store.market.drp.filter(r => ['win','loss'].includes(r.result)); const wins = graded.filter(r => r.result === 'win').length; return { wins, total: graded.length, pct: pct(wins, graded.length) }; })(),
    kpropAllTime: (() => { const graded = store.market.kprop.filter(r => ['win','loss'].includes(r.result)); const wins = graded.filter(r => r.result === 'win').length; return { wins, total: graded.length, pct: pct(wins, graded.length) }; })()
  };
  daily.generatedAt = store.generatedAt;
  // De-dupe daily results by key.
  daily.results = [...new Map((daily.results || []).map(r => [r.key, r])).values()];

  await fs.writeFile(TRACKER_PATH, JSON.stringify(store, null, 2) + '\n');
  await fs.writeFile(DAILY_PATH, JSON.stringify(daily, null, 2) + '\n');
  console.log(changed ? 'Tracker data updated.' : 'No pending final results found.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
