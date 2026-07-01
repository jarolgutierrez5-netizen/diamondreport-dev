#!/usr/bin/env node
/*
  DEV DR DIE v8.6 - Tracker Snapshot Pipeline

  Final-only Tracker rule:
  - data/tracker.json stores finalized graded history only.
  - data/today-predictions.json stores the pregame/current-day prediction snapshot.
  - This script grades any snapshot rows whose games are final, appends only win/loss rows,
    and leaves pending predictions out of tracker.json.

  If tracker.json is 0-0 and today-predictions.json is empty, the workflow is working but
  there is nothing to grade yet. Create/populate the prediction snapshot before games finish.
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
function normalizeTeam(t){ return String(t || '').trim().toUpperCase().replace('WSN','WSH').replace('AZ','ARI').replace('CHW','CWS').replace('OAK','ATH'); }
function normResult(v){ const s = String(v || '').toLowerCase(); if (['win','right','hit','correct'].includes(s)) return 'win'; if (['loss','wrong','miss','incorrect'].includes(s)) return 'loss'; return 'pending'; }
function isWinLoss(r){ return r && (normResult(r.result ?? r.status ?? r.outcome ?? r.grade) === 'win' || normResult(r.result ?? r.status ?? r.outcome ?? r.grade) === 'loss'); }
function finalRows(rows){ return (rows || []).filter(isWinLoss).map(r => ({ ...r, result: normResult(r.result ?? r.status ?? r.outcome ?? r.grade) })); }
function summaryFromRows(rows){ const final = finalRows(rows); const wins = final.filter(r => r.result === 'win').length; return { wins, losses: Math.max(final.length - wins, 0), total: final.length }; }
function keyOf(row, type){ return row.key || `${row.date || todayCT()}|${type}|${row.label || row.player || row.pitcher || row.game || ''}|${row.pick || ''}`; }
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
async function fetchMlbSchedule(date){
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=team`;
  const res = await fetch(url, { headers: { accept:'application/json' } });
  if (!res.ok) throw new Error(`MLB schedule fetch failed for ${date}: ${res.status}`);
  const json = await res.json();
  const games = [];
  for (const d of json.dates || []) for (const g of d.games || []) {
    const state = String(g.status?.detailedState || g.status?.abstractGameState || '').toLowerCase();
    const isFinal = state.includes('final') || state.includes('completed');
    const away = normalizeTeam(g.teams?.away?.team?.abbreviation);
    const home = normalizeTeam(g.teams?.home?.team?.abbreviation);
    const awayScore = Number(g.teams?.away?.score);
    const homeScore = Number(g.teams?.home?.score);
    if (!away || !home || Number.isNaN(awayScore) || Number.isNaN(homeScore)) continue;
    games.push({ away, home, awayScore, homeScore, isFinal, winner: awayScore > homeScore ? away : home });
  }
  return games;
}
function findGame(games, a, b){ a = normalizeTeam(a); b = normalizeTeam(b); return games.find(g => (g.away === a && g.home === b) || (g.away === b && g.home === a)); }
async function gradeDrpSnapshot(snapshotRows){
  const dates = [...new Set((snapshotRows || []).map(r => r.date || todayCT()))];
  const schedules = new Map();
  for (const d of dates) { try { schedules.set(d, await fetchMlbSchedule(d)); } catch (e) { console.warn(e.message || e); schedules.set(d, []); } }
  const graded = [];
  for (const rec of snapshotRows || []) {
    const date = rec.date || todayCT();
    const [a,b] = extractTeams(rec);
    if (!a || !b) continue;
    const game = findGame(schedules.get(date) || [], a, b);
    if (!game || !game.isFinal) continue;
    const pick = normalizeTeam(rec.pick);
    graded.push({ ...rec, type:'drp', date, result: pick === game.winner ? 'win':'loss', finalWinner: game.winner, finalScore: `${game.away} ${game.awayScore} - ${game.home} ${game.homeScore}`, gradedAt: nowIso(), gradingSource:'mlb-stats-api-final-score', key: rec.key || `${date}|DRP|${[a,b].sort().join('-')}` });
  }
  return graded;
}
function buildTrackerBase(existing){
  const t = existing || {};
  t.version = Math.max(Number(t.version || 0), 6);
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
  const tracker = buildTrackerBase(readJson(trackerPath, {}));
  const snap = readJson(snapshotPath, { drp:[], kprop:[], hr:[] });
  const snapshotDrp = Array.isArray(snap.drp) ? snap.drp : [];
  const snapshotK = Array.isArray(snap.kprop) ? snap.kprop : [];
  const snapshotHr = Array.isArray(snap.hr) ? snap.hr : [];

  let addedDrp = 0, addedK = 0, addedHr = 0;
  const gradedDrp = await gradeDrpSnapshot(snapshotDrp);
  for (const row of gradedDrp) if (upsertFinalRow(tracker.market.drp, row, 'DRP')) addedDrp++;

  // K/HR require final counts/result already present in snapshot. Pending rows are intentionally skipped.
  for (const row of finalRows(snapshotK)) if (upsertFinalRow(tracker.market.kprop, { ...row, type:'kprop', gradedAt: row.gradedAt || now }, 'KPROP')) addedK++;
  for (const row of (snapshotHr || []).filter(r => r.final === true || isWinLoss(r))) {
    const out = { ...row, date: row.date || todayCT(), final: true, hit: row.hit === true || normResult(row.result) === 'win', gradedAt: row.gradedAt || now };
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
    trackingMode: 'final-only-with-prediction-snapshot',
    pendingRowsAllowed: false,
    localStorageHistoryAllowed: false,
    lastGithubActionRun: now,
    currentDateCT: todayCT(),
    lastSnapshotSource: 'data/today-predictions.json',
    snapshotRowsSeen: { drp: snapshotDrp.length, kprop: snapshotK.length, hr: snapshotHr.length },
    rowsAddedOrUpdated: { drp: addedDrp, kprop: addedK, hr: addedHr },
    allTimeSummaryUpdatedAt: now
  };
  writeJson(trackerPath, tracker);

  const daily = readJson(dailyPath, { version:1, results:[] });
  daily.version ||= 1; daily.results ||= []; daily.lastCheckedAt = now; daily.currentDateCT = todayCT(); writeJson(dailyPath, daily);
  const model = readJson(modelPath, { version:1, notes:[] });
  model.version ||= 1; model.generatedAt = now; model.notes ||= [];
  model.notes = ['Tracker sync uses final-only historical rows.', 'Predictions must be snapshotted before grading via data/today-predictions.json.'];
  writeJson(modelPath, model);

  console.log(`Tracker sync complete. Snapshot seen: DRP=${snapshotDrp.length}, K=${snapshotK.length}, HR=${snapshotHr.length}. Added/updated: DRP=${addedDrp}, K=${addedK}, HR=${addedHr}. Totals: DRP ${tracker.allTime.drp.wins}-${tracker.allTime.drp.losses}, K ${tracker.allTime.kprop.wins}-${tracker.allTime.kprop.losses}, HR ${tracker.allTime.hr.wins}-${tracker.allTime.hr.losses}.`);
  if (!snapshotDrp.length && !snapshotK.length && !snapshotHr.length) {
    console.warn('No prediction snapshot rows found. This is why Tracker remains 0-0. Populate data/today-predictions.json before games are graded.');
  }
}
main().catch(err => { console.error(err); process.exit(1); });
