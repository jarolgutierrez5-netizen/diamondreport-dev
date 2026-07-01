# Diamond Intelligence Engine (DIE)
## v8.2 – Tracker Final Grading Update

This release updates the historical Tracker pipeline so Diamond Report Picks can be graded from final MLB scores and all-time records are calculated from final graded rows only.

## Key Updates
- 6/30 Diamond Report Picks are finalized in `data/tracker.json`.
- `scripts/updateTracker.js` now grades pending DR Picks from MLB final scores when available.
- Pending rows do not count toward all-time summaries.
- Repository remains the source of truth for Tracker history.

## Deployment Type
🟡 Tracker Data + Script Update

Upload:
- `data/tracker.json`
- `scripts/updateTracker.js`

No `index.html` change is required for this release.
