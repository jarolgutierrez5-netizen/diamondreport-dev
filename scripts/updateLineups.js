#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const API = 'https://statsapi.mlb.com/api/v1';
const outPath = path.join(process.cwd(), 'data', 'lineups.json');
const season = new Date().getFullYear();
const MIN_OFFICIAL_BATTERS = 9;

function todayCentral() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

async function getJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'DiamondReport-LineupWatcher/3.3' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

function readExisting() {
  try {
    if (!fs.existsSync(outPath)) return null;
    return JSON.parse(fs.readFileSync(outPath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function battingStat(playerObj) {
  return playerObj?.seasonStats?.batting || playerObj?.stats?.batting || {};
}

function normalizeBoxscoreBatter(playerObj, idx) {
  const person = playerObj?.person || {};
  const stat = battingStat(playerObj);
  return {
    order: idx + 1,
    id: person.id || null,
    name: person.fullName || 'TBD',
    pos: playerObj?.position?.abbreviation || '–',
    stats: stat,
    todayHR: Number(playerObj?.stats?.batting?.homeRuns || 0),
    confirmed: true,
    source: 'MLB boxscore batting order'
  };
}

function normalizeRosterBatter(rosterEntry, idx) {
  const stat = rosterEntry?.stats?.[0]?.splits?.[0]?.stat || {};
  return {
    order: idx + 1,
    id: rosterEntry?.person?.id || null,
    name: rosterEntry?.person?.fullName || 'TBD',
    pos: rosterEntry?.position?.abbreviation || '–',
    stats: stat,
    todayHR: 0,
    confirmed: false,
    source: 'active-roster projection'
  };
}

function compactLineupKey(lineup) {
  return (lineup || []).map(p => `${p.order}:${p.id || p.name}`).join('|');
}

async function getProjectedLineup(teamId) {
  const rosterUrl = `${API}/teams/${teamId}/roster?rosterType=active&hydrate=stats(group=hitting,type=season,season=${season})`;
  const data = await getJson(rosterUrl);
  return (data.roster || [])
    .filter(p => !['P', 'TWP'].includes(p.position?.abbreviation))
    .sort((a, b) => Number(b.stats?.[0]?.splits?.[0]?.stat?.atBats || 0) - Number(a.stats?.[0]?.splits?.[0]?.stat?.atBats || 0))
    .slice(0, 9)
    .map(normalizeRosterBatter);
}

function getPreviousTeam(existing, gamePk, side) {
  return existing?.games?.[String(gamePk)]?.teams?.[side] || null;
}

async function buildTeamLineup({ box, side, teamId, previousTeam }) {
  const teamBox = box?.teams?.[side];
  const official = (teamBox?.batters || [])
    .map(id => teamBox.players?.[`ID${id}`])
    .filter(Boolean)
    .slice(0, 9)
    .map(normalizeBoxscoreBatter);

  if (official.length >= MIN_OFFICIAL_BATTERS) {
    return {
      lineup: official,
      source: 'confirmed MLB batting lineup',
      confirmed: true,
      confirmedAt: previousTeam?.confirmed && compactLineupKey(previousTeam.lineup) === compactLineupKey(official)
        ? previousTeam.confirmedAt
        : new Date().toISOString()
    };
  }

  // If a lineup was confirmed earlier today and the current API response is incomplete,
  // preserve the confirmed lineup instead of downgrading it back to projected.
  if (previousTeam?.confirmed && Array.isArray(previousTeam.lineup) && previousTeam.lineup.length >= MIN_OFFICIAL_BATTERS) {
    return {
      lineup: previousTeam.lineup,
      source: previousTeam.source || 'confirmed MLB batting lineup',
      confirmed: true,
      confirmedAt: previousTeam.confirmedAt || new Date().toISOString(),
      preservedFromPreviousRun: true
    };
  }

  try {
    return {
      lineup: await getProjectedLineup(teamId),
      source: 'projected active-roster lineup',
      confirmed: false,
      confirmedAt: null
    };
  } catch (e) {
    return {
      lineup: previousTeam?.lineup || [],
      source: previousTeam?.source || 'unavailable',
      confirmed: Boolean(previousTeam?.confirmed),
      confirmedAt: previousTeam?.confirmedAt || null,
      error: e.message
    };
  }
}

async function main() {
  const date = process.env.LINEUP_DATE || todayCentral();
  const existing = readExisting();
  const scheduleUrl = `${API}/schedule?sportId=1&date=${date}&hydrate=team,probablePitcher&language=en`;
  const sched = await getJson(scheduleUrl);
  const games = sched.dates?.[0]?.games || [];

  const output = {
    version: 3,
    date,
    generatedAt: new Date().toISOString(),
    timezone: 'America/Chicago',
    status: {
      allConfirmed: false,
      confirmedTeams: 0,
      totalTeams: games.length * 2,
      pendingTeams: games.length * 2,
      confirmedGames: 0,
      totalGames: games.length,
      message: 'Checking MLB batting lineups hourly until all teams are confirmed.'
    },
    note: 'Official MLB batting order is used as soon as the Stats API boxscore exposes at least nine batters. Until then, a projected active-roster lineup is stored so HR Projections and Pitcher Reports still have usable player data.',
    games: {}
  };

  for (const game of games) {
    const gamePk = String(game.gamePk);
    const away = game.teams?.away?.team || {};
    const home = game.teams?.home?.team || {};

    output.games[gamePk] = {
      gamePk: game.gamePk,
      date,
      gameDate: game.gameDate,
      status: game.status?.detailedState || game.status?.abstractGameState || 'Scheduled',
      matchup: `${away.abbreviation || away.name} @ ${home.abbreviation || home.name}`,
      allLineupsConfirmed: false,
      teams: {
        away: { id: away.id, abbr: away.abbreviation || away.name, name: away.name, lineup: [], source: 'unavailable', confirmed: false },
        home: { id: home.id, abbr: home.abbreviation || home.name, name: home.name, lineup: [], source: 'unavailable', confirmed: false }
      }
    };

    let box = null;
    try { box = await getJson(`${API}/game/${game.gamePk}/boxscore`); } catch (e) {
      output.games[gamePk].boxscoreError = e.message;
    }

    for (const side of ['away', 'home']) {
      const teamId = output.games[gamePk].teams[side].id;
      const previousTeam = getPreviousTeam(existing, gamePk, side);
      const built = await buildTeamLineup({ box, side, teamId, previousTeam });
      output.games[gamePk].teams[side] = {
        ...output.games[gamePk].teams[side],
        ...built
      };
      if (built.confirmed) output.status.confirmedTeams += 1;
    }

    output.games[gamePk].allLineupsConfirmed =
      output.games[gamePk].teams.away.confirmed && output.games[gamePk].teams.home.confirmed;
    if (output.games[gamePk].allLineupsConfirmed) output.status.confirmedGames += 1;
  }

  output.status.pendingTeams = output.status.totalTeams - output.status.confirmedTeams;
  output.status.allConfirmed = output.status.totalTeams > 0 && output.status.confirmedTeams === output.status.totalTeams;
  output.status.message = output.status.allConfirmed
    ? 'All MLB batting lineups are confirmed. HR Projections and Pitcher Reports can use official lineups.'
    : `${output.status.pendingTeams} team lineup(s) still projected. The hourly GitHub Action will keep checking.`;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Saved ${Object.keys(output.games).length} games to data/lineups.json for ${date}`);
  console.log(output.status.message);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
