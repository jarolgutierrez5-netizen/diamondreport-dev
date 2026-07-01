# Diamond Intelligence Engine (DIE)
## Version 6.6 — Tracker Repository Timestamp + K Props Header Fix

This developer build continues tracker cleanup and accuracy verification work.

## Changes
- Shortened the K Props tracker column label from `K Projection for Game` to `K Proj. For Game`.
- Added a top tracker row showing when tracker data was last stored/generated for the repository.
- Stabilized the Tracker page title so `Diamond Report Tracker` does not briefly appear and then disappear during load.
- Preserved the v6.5 K Props status fix where status checks K Projection vs Final K Count.
- Preserved separate DR Line and Over DR Line tracking.

## Notes
- Tracker repository timestamp reads from tracker data metadata when available.
- If repository metadata is not available, the tracker shows a clear fallback message instead of leaving the row blank.

## Version
v6.6 Developer Build

## Version 6.8 – Tracker iPhone Repo Reload Accuracy Fix

- Fixed an iPhone/mobile issue where pressing “Reload Repo Data” could keep stale browser tracker totals.
- Reload Repo Data now clears current and legacy browser tracker caches before fetching fresh `data/tracker.json`.
- All-time Tracker cards now prefer detailed stored rows when available so displayed records match the actual records.
- Preserved repo-side tracker history and GitHub Actions workflow behavior.
