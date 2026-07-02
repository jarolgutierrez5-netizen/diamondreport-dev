#!/usr/bin/env node
/*
  DEV DR DIE v9.3 - HR/K Tracker Snapshot Fix

  Final-only Tracker pipeline:
  1) Ensure data/today-predictions.json has a same-day prediction snapshot.
  2) Grade only games that are final.
  3) Append/update only finalized win/loss rows in data/tracker.json.
  4) Never write pending rows to tracker history.

  Current auto-snapshot support:
  - Diamond Report Picks (DRP) are generated from today's MLB schedule.
  - K Props are generated from probable starters and graded against final boxscore strikeouts.
  - HR picks are generated from lineup data and graded against final boxscore home runs.
  Tracker history remains final-only: pending/push rows are never stored in tracker.json.
*/
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const trackerPath = path.join(DATA_DIR, 'tracker.json');
const snapshotPath = path.join(DATA_DIR, 'today-predictions.json');
const dailyPath = path.join(DATA_DIR, 'daily-results.json');
const modelPath = path.join(DATA_DIR, 'model-data.json');
const lineupsPath = path.join(DATA_DIR, 'lineups.json');

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

function roundHalf(n){ return Math.round(Number(n || 0) * 2) / 2; }
function round1(n){ return Math.round(Number(n || 0) * 10) / 10; }
function teamSideForPitcher(game, pitcherId){
  if (String(game.awayPitcher?.id || '') === String(pitcherId || '')) return { side:'away', team:game.away, opponent:game.home };
  if (String(game.homePitcher?.id || '') === String(pitcherId || '')) return { side:'home', team:game.home, opponent:game.away };
  return null;
}
async function fetchBoxscore(gamePk){
  if (!gamePk) return null;
  try { return await fetchJson(`https://statsapi.mlb.com/api/v1/game/${gamePk}/boxscore`); }
  catch (e) { console.warn(`Boxscore fetch failed for ${gamePk}: ${e.message || e}`); return null; }
}
function boxscorePlayerStats(box, playerId, group){
  if (!box || !playerId) return null;
  const teams = [box.teams?.away, box.teams?.home].filter(Boolean);
  for (const team of teams) {
    const p = team.players?.[`ID${playerId}`];
    if (p) return { player:p, stats:p.stats?.[group] || {} };
  }
  return null;
}
function pitcherFinalKs(box, pitcherId){
  const found = boxscorePlayerStats(box, pitcherId, 'pitching');
  const k = Number(found?.stats?.strikeOuts);
  return Number.isFinite(k) ? k : null;
}
function batterFinalHrs(box, playerId){
  const found = boxscorePlayerStats(box, playerId, 'batting');
  const hr = Number(found?.stats?.homeRuns);
  return Number.isFinite(hr) ? hr : 0;
}
function inningsNumber(ip){
  if (ip == null) return null;
  const s = String(ip);
  const [whole, frac] = s.split('.');
  const w = Number(whole || 0);
  const outs = frac === '1' ? 1 : frac === '2' ? 2 : 0;
  return Number.isFinite(w) ? w + outs / 3 : null;
}
function projectedKsFromStats(stat){
  const k9 = num(stat.strikeoutsPer9Inn, null);
  const ip = inningsNumber(stat.inningsPitched);
  const gamesStarted = num(stat.gamesStarted, null);
  let expectedIp = 5.4;
  if (ip && gamesStarted && gamesStarted > 0) expectedIp = Math.max(4.2, Math.min(6.5, ip / gamesStarted));
  const projected = (k9 || 7.8) * expectedIp / 9;
  return { projected: round1(projected), expectedIp: round1(expectedIp), k9: round1(k9 || 7.8) };
}
function hrScoreForBatter(b){
  const st = b.stats || {};
  const hr = num(st.homeRuns, 0);
  const ab = Math.max(num(st.atBats, 0), 1);
  const slg = num(st.slg, 0.350);
  const ops = num(st.ops, 0.650);
  const airOuts = num(st.airOuts, 0);
  const orderBoost = Math.max(0, 10 - num(b.order, 9)) * 0.12;
  return round1((hr / ab) * 120 + hr * 0.12 + Math.max(0, slg - 0.35) * 9 + Math.max(0, ops - 0.65) * 4 + Math.min(airOuts / 100, 1.5) + orderBoost);
}
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

async function buildKPropSnapshot(date){
  const games = await fetchMlbSchedule(date);
  const rows = [];
  for (const g of games) {
    for (const slot of [g.awayPitcher, g.homePitcher]) {
      if (!slot?.id) continue;
      const side = teamSideForPitcher(g, slot.id);
      if (!side) continue;
      const stat = await fetchPitcherStats(slot.id);
      const proj = projectedKsFromStats(stat);
      const drLine = roundHalf(proj.projected);
      const pick = proj.projected >= drLine ? 'OVER' : 'UNDER';
      rows.push({
        key: `${date}|KPROP|${g.gamePk}|${slot.id}`,
        gamePk: g.gamePk,
        pitcherId: slot.id,
        type: 'kprop',
        label: slot.fullName || slot.name || `Pitcher ${slot.id}`,
        pitcher: slot.fullName || slot.name || `Pitcher ${slot.id}`,
        team: side.team,
        opponent: side.opponent,
        pick,
        line: String(drLine),
        projectedLine: proj.projected,
        kProjectionForGame: proj.projected,
        drLine,
        expectedIp: proj.expectedIp,
        k9: proj.k9,
        result: 'pending',
        date,
        source: 'auto-k-snapshot-github-action',
        snapshotVersion: '9.3'
      });
    }
  }
  return rows;
}
function buildHrSnapshotFromLineups(date){
  const lineups = readJson(lineupsPath, { games:{} });
  const games = lineups.games || {};
  const candidates = [];
  for (const g of Object.values(games)) {
    if (String(g.date || '') !== String(date)) continue;
    const matchup = g.matchup || '';
    for (const sideName of ['away','home']) {
      const side = g.teams?.[sideName];
      const team = normalizeTeam(side?.abbr);
      for (const b of side?.lineup || []) {
        const score = hrScoreForBatter(b);
        if (!b?.id || !b?.name || score <= 0) continue;
        candidates.push({
          key: `${date}|HR|${g.gamePk}|${b.id}`,
          gamePk: g.gamePk,
          playerId: b.id,
          player: b.name,
          team,
          matchup,
          battingOrder: b.order || null,
          position: b.pos || '',
          hrPct: Math.max(1, Math.min(15, score)),
          result: 'pending',
          final: false,
          hit: false,
          source: 'auto-hr-snapshot-lineups',
          snapshotVersion: '9.3',
          date
        });
      }
    }
  }
  candidates.sort((a,b) => Number(b.hrPct || 0) - Number(a.hrPct || 0));
  return candidates.slice(0, 25);
}
async function ensureSnapshot(date){
  const snap = readJson(snapshotPath, { version:1, generatedAt:null, date:null, drp:[], kprop:[], hr:[] });
  snap.version ||= 1;
  snap.drp = Array.isArray(snap.drp) ? snap.drp : [];
  snap.kprop = Array.isArray(snap.kprop) ? snap.kprop : [];
  snap.hr = Array.isArray(snap.hr) ? snap.hr : [];
  const sameDay = snap.date === date;
  const next = sameDay ? { ...snap } : {
    version: 2,
    generatedAt: nowIso(),
    date,
    mode: 'auto-snapshot',
    note: 'Generated by scripts/updateTracker.js. Tracker history remains final-only; pending snapshot rows are graded into data/tracker.json only after games are final.',
    drp: [], kprop: [], hr: [], debug: { previousSnapshotDate: snap.date || null }
  };
  next.drp = Array.isArray(next.drp) ? next.drp.filter(r => r.date === date) : [];
  next.kprop = Array.isArray(next.kprop) ? next.kprop.filter(r => r.date === date) : [];
  next.hr = Array.isArray(next.hr) ? next.hr.filter(r => r.date === date) : [];
  let drpCreated = 0, kCreated = 0, hrCreated = 0;
  if (!next.drp.length) { next.drp = await buildDrpSnapshot(date); drpCreated = next.drp.length; }
  if (!next.kprop.length) { next.kprop = await buildKPropSnapshot(date); kCreated = next.kprop.length; }
  if (!next.hr.length) { next.hr = buildHrSnapshotFromLineups(date); hrCreated = next.hr.length; }
  next.version = Math.max(Number(next.version || 0), 3);
  next.generatedAt = nowIso();
  next.date = date;
  next.mode = 'auto-snapshot';
  next.debug = {
    ...(next.debug || {}),
    drpRowsCreated: drpCreated,
    kpropRowsCreated: kCreated,
    hrRowsCreated: hrCreated,
    kpropAutoSnapshotSupported: true,
    hrAutoSnapshotSupported: true,
    lineupsSource: 'data/lineups.json'
  };
  writeJson(snapshotPath, next);
  return { snapshot: next, created: !sameDay || drpCreated > 0 || kCreated > 0 || hrCreated > 0, drpCreated, kCreated, hrCreated };
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

async function gradeKPropSnapshot(snapshotRows){
  const dates = [...new Set((snapshotRows || []).map(r => r.date || todayCT()))];
  const schedules = new Map();
  const boxscores = new Map();
  for (const d of dates) { try { schedules.set(d, await fetchMlbSchedule(d)); } catch (e) { console.warn(e.message || e); schedules.set(d, []); } }
  const graded = [];
  for (const rec of snapshotRows || []) {
    const date = rec.date || todayCT();
    const games = schedules.get(date) || [];
    const game = rec.gamePk ? games.find(g => String(g.gamePk) === String(rec.gamePk)) : null;
    if (!game || !game.isFinal) continue;
    if (!boxscores.has(game.gamePk)) boxscores.set(game.gamePk, await fetchBoxscore(game.gamePk));
    const finalKCount = pitcherFinalKs(boxscores.get(game.gamePk), rec.pitcherId);
    if (finalKCount == null) continue;
    const drLine = num(rec.drLine ?? rec.line, null);
    if (drLine == null) continue;
    const pick = String(rec.pick || '').toUpperCase();
    let result = 'pending';
    if (pick === 'OVER') result = finalKCount > drLine ? 'win' : finalKCount < drLine ? 'loss' : 'pending';
    if (pick === 'UNDER') result = finalKCount < drLine ? 'win' : finalKCount > drLine ? 'loss' : 'pending';
    if (!['win','loss'].includes(result)) continue;
    graded.push({
      ...rec,
      type:'kprop',
      result,
      finalKCount,
      overDrLine: finalKCount > drLine ? 'Y' : 'N',
      finalScore: `${game.away} ${game.awayScore} - ${game.home} ${game.homeScore}`,
      gradedAt: nowIso(),
      gradingSource:'mlb-stats-api-boxscore',
      key: `${date}|KPROP|${game.gamePk}|${rec.pitcherId || rec.label}`
    });
  }
  return graded;
}
async function gradeHrSnapshot(snapshotRows){
  const dates = [...new Set((snapshotRows || []).map(r => r.date || todayCT()))];
  const schedules = new Map();
  const boxscores = new Map();
  for (const d of dates) { try { schedules.set(d, await fetchMlbSchedule(d)); } catch (e) { console.warn(e.message || e); schedules.set(d, []); } }
  const graded = [];
  for (const rec of snapshotRows || []) {
    const date = rec.date || todayCT();
    const games = schedules.get(date) || [];
    const game = rec.gamePk ? games.find(g => String(g.gamePk) === String(rec.gamePk)) : null;
    if (!game || !game.isFinal) continue;
    if (!boxscores.has(game.gamePk)) boxscores.set(game.gamePk, await fetchBoxscore(game.gamePk));
    const finalHR = batterFinalHrs(boxscores.get(game.gamePk), rec.playerId);
    graded.push({
      ...rec,
      type:'hr',
      final:true,
      hit: finalHR > 0,
      result: finalHR > 0 ? 'win':'loss',
      finalHR,
      finalScore: `${game.away} ${game.awayScore} - ${game.home} ${game.homeScore}`,
      gradedAt: nowIso(),
      gradingSource:'mlb-stats-api-boxscore',
      key: `${date}|HR|${game.gamePk}|${rec.playerId || String(rec.player || '').toLowerCase()}`
    });
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
  const gradedK = await gradeKPropSnapshot(snapshotK);
  const gradedHr = await gradeHrSnapshot(snapshotHr);
  for (const row of gradedDrp) if (upsertFinalRow(tracker.market.drp, row, 'DRP')) addedDrp++;
  for (const row of gradedK) if (upsertFinalRow(tracker.market.kprop, { ...row, type:'kprop', gradedAt: row.gradedAt || now }, 'KPROP')) addedK++;
  for (const row of gradedHr) {
    const out = { ...row, date: row.date || date, final: true, hit: row.hit === true || normResult(row.result) === 'win', gradedAt: row.gradedAt || now };
    out.key = out.key || `${out.date}|HR|${out.gamePk || ''}|${out.playerId || String(out.player || '').toLowerCase()}`;
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
    snapshotRowsCreatedThisRun: { drp: snapInfo.drpCreated, kprop: snapInfo.kCreated || 0, hr: snapInfo.hrCreated || 0 },
    snapshotRowsSeen: { drp: snapshotDrp.length, kprop: snapshotK.length, hr: snapshotHr.length },
    rowsAddedOrUpdated: { drp: addedDrp, kprop: addedK, hr: addedHr },
    allTimeSummaryUpdatedAt: now
  };
  writeJson(trackerPath, tracker);

  const daily = readJson(dailyPath, { version:1, results:[] });
  daily.version ||= 1; daily.results ||= []; daily.lastCheckedAt = now; daily.currentDateCT = date; writeJson(dailyPath, daily);
  const model = readJson(modelPath, { version:1, notes:[] });
  model.version ||= 1; model.generatedAt = now; model.notes ||= [];
  model.notes = ['Tracker sync uses final-only historical rows.', 'DR Picks, K Props, and HR picks are auto-snapshotted if data/today-predictions.json is missing rows for the day.', 'K Props are graded from final boxscore strikeouts. HR picks are graded from final boxscore home runs.'];
  writeJson(modelPath, model);
  console.log(`Tracker sync complete. Snapshot ${snapInfo.created ? 'created' : 'existing'}: DRP=${snapshotDrp.length}, K=${snapshotK.length}, HR=${snapshotHr.length}. Added/updated: DRP=${addedDrp}, K=${addedK}, HR=${addedHr}. Totals: DRP ${tracker.allTime.drp.wins}-${tracker.allTime.drp.losses}, K ${tracker.allTime.kprop.wins}-${tracker.allTime.kprop.losses}, HR ${tracker.allTime.hr.wins}-${tracker.allTime.hr.losses}.`);
}
main().catch(err => { console.error(err); process.exit(1); });
