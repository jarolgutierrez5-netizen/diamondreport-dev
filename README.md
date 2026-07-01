# Diamond Intelligence Engine (DIE)

## Version 8.3 — Tracker Reset / Final-Only Baseline

This release resets the Tracker historical database so DIE starts clean from the reset date forward.

## What Changed

- Reset `data/tracker.json` to a clean baseline.
- Cleared prior HR, K Props, Diamond Report Picks, player, team, and daily historical records.
- Preserved the final-only Tracker architecture.
- Tracker should store/display only finalized graded records going forward.
- Pending and Wait Final rows should not be stored as historical Tracker records.

## Reset Details

- Reset date: `2026-07-01`
- Reset time: `2026-07-01T16:06:52Z`
- All-time HR record: `0-0`
- All-time K Props record: `0-0`
- All-time Diamond Report Picks record: `0-0`

## Deployment Type

Tracker data/script update.

Replace only:

```text
data/tracker.json
scripts/updateTracker.js
```

Optional documentation files included:

```text
README.md
CHANGELOG.md
DEPLOYMENT.md
```

Do not replace `index.html`, `css/`, `js/`, `engine/`, `config/`, or `.github/` for this reset.
