
## DEV-DR-DIE-v8.6-Tracker-Snapshot-Pipeline
- Added `data/today-predictions.json` as the pregame/current-day prediction snapshot source.
- Updated tracker workflow script to grade finalized snapshot rows into `data/tracker.json`.
- Preserves final-only Tracker history while preventing 0-0 confusion when no snapshot exists.

# Changelog

## v8.4 — Props Tab Responsive Layout Fix
- Fixed Props tab layout for mobile, tablet, laptop, and desktop.
- HR Potential and K's Today now stay next to each other.
- HR's Today and HRs Completed From Projection now stay side by side below.
- Added compact mobile sizing so each panel remains readable without breaking the page width.
- Preserved v8.x modular architecture and Tracker reset baseline.
