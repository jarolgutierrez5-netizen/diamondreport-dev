# Changelog

## DEV-DR-DIE-v9.2-Add-Tracker-Tab

- Added/confirmed Tracker tab in Developer navigation.
- Preserved Tracker page section and existing repository-source display logic.
- Kept layout formatting merge from v9.1.
- No data reset and no engine changes.


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


## DEV-DR-DIE-v9.1-Layout-Formatting-Merge

- Merged layout formatting from uploaded `index(22).html` into the Developer stylesheet.
- Preserved Developer Tracker and workflow functionality.
- Added stylesheet cache busting to `index.html`.
- Included v9.0 workflow consolidation updates so Tracker automation remains aligned.
