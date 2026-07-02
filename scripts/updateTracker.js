#!/usr/bin/env node
/*
  DEV DR DIE v9.0 - Workflow Consolidation

  Final-only Tracker pipeline:
  1) Ensure data/today-predictions.json has a same-day prediction snapshot.
  2) Grade only games that are final.
  3) Append/update only finalized win/loss rows in data/tracker.json.
  4) Never write pending rows to tracker history.

  Current auto-snapshot support:
  - Diamond Report Picks (DRP) are generated from today's MLB schedule using
    the same type of public inputs used by the site: probable pitchers, season
    pitching stats, home-field edge, and matchup scoring.
  - K Props and HR picks remain snapshot-ready but require a future dedicated
    prediction export/engine before they can be auto-graded safely.
*/
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const trackerPath = path.join(DATA_DIR, 'tracker.json');
const snapshotPath = path.join(DATA_DIR, 'today-predictions.json');
const dailyPath = path.join(DATA_DIR, 'daily-results.json');
const modelPath = path.join(DATA_DIR, 'model-data.json');

function readJson(p, fallback){ try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } }
function writeJson(p, data){ fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n'); }
function todayCT(){ return new Intl.DateTimeFormat('en-CA', { timeZone:'America/Chicago', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()); }
function nowIso(){ return new Date().toISOString(); }
function normalizeTeam(t){ return String(t || '').trim().toUpperCase().replace('WSN','WSH').replace('WAS','WSH').replace('AZ','ARI').replace('CHW','CWS').replace('OAK','ATH').replace('KCR','KC').replace('SDP','SD').replace('SFG','SF').replace('TBR','TB'); }
function normResult(v){ const s = String(v || '').toLowerCase(); if (['win','right','hit','correct'].includes(s)) return 'win'; if (['loss','wrong','miss','incorrect'].includes(s)) return 'loss'; return 'pending'; }
function isWinLoss(r){ const x = normResult(r?.result ?? r?.status ?? r?.outcome ?? r?.grade); return x === 'win' || x === 'loss'; }
function finalRows(rows){ return (rows || []).filter(isWinLoss).map(r => ({ ...r, result: normResult(r.result ?? r.status ?? r.outcome ?? r.grade) })); }
function summaryFromRows(rows){ const final = finalRows(rows); const wins = final.filter(r => r.result === 'win').length; return { wins, losses: Math.max(final.length - wins, 0), total: final.length }; }
function keyOf(row, type){
  if (row.gamePk) return `${row.date || todayCT()}|${type}|${row.gamePk}`;
  return row.key || `${row.date || todayCT()}|${type}|${row.label || row.player || row.pitcher || row.game || ''}|${row.pick || ''}`;
}
function upsertFinalRow(arr, row, type){ if (!isWinLoss(row)) return false; row.key = keyOf(row, type); row.result = normResult(row.result ?? row.status ?? row.outcome ?? row.grade); const idx = arr.findIndex(x => keyOf(x, type) === row.key); if (idx >= 0) arr[idx] = { ...arr[idx], ...row }; else arr.push(row); return true; }
function extractTeams(rec){
  const teams = Array.isArray(rec.teams) ? rec.teams.map(normalizeTeam).filter(Boolean) : [];
  if (teams.length >= 2) return teams.slice(0,2);
  const label = String(rec.label || rec.game || rec.matchup || '');
  if (label.includes('@')) return label.split('@').map(normalizeTeam).filter(Boolean).slice(0,2);
  const keyPart = String(rec.key || '').split('|').pop() || '';
  if (keyPart.includes('-')) return keyPart.split('-').map(normalizeTeam).filter(Boolean).slice(0,2);
  return [];
}
async function fetchJson(url){
  const res = await fetch(url, { headers: { accept:'application/json', 'user-agent':'Diamond-Report-DIE-Tracker/8.7' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return res.json();
}
async function fetchMlbSchedule(date){
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=team,probablePitcher,linescore`;
  const json = await fetchJson(url);
  const games = [];
  for (const d of json.dates || []) for (const g of d.games || []) {
    const state = String(g.status?.detailedState || g.status?.abstractGameState || '').toLowerCase();
    const isFinal = state.includes('final') || state.includes('completed');
    const away = normalizeTeam(g.teams?.away?.team?.abbreviation);
    const home = normalizeTeam(g.teams?.home?.team?.abbreviation);
    const awayScore = Number(g.teams?.away?.score);
    const homeScore = Number(g.teams?.home?.score);
    games.push({
      gamePk: g.gamePk,
      gameDate: g.gameDate,
      away,
      home,
      awayScore: Number.isFinite(awayScore) ? awayScore : null,
      homeScore: Number.isFinite(homeScore) ? homeScore : null,
      awayPitcher: g.teams?.away?.probablePitcher || null,
      homePitcher: g.teams?.home?.probablePitcher || null,
      isFinal,
      winner: Number.isFinite(awayScore) && Number.isFinite(homeScore) ? (awayScore > homeScore ? away : homeScore > awayScore ? home : null) : null
    });
  }
  return games.filter(g => g.away && g.home);
}
async function fetchPitcherStats(personId){
  if (!personId) return {};
  try {
    const d = await fetchJson(`https://statsapi.mlb.com/api/v1/people/${personId}?hydrate=stats(group=pitching,type=season,season=2026)`);
    return d.people?.[0]?.stats?.[0]?.splits?.[0]?.stat || {};
  } catch { return {}; }
}
function num(v, fallback){ const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; }
async function buildDrpSnapshot(date){
  const games = await fetchMlbSchedule(date);
  const rows = [];
  for (const g of games) {
    const [awayStats, homeStats] = await Promise.all([
      fetchPitcherStats(g.awayPitcher?.id),
      fetchPitcherStats(g.homePitcher?.id)
    ]);
    let awayScore = 50;
    let homeScore = 53; // home-field edge
    const awayERA = num(awayStats.era, 4.5);
    const homeERA = num(homeStats.era, 4.5);
    const eraDiff = awayERA - homeERA;
    if (Math.abs(eraDiff) > 0.3) {
      if (eraDiff > 0) homeScore += Math.min(eraDiff * 3, 8);
      else awayScore += Math.min(Math.abs(eraDiff) * 3, 8);
    }
    const awayWHIP = num(awayStats.whip, 1.3);
    const homeWHIP = num(homeStats.whip, 1.3);
    if (Math.abs(awayWHIP - homeWHIP) > 0.1) {
      if (awayWHIP > homeWHIP) homeScore += 4;
      else awayScore += 4;
    }
    const awayK9 = num(awayStats.strikeoutsPer9Inn, 8);
    const homeK9 = num(homeStats.strikeoutsPer9Inn, 8);
    if (homeK9 > awayK9 + 1) homeScore += 3;
    else if (awayK9 > homeK9 + 1) awayScore += 3;
    const gameHourCT = parseInt(new Date(g.gameDate).toLocaleString('en-US', { hour:'numeric', hour12:false, timeZone:'America/Chicago' }), 10);
    if (Number.isFinite(gameHourCT) && gameHourCT < 17) homeScore += 2;
    const total = awayScore + homeScore;
    const awayPct = Math.round((awayScore / total) * 100);
    const homePct = 100 - awayPct;
    const pick = awayPct > homePct ? g.away : g.home;
    rows.push({
      key: `${date}|DRP|${g.gamePk}`,
      gamePk: g.gamePk,
      type: 'drp',
      label: `${g.away} @ ${g.home}`,
      pick,
      teams: [g.away, g.home],
      date,
      result: 'pending',
      confidencePct: pick === g.away ? awayPct : homePct,
      source: 'auto-snapshot-github-action',
      snapshotVersion: '9.0'
    });
  }
  return rows;
}
async function ensureSnapshot(date){
  const snap = readJson(snapshotPath, { version:1, generatedAt:null, date:null, drp:[], kprop:[], hr:[] });
  snap.version ||= 1;
  snap.drp = Array.isArray(snap.drp) ? snap.drp : [];
  snap.kprop = Array.isArray(snap.kprop) ? snap.kprop : [];
  snap.hr = Array.isArray(snap.hr) ? snap.hr : [];
  const hasSameDayRows = snap.date === date && (snap.drp.length || snap.kprop.length || snap.hr.length);
  if (hasSameDayRows) return { snapshot: snap, created: false, drpCreated: 0 };
  const drp = await buildDrpSnapshot(date);
  const next = {
    version: 2,
    generatedAt: nowIso(),
    date,
    mode: 'auto-snapshot',
    note: 'Generated by scripts/updateTracker.js. Tracker history remains final-only; pending snapshot rows are graded into data/tracker.json only after games are final.',
    drp,
    kprop: snap.kprop.filter(r => r.date === date),
    hr: snap.hr.filter(r => r.date === date),
    debug: {
      previousSnapshotDate: snap.date || null,
      drpRowsCreated: drp.length,
      kpropAutoSnapshotSupported: false,
      hrAutoSnapshotSupported: false
    }
  };
  writeJson(snapshotPath, next);
  return { snapshot: next, created: true, drpCreated: drp.length };
}
function findGame(games, a, b, gamePk){
  if (gamePk) {
    const byPk = games.find(g => String(g.gamePk) === String(gamePk));
    if (byPk) return byPk;
  }
  a = normalizeTeam(a); b = normalizeTeam(b);
  return games.find(g => (g.away === a && g.home === b) || (g.away === b && g.home === a));
}
async function gradeDrpSnapshot(snapshotRows){
  const dates = [...new Set((snapshotRows || []).map(r => r.date || todayCT()))];
  const schedules = new Map();
  for (const d of dates) { try { schedules.set(d, await fetchMlbSchedule(d)); } catch (e) { console.warn(e.message || e); schedules.set(d, []); } }
  const graded = [];
  for (const rec of snapshotRows || []) {
    const date = rec.date || todayCT();
    const [a,b] = extractTeams(rec);
    if (!a || !b) continue;
    const game = findGame(schedules.get(date) || [], a, b, rec.gamePk);
    if (!game || !game.isFinal || !game.winner) continue;
    const pick = normalizeTeam(rec.pick);
    graded.push({ ...rec, type:'drp', date, gamePk: game.gamePk || rec.gamePk, result: pick === game.winner ? 'win':'loss', finalWinner: game.winner, finalScore: `${game.away} ${game.awayScore} - ${game.home} ${game.homeScore}`, gradedAt: nowIso(), gradingSource:'mlb-stats-api-final-score', key: `${date}|DRP|${game.gamePk || rec.gamePk || [a,b].sort().join('-')}` });
  }
  return graded;
}
function buildTrackerBase(existing){
  const t = existing || {};
  t.version = Math.max(Number(t.version || 0), 7);
  t.generatedAt ||= null;
  t.picks ||= [];
  t.market ||= {};
  t.market.drp ||= [];
  t.market.kprop ||= [];
  t.players ||= {};
  t.teams ||= {};
  t.days ||= {};
  t.dailyResults ||= [];
  t.debug ||= {};
  t.allTime ||= {};
  return t;
}
async function main(){
  const now = nowIso();
  const date = todayCT();
  const tracker = buildTrackerBase(readJson(trackerPath, {}));
  const snapInfo = await ensureSnapshot(date);
  const snap = snapInfo.snapshot;
  const snapshotDrp = Array.isArray(snap.drp) ? snap.drp : [];
  const snapshotK = Array.isArray(snap.kprop) ? snap.kprop : [];
  const snapshotHr = Array.isArray(snap.hr) ? snap.hr : [];

  let addedDrp = 0, addedK = 0, addedHr = 0;
  const gradedDrp = await gradeDrpSnapshot(snapshotDrp);
  for (const row of gradedDrp) if (upsertFinalRow(tracker.market.drp, row, 'DRP')) addedDrp++;
  for (const row of finalRows(snapshotK)) if (upsertFinalRow(tracker.market.kprop, { ...row, type:'kprop', gradedAt: row.gradedAt || now }, 'KPROP')) addedK++;
  for (const row of (snapshotHr || []).filter(r => r.final === true || isWinLoss(r))) {
    const out = { ...row, date: row.date || date, final: true, hit: row.hit === true || normResult(row.result) === 'win', gradedAt: row.gradedAt || now };
    out.key = out.key || `${out.date}|HR|${String(out.player || '').toLowerCase()}|${normalizeTeam(out.team)}`;
    const idx = tracker.picks.findIndex(x => x.key === out.key);
    if (idx >= 0) tracker.picks[idx] = { ...tracker.picks[idx], ...out }; else tracker.picks.push(out);
    addedHr++;
  }

  tracker.picks = (tracker.picks || []).filter(p => p.final === true);
  tracker.market.drp = finalRows(tracker.market.drp);
  tracker.market.kprop = finalRows(tracker.market.kprop);
  const hrWins = tracker.picks.filter(p => p.hit === true).length;
  tracker.allTime.hr = { wins: hrWins, losses: Math.max(tracker.picks.length - hrWins, 0), total: tracker.picks.length };
  tracker.allTime.drp = summaryFromRows(tracker.market.drp);
  tracker.allTime.kprop = summaryFromRows(tracker.market.kprop);
  tracker.generatedAt = now;
  tracker.debug = {
    ...tracker.debug,
    repoSync: true,
    trackingMode: 'final-only-auto-snapshot',
    pendingRowsAllowed: false,
    localStorageHistoryAllowed: false,
    lastGithubActionRun: now,
    currentDateCT: date,
    lastSnapshotSource: 'data/today-predictions.json',
    snapshotCreatedThisRun: snapInfo.created,
    snapshotRowsCreatedThisRun: { drp: snapInfo.drpCreated, kprop: 0, hr: 0 },
    snapshotRowsSeen: { drp: snapshotDrp.length, kprop: snapshotK.length, hr: snapshotHr.length },
    rowsAddedOrUpdated: { drp: addedDrp, kprop: addedK, hr: addedHr },
    allTimeSummaryUpdatedAt: now
  };
  writeJson(trackerPath, tracker);

  const daily = readJson(dailyPath, { version:1, results:[] });
  daily.version ||= 1; daily.results ||= []; daily.lastCheckedAt = now; daily.currentDateCT = date; writeJson(dailyPath, daily);
  const model = readJson(modelPath, { version:1, notes:[] });
  model.version ||= 1; model.generatedAt = now; model.notes ||= [];
  model.notes = ['Tracker sync uses final-only historical rows.', 'DR Picks are auto-snapshotted if data/today-predictions.json is empty for the day.', 'K/HR snapshot automation is planned for the next tracker engine phase.'];
  writeJson(modelPath, model);
  console.log(`Tracker sync complete. Snapshot ${snapInfo.created ? 'created' : 'existing'}: DRP=${snapshotDrp.length}, K=${snapshotK.length}, HR=${snapshotHr.length}. Added/updated: DRP=${addedDrp}, K=${addedK}, HR=${addedHr}. Totals: DRP ${tracker.allTime.drp.wins}-${tracker.allTime.drp.losses}, K ${tracker.allTime.kprop.wins}-${tracker.allTime.kprop.losses}, HR ${tracker.allTime.hr.wins}-${tracker.allTime.hr.losses}.`);
}
main().catch(err => { console.error(err); process.exit(1); });
