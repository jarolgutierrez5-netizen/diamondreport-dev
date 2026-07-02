# DIE Architecture Notes

## DEV-DR-DIE-v9.3-HR-K-Tracker-Snapshot-Fix

The Tracker remains a historical, final-only data store.

### Source of truth

```text
data/tracker.json
```

### Snapshot source

```text
data/today-predictions.json
```

### Grading script

```text
scripts/updateTracker.js
```

### Supported tracker markets

- Diamond Report Picks (`market.drp`)
- K Props (`market.kprop`)
- HR Picks (`picks`)

### Rule

Pending rows are allowed in `today-predictions.json`, but only finalized win/loss records are written into `tracker.json`.
