# DEV DR DIE v9.4 - Tracker Duplicate Dedupe Fix

Developer-only release.

## Summary
Fixes duplicated rows/counts in **Diamond Report Picks — Daily + All-Time Accuracy** after workflow reruns.

## What changed
- Added final-row dedupe protection inside `scripts/updateTracker.js`.
- DR Picks now collapse old team-pair keys and newer `gamePk` keys for the same matchup/date.
- K Props and HR picks also get identity-based dedupe protection.
- Tracker remains final-only: no Pending / Wait Final rows are written to history.

## Upload
Replace only:
- `scripts/updateTracker.js`
- `README.md`
- `CHANGELOG.md`
- `DEPLOYMENT.md`
- `DIE_ARCHITECTURE.md`

Leave unchanged:
- `index.html`
- `css/`
- `js/`
- `engine/`
- `config/`
- `data/`
- `.github/`
- `scripts/update-tracker.mjs`
