# Deployment — DEV-DR-DIE-v9.4-Tracker-Duplicate-Dedupe-Fix

## Deployment Type
Tracker script only.

## Replace
- `scripts/updateTracker.js`
- `README.md`
- `CHANGELOG.md`
- `DEPLOYMENT.md`
- `DIE_ARCHITECTURE.md`

## Leave Unchanged
- `index.html`
- `css/`
- `js/`
- `engine/`
- `config/`
- `data/`
- `.github/`
- `scripts/update-tracker.mjs`

## After Upload
1. Commit the files.
2. Run **Update Diamond Report Tracker** manually.
3. Open the dev site Tracker tab.
4. Press **Reload Repo Data**.
5. Confirm Diamond Report Picks no longer shows duplicate rows/counts.
