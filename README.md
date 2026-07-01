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
