# Diamond Report Persistent Tracker

This package keeps the app as a static site while adding persistent Tracker data files.

## Files added

- `index.html` — updated app with persistent Tracker loader and legacy localStorage migration.
- `data/tracker.json` — repo-backed Tracker source of truth.
- `data/daily-results.json` — historical grading results.
- `data/model-data.json` — reserved for learned model metrics.
- `scripts/update-tracker.mjs` — GitHub Action updater that grades pending DR Picks and K Props from final MLB data.
- `.github/workflows/update-tracker.yml` — scheduled updater.

## Important note

A static browser page cannot directly commit new data to GitHub without a backend or GitHub Action. The updated `index.html` now loads `data/tracker.json`, migrates old `diamondReportTrackerV3` browser data into `diamondReportTrackerV4`, and keeps a browser backup. The GitHub Action can update repo JSON once predictions are present in `data/tracker.json`.

## Deploy

Upload the full folder contents to your repo root. Keep the `/data`, `/scripts`, and `/.github/workflows` folders.

After pushing, open GitHub Actions and run **Update Diamond Report Tracker** manually once to confirm it has write permission.
