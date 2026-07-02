# Diamond Intelligence Engine (DIE)

## Version 8.4 — Props Tab Responsive Layout Fix

This developer build updates the Props tab layout while preserving the v8.x modular foundation.

### Updated
- HR Potential and K's Today display next to each other on mobile and laptop.
- HR's Today and HRs Completed From Projection display next to each other below the top row.
- Mobile spacing, typography, and internal scroll behavior were tightened to avoid page overflow.

### Deployment
Primary file to upload:
- `css/styles.css`

Optional documentation:
- `README.md`
- `CHANGELOG.md`
- `DEPLOYMENT.md`

Do not update data, scripts, workflows, engine, or config for this UI-only release.


## DEV-DR-DIE-v8.6 Tracker Snapshot Pipeline
The Tracker remains final-only. The workflow now grades finalized rows from `data/today-predictions.json` into `data/tracker.json`. If the snapshot file is empty, Tracker correctly remains 0-0 because there are no saved predictions to grade.


## DEV-DR-DIE-v9.2-Layout-Formatting-Merge

Developer-only layout formatting merge.

Changes:
- Imported the layout/mobile/tablet/desktop formatting from `index(22).html` into `css/styles.css`.
- Preserved the current Developer `index.html` Tracker, workflow, and data pipeline logic.
- Added CSS cache busting in `index.html` so the Developer site loads the updated stylesheet.
- Kept the v9.0 workflow consolidation files in place.

Deployment:
- Replace `index.html`
- Replace `css/styles.css`
- Replace `.github/workflows/update-tracker.yml`
- Replace `.github/workflows/tracker-update.yml`
- Replace `scripts/updateTracker.js`

Do not replace `data/`, `engine/`, `config/`, or `scripts/update-tracker.mjs`.


## DEV-DR-DIE-v9.2-Add-Tracker-Tab

- Confirmed Developer Tracker tab is included in navigation.
- Preserved Tracker section and repository-based Tracker display logic.
- Preserved workflow consolidation files from v9.1.
- No changes to data, engine, config, or js/app.js.
