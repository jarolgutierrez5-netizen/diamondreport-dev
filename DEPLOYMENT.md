# DEV-DR-DIE-v8.6-Tracker-Snapshot-Pipeline

## Deployment Type
Scripts + Data Template

## Replace / Add
- `scripts/updateTracker.js`
- `scripts/update-tracker.mjs`
- `data/today-predictions.json`

## Leave Unchanged
- `index.html`
- `css/`
- `js/`
- `engine/`
- `config/`
- `.github/`

## Important
If `data/today-predictions.json` is empty, the workflow can run successfully but Tracker will remain 0-0 because there are no prediction rows to grade.
