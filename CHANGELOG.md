# Changelog

## v6.6 — Tracker Repository Timestamp + K Props Header Fix
- Renamed `K Projection for Game` column to `K Proj. For Game`.
- Added tracker top row for last repository stored/generated timestamp.
- Added Tracker title stability guard to prevent title flash/disappear behavior.
- Kept K Props accuracy logic from v6.5 intact.

## Version 6.8 – Tracker iPhone Repo Reload Accuracy Fix

- Fixed an iPhone/mobile issue where pressing “Reload Repo Data” could keep stale browser tracker totals.
- Reload Repo Data now clears current and legacy browser tracker caches before fetching fresh `data/tracker.json`.
- All-time Tracker cards now prefer detailed stored rows when available so displayed records match the actual records.
- Preserved repo-side tracker history and GitHub Actions workflow behavior.
