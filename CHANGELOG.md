# Changelog

## DEV-DR-DIE-v9.3-HR-K-Tracker-Snapshot-Fix

### Added
- K Props snapshot generation from MLB probable starters.
- Final K Props grading from boxscore strikeout totals.
- HR pick snapshot generation from lineup data.
- Final HR grading from boxscore home run totals.

### Changed
- `scripts/updateTracker.js` now supports DR Picks, K Props, and HR tracking.
- `today-predictions.json` is augmented if the same-day snapshot exists but is missing HR/K rows.
- Tracker remains final-only and repository-first.

### Notes
- DR Picks tracking was already working and is preserved.
- K Props and HR rows begin appearing after snapshots exist and games become final.
