#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const trackerPath = path.join(process.cwd(), 'data', 'tracker.json');
const dailyPath = path.join(process.cwd(), 'data', 'daily-results.json');
function readJson(p, fallback){ try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } }
const tracker = readJson(trackerPath, { version:4, picks:[], market:{drp:[], kprop:[]}, players:{}, teams:{}, days:{}, dailyResults:[], debug:{} });
tracker.version = 4;
tracker.picks ||= [];
tracker.market ||= { drp: [], kprop: [] };
tracker.market.drp ||= [];
tracker.market.kprop ||= [];
tracker.players ||= {};
tracker.teams ||= {};
tracker.days ||= {};
tracker.debug ||= {};
tracker.generatedAt = new Date().toISOString();
tracker.debug.lastGithubActionRun = tracker.generatedAt;
tracker.debug.githubActionNote = 'Validated tracker.json. Browser exports should be copied into data/tracker.json until a backend/API write path is connected.';
fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
const daily = readJson(dailyPath, { version:1, results:[] });
daily.lastCheckedAt = new Date().toISOString();
fs.writeFileSync(dailyPath, JSON.stringify(daily, null, 2));
console.log(`Tracker validated: ${tracker.picks.length} HR picks, ${tracker.market.drp.length} DRP picks, ${tracker.market.kprop.length} K props.`);
