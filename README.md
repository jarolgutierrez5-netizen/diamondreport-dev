# Diamond Intelligence Engine (Developer)

## DEV-DR-DIE-v9.3-HR-K-Tracker-Snapshot-Fix

This developer release expands the final-only Tracker pipeline beyond Diamond Report Picks.

### What changed

- Adds automatic K Props snapshot generation from probable starters.
- Grades finalized K Props using final MLB boxscore strikeout totals.
- Adds automatic HR pick snapshot generation from `data/lineups.json`.
- Grades finalized HR picks using final MLB boxscore home run totals.
- Keeps Tracker final-only: no Pending, Wait Final, or push rows are written into `data/tracker.json`.
- Preserves the working DR Picks tracker pipeline.

### Tracking behavior

The workflow now follows this chain:

```text
data/today-predictions.json
  -> snapshot DR Picks, K Props, HR picks
scripts/updateTracker.js
  -> grade final outcomes
  -> write final records only
data/tracker.json
  -> repository source of truth
Tracker tab
  -> displays finalized history
```

### Deployment

Upload only the files listed in `DEPLOYMENT.md`.
