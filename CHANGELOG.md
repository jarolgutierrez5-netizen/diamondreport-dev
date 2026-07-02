# Changelog

## DEV-DR-DIE-v9.4-Tracker-Duplicate-Dedupe-Fix

### Fixed
- Prevented duplicate Diamond Report Picks rows/counts after workflow reruns.
- Added migration-safe dedupe for old DRP team-pair keys and newer `gamePk` keys.
- Added dedupe protection for K Props and HR tracker rows.

### Notes
- No UI files changed.
- No data files should be hand-edited.
- Run the tracker workflow once after upload to let the script clean/dedupe `data/tracker.json` automatically.
