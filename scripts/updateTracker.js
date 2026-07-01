#!/usr/bin/env node
/*
  Diamond Intelligence Engine v8.2
  Historical Tracker Final Grading

  Rule: tracker summaries are calculated from FINAL graded rows only.
  Pending rows never affect all-time counts. DR Picks are graded from MLB final scores.
*/
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const trackerPath = path.join(DATA_DIR, 'tracker.json');
const dailyPath = path.join(DATA_DIR, 'daily-results.json');
const modelPath = path.join(DATA_DIR, 'model-data.json');

function readJson(p, fallback){ try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } }
function writeJson(p, data){ fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n'); }
function todayCT(){ return new Intl.DateTimeFormat('en-CA', { timeZone:'America/Chicago', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date()); }
function isWinLoss(r){ return r && (String(r.result || '').toLowerCase() === 'win' || String(r.result || '').toLowerCase() === 'loss'); }
function summaryFromRows(rows){
  const final = (rows || []).filter(isWinLoss);
  const wins = final.filter(r => String(r.result).toLowerCase() === 'win').length;
  return { wins, losses: final.length - wins, total: final.length };
}
function normalizeTeam(t){
  return String(t || '').trim().toUpperCase().replace('WSN','WSH').replace('AZ','ARI').replace('CHW','CWS').replace('OAK','ATH');
}
function extractKeyTeams(rec){
  const teams = Array.isArray(rec.teams) ? rec.teams.map(normalizeTeam) : [];
  if (teams.length >= 2) return teams.slice(0,2);
  const keyPart = String(rec.key || '').split('|').pop() || '';
  if (keyPart.includes('-')) return keyPart.split('-').map(normalizeTeam).slice(0,2);
  const label = String(rec.label || '');
  if (label.includes('@')) return label.split('@').map(normalizeTeam).slice(0,2);
  return [];
}
async function fetchMlbSchedule(date){
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}&hydrate=team`;
  const res = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!res.ok) throw new Error(`MLB schedule fetch failed for ${date}: ${res.status}`);
  const json = await res.json();
  const games = [];
  for (const d of json.dates || []) {
    for (const g of d.games || []) {
      const status = String(g.status?.detailedState || g.status?.abstractGameState || '').toLowerCase();
      const isFinal = status.includes('final') || status.includes('completed');
      const away = normalizeTeam(g.teams?.away?.team?.abbreviation);
      const home = normalizeTeam(g.teams?.home?.team?.abbreviation);
      const awayScore = Number(g.teams?.away?.score);
      const homeScore = Number(g.teams?.home?.score);
      if (!away || !home || Number.isNaN(awayScore) || Number.isNaN(homeScore)) continue;
      games.push({ away, home, awayScore, homeScore, isFinal, winner: awayScore > homeScore ? away : home });
    }
  }
  return games;
}
function findGame(games, a, b){
  a = normalizeTeam(a); b = normalizeTeam(b);
  return games.find(g => (g.away === a && g.home === b) || (g.away === b && g.home === a));
}
async function gradeDrpRows(drpRows){
  const dates = [...new Set((drpRows || []).filter(r => !isWinLoss(r)).map(r => r.date).filter(Boolean))];
  const schedules = new Map();
  for (const date of dates) {
    try { schedules.set(date, await fetchMlbSchedule(date)); }
    catch (err) { console.warn(String(err.message || err)); schedules.set(date, []); }
  }
  let graded = 0;
  const now = new Date().toISOString();
  for (const rec of drpRows || []) {
    if (isWinLoss(rec) || !rec.date) continue;
    const [a,b] = extractKeyTeams(rec);
    if (!a || !b) continue;
    const game = findGame(schedules.get(rec.date) || [], a, b);
    if (!game || !game.isFinal) continue;
    const pick = normalizeTeam(rec.pick);
    rec.finalWinner = game.winner;
    rec.finalScore = `${game.away} ${game.awayScore} - ${game.home} ${game.homeScore}`;
    rec.result = pick === game.winner ? 'win' : 'loss';
    rec.gradedAt = now;
    rec.source = rec.source || 'repo-tracker';
    rec.gradingSource = 'mlb-stats-api-final-score';
    graded += 1;
  }
  return graded;
}

async function main(){
  const now = new Date().toISOString();
  const tracker = readJson(trackerPath, { version:4, generatedAt:null, picks:[], market:{drp:[], kprop:[]}, players:{}, teams:{}, days:{}, dailyResults:[], debug:{} });
  tracker.version = 4;
  tracker.picks ||= [];
  tracker.market ||= { drp: [], kprop: [] };
  tracker.market.drp ||= [];
  tracker.market.kprop ||= [];
  tracker.players ||= {};
  tracker.teams ||= {};
  tracker.days ||= {};
  tracker.dailyResults ||= [];
  tracker.allTime ||= {};
  tracker.debug ||= {};

  const gradedDrpCount = await gradeDrpRows(tracker.market.drp);

  const finalHr = tracker.picks.filter(p => p && p.final === true);
  const finalHrWins = finalHr.filter(p => p.hit === true).length;
  tracker.allTime.hr = { wins: finalHrWins, losses: Math.max(finalHr.length - finalHrWins, 0), total: finalHr.length };
  tracker.allTime.kprop = summaryFromRows(tracker.market.kprop);
  tracker.allTime.drp = summaryFromRows(tracker.market.drp);

  tracker.generatedAt = now;
  tracker.debug.lastGithubActionRun = now;
  tracker.debug.repoSync = true;
  tracker.debug.repoSyncNote = 'Historical tracker sync: only final graded records count toward all-time accuracy. Pending rows are ignored by summaries and hidden by the UI.';
  tracker.debug.currentDateCT = todayCT();
  tracker.debug.lastDrpRowsAutoGraded = gradedDrpCount;
  tracker.debug.allTimeSummaryUpdatedAt = now;
  writeJson(trackerPath, tracker);

  const daily = readJson(dailyPath, { version:1, results:[] });
  daily.version ||= 1;
  daily.results ||= [];
  daily.lastCheckedAt = now;
  daily.currentDateCT = todayCT();
  writeJson(dailyPath, daily);

  const model = readJson(modelPath, { version:1, generatedAt:null, teams:{}, players:{}, notes:[] });
  model.version ||= 1;
  model.generatedAt = now;
  model.notes ||= [];
  model.notes = [
    'Generated by GitHub Actions repo data sync.',
    'Tracker all-time summaries are calculated from final graded records only.',
    'DR Picks are graded from MLB final scores when available.'
  ];
  writeJson(modelPath, model);
  console.log(`Repo tracker sync complete: ${tracker.picks.length} HR picks, ${tracker.market.drp.length} DRP picks, ${tracker.market.kprop.length} K props. Auto-graded DRP: ${gradedDrpCount}.`);
}

main().catch(err => { console.error(err); process.exit(1); });
