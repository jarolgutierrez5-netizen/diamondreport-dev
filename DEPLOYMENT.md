# Deployment

## Build
DEV-DR-DIE-v9.3-HR-K-Tracker-Snapshot-Fix

## Deployment Type
Tracker Pipeline Script Update

## Upload / Replace

```text
scripts/updateTracker.js
README.md
CHANGELOG.md
DEPLOYMENT.md
```

## Leave Unchanged

```text
index.html
css/
js/
engine/
config/
data/tracker.json
data/today-predictions.json
.github/
scripts/update-tracker.mjs
```

## After Upload

1. Commit the changes.
2. Run **Update Diamond Report Tracker** manually in GitHub Actions.
3. Check `data/today-predictions.json`.
   - `drp` should have rows.
   - `kprop` should have rows if probable starters are available.
   - `hr` should have rows if `data/lineups.json` has lineup data.
4. After games finalize, check `data/tracker.json`.
   - `market.drp` should update.
   - `market.kprop` should update.
   - `picks` should update for HR.
5. Open the dev Tracker tab and press **Reload Repo Data**.
