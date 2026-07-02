#!/usr/bin/env node
/**
 * sync-pitcher-statcast.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Syncs REAL per-pitcher Statcast data from Baseball Savant for today's
 * probable starters, and writes it to data/pitcher-statcast.json.
 *
 * The Diamond Report front-end (Pitcher Matchup modal) reads this file to
 * replace its modeled strike-zone grid and league-typical pitch mix with the
 * pitcher's actual measured data:
 *   • Pitch mix: real usage%, average velocity, wOBA against per pitch type
 *   • Zone grid: wOBA against in each of the 9 strike-zone cells
 *   • Hard-hit% allowed
 *
 * If this file is missing or a pitcher isn't in it, the front-end silently
 * falls back to its modeled estimates — so this script failing can never
 * break the site.
 *
 * Runs server-side (GitHub Actions), where Baseball Savant's CSV endpoints
 * are reachable (they are not CORS-enabled for browsers).
 *
 * No dependencies — Node 18+ (built-in fetch).
 *
 * Usage:  node scripts/sync-pitcher-statcast.mjs
 * Output: data/pitcher-statcast.json
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_PATH = path.join(process.cwd(), 'data', 'pitcher-statcast.json');
const DELAY_MS = 3000;        // be polite to Savant between requests
const FETCH_TIMEOUT_MS = 45000;
const MAX_PITCHERS = 40;      // safety cap (a full slate is ~30 probables)
const UA = 'DiamondReport/1.0 (data sync; contact site owner)';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function currentSeason() {
  const now = new Date();
  // Jan/Feb → previous season's data is the most recent meaningful sample
  return now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
}

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
  } finally {
    clearTimeout(t);
  }
}

async function fetchWithRetry(url, tries = 2) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await sleep(5000);
    }
  }
  throw lastErr;
}

/** Minimal CSV parser that handles quoted fields containing commas. */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); field = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Today's probable starting pitchers from the official MLB Stats API. */
async function getTodaysProbablePitchers() {
  const today = new Date().toISOString().slice(0, 10);
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=probablePitcher`;
  const res = await fetchWithRetry(url);
  const data = await res.json();
  const pitchers = new Map(); // id -> name
  for (const day of data.dates || []) {
    for (const game of day.games || []) {
      for (const side of ['away', 'home']) {
        const pp = game.teams?.[side]?.probablePitcher;
        if (pp?.id) pitchers.set(pp.id, pp.fullName || '');
      }
    }
  }
  return pitchers;
}

/** Season pitch-by-pitch CSV for one pitcher from Baseball Savant. */
async function fetchPitcherSeasonCSV(pitcherId, season) {
  const params = new URLSearchParams({
    all: 'true',
    hfGT: 'R|',                       // regular season
    hfSea: `${season}|`,
    player_type: 'pitcher',
    min_pitches: '0',
    min_results: '0',
    group_by: 'name',
    sort_col: 'pitches',
    player_event_sort: 'api_p_release_speed',
    sort_order: 'desc',
    min_pas: '0',
    type: 'details',                  // pitch-by-pitch rows
  });
  // pitchers_lookup[] needs the literal bracket form Savant expects
  const url = `https://baseballsavant.mlb.com/statcast_search/csv?${params.toString()}&pitchers_lookup%5B%5D=${pitcherId}`;
  const res = await fetchWithRetry(url);
  return res.text();
}

/**
 * Aggregate one pitcher's pitch-by-pitch rows into:
 *   byPitch  – usage%, avg velo, wOBA against, xwOBA on contact, per pitch type
 *   byZone   – wOBA against per Statcast strike-zone cell (1–9)
 *   hardHitPctAllowed
 *
 * Statcast zone numbering (catcher's view): 1-2-3 top row, 4-5-6 middle,
 * 7-8-9 bottom. Zones 11–14 are out of the strike zone and excluded from
 * the grid (front-end shows the 3×3 in-zone grid).
 */
function aggregate(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return null;
  const header = rows[0];
  const col = name => header.indexOf(name);
  const iPitchType = col('pitch_type');
  const iPitchName = col('pitch_name');
  const iVelo      = col('release_speed');
  const iZone      = col('zone');
  const iWobaVal   = col('woba_value');
  const iWobaDen   = col('woba_denom');
  const iXwoba     = col('estimated_woba_using_speedangle');
  const iLaunchSpd = col('launch_speed');
  const iType      = col('type'); // S/B/X — X = ball in play

  const byPitch = new Map();
  const byZone = {};
  for (let z = 1; z <= 9; z++) byZone[z] = { pitches: 0, wobaSum: 0, wobaDen: 0, xwobaSum: 0, xwobaN: 0 };
  let total = 0, ballsInPlay = 0, hardHit = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < header.length - 2) continue;
    total++;

    const pt = row[iPitchType] || '??';
    if (!byPitch.has(pt)) byPitch.set(pt, { code: pt, name: row[iPitchName] || pt, pitches: 0, veloSum: 0, veloN: 0, wobaSum: 0, wobaDen: 0, xwobaSum: 0, xwobaN: 0 });
    const p = byPitch.get(pt);
    p.pitches++;

    const velo = parseFloat(row[iVelo]);
    if (!isNaN(velo)) { p.veloSum += velo; p.veloN++; }

    const wv = parseFloat(row[iWobaVal]);
    const wd = parseFloat(row[iWobaDen]);
    if (!isNaN(wv) && !isNaN(wd) && wd > 0) { p.wobaSum += wv; p.wobaDen += wd; }

    const xw = parseFloat(row[iXwoba]);
    if (!isNaN(xw)) { p.xwobaSum += xw; p.xwobaN++; }

    const zone = parseInt(row[iZone]);
    if (zone >= 1 && zone <= 9) {
      const z = byZone[zone];
      z.pitches++;
      if (!isNaN(wv) && !isNaN(wd) && wd > 0) { z.wobaSum += wv; z.wobaDen += wd; }
      if (!isNaN(xw)) { z.xwobaSum += xw; z.xwobaN++; }
    }

    if (row[iType] === 'X') {
      ballsInPlay++;
      const ls = parseFloat(row[iLaunchSpd]);
      if (!isNaN(ls) && ls >= 95) hardHit++;
    }
  }

  if (total < 50) return null; // too small a sample to be worth publishing

  const round3 = v => Math.round(v * 1000) / 1000;
  const pitchOut = [...byPitch.values()]
    .filter(p => p.pitches >= Math.max(10, total * 0.02)) // drop trace pitch types
    .sort((a, b) => b.pitches - a.pitches)
    .slice(0, 7)
    .map(p => ({
      code: p.code,
      name: p.name,
      pitches: p.pitches,
      usagePct: Math.round((p.pitches / total) * 1000) / 10,
      avgVelo: p.veloN ? Math.round((p.veloSum / p.veloN) * 10) / 10 : null,
      wobaAgainst: p.wobaDen >= 10 ? round3(p.wobaSum / p.wobaDen) : null,
      xwobaContact: p.xwobaN >= 10 ? round3(p.xwobaSum / p.xwobaN) : null,
    }));

  const zoneOut = {};
  for (let z = 1; z <= 9; z++) {
    const zz = byZone[z];
    zoneOut[z] = {
      pitches: zz.pitches,
      paEnding: Math.round(zz.wobaDen),
      wobaAgainst: zz.wobaDen >= 8 ? round3(zz.wobaSum / zz.wobaDen) : null, // null = sample too small, front-end falls back
      xwobaContact: zz.xwobaN >= 8 ? round3(zz.xwobaSum / zz.xwobaN) : null,
    };
  }

  return {
    totalPitches: total,
    hardHitPctAllowed: ballsInPlay >= 25 ? Math.round((hardHit / ballsInPlay) * 1000) / 10 : null,
    byPitch: pitchOut,
    byZone: zoneOut,
  };
}

async function main() {
  const season = currentSeason();
  console.log(`Syncing per-pitcher Statcast data · season ${season}`);

  const probables = await getTodaysProbablePitchers();
  console.log(`Today's probable pitchers: ${probables.size}`);
  if (probables.size === 0) {
    console.log('No probables found (off day?) — leaving existing file untouched.');
    return;
  }

  const pitchers = {};
  let done = 0;
  for (const [id, name] of [...probables].slice(0, MAX_PITCHERS)) {
    try {
      const csv = await fetchPitcherSeasonCSV(id, season);
      const agg = aggregate(csv);
      if (agg) {
        pitchers[String(id)] = { name, ...agg };
        console.log(`  ✓ ${name} (${id}) — ${agg.totalPitches} pitches, ${agg.byPitch.length} pitch types`);
      } else {
        console.log(`  – ${name} (${id}) — sample too small this season, skipped`);
      }
    } catch (e) {
      console.log(`  ✗ ${name} (${id}) — ${e.message}`);
    }
    done++;
    if (done < probables.size) await sleep(DELAY_MS);
  }

  const out = {
    generatedAt: new Date().toISOString(),
    season,
    source: 'baseballsavant.mlb.com statcast_search (pitch-by-pitch, regular season)',
    zoneNumbering: 'Statcast zones 1-9, catcher\'s view: 1-2-3 top row, 4-5-6 middle, 7-8-9 bottom',
    pitchers,
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`Wrote ${Object.keys(pitchers).length} pitchers → ${OUT_PATH}`);
}

main().catch(e => { console.error('Sync failed:', e); process.exit(1); });
