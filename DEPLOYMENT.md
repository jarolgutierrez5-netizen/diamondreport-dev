# Deployment - DEV-DR-DIE-v9.6-Full-Slate-Snapshot-Fix

## Replace / upload
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
- `.github/`
- `scripts/update-tracker.mjs`

## After upload
1. Commit the files.
2. Go to GitHub Actions.
3. Run **Update Diamond Report Tracker** manually.
4. Open `data/today-predictions.json` and confirm the DRP row count increases to the full slate.
5. Open the dev site and press **Reload Repo Data**.
