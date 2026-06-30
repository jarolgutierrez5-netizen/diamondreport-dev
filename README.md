# Diamond Report V3.4 — Repo Sync + Hourly Lineup Watch

This build disables automatic browser backup downloads.

## What changed

- Tracker no longer auto-downloads `Tracker-auto-backup-YYYY-MM-DD.json` when the Tracker tab opens.
- The site still keeps a local safety snapshot in browser storage.
- Repo-side files are updated by GitHub Actions.
- Hourly lineup checks continue to update `data/lineups.json` until official lineups are available.

## Files to upload/replace

```text
index.html
README.md
scripts/updateTracker.js
scripts/updateLineups.js
.github/workflows/tracker-update.yml
.github/workflows/lineup-update.yml
data/tracker.json
data/daily-results.json
data/model-data.json
data/lineups.json
```

## How it works

- `data/tracker.json` is the source of truth for all-time Tracker data across devices.
- `data/lineups.json` is the source of truth for confirmed/projected batting lineups.
- GitHub Actions writes data changes back to the repo and GitHub Pages redeploys.
- The browser reads repo JSON files and no longer automatically downloads backup files.

## Manual backup

A manual backup button remains available for emergencies only. It will download only when clicked.

## V3.5 Tracker final-only accuracy optimization

The Tracker accuracy cards now use completed games only for their win/loss counts:

- Today's Top HR Threat Accuracy
- All-Time HR Accuracy
- Diamond Report Picks Today
- Diamond Report Picks All-Time
- K Props Today
- K Props All-Time

Upcoming and live games remain visible in the Tracker tables, but they are excluded from the numerator and denominator until a final result is available. The card subtitles show how many pending/not-final entries were excluded.
