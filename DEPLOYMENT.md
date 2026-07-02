# Deployment - DEV-DR-DIE-v9.5-Tracker-Push-Conflict-Fix

## Replace / upload
- `.github/workflows/update-tracker.yml`
- `.github/workflows/tracker-update.yml`
- `.github/workflows/lineup-update.yml`
- `.github/workflows/statcast-hot-hitters-update.yml`
- `scripts/updateTracker.js`
- `README.md`
- `CHANGELOG.md`
- `DEPLOYMENT.md`
- `DIE_ARCHITECTURE.md`

## Leave unchanged
- `index.html`
- `css/`
- `js/`
- `engine/`
- `config/`
- `data/`
- `scripts/update-tracker.mjs`

## After upload
1. Commit the files.
2. Go to GitHub Actions.
3. Cancel any currently running data workflows.
4. Run **Update Diamond Report Tracker** manually.
5. Confirm the workflow pushes successfully.
