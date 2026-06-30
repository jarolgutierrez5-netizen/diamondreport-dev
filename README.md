# Diamond Report V4.0 — Persistent All-Time Tracker Fix

This update fixes the mobile/iPhone issue where All-Time HR Accuracy and K Props All-Time could show `0-0` even while Diamond Report Picks All-Time loaded correctly.

## What changed

- Added persistent `allTime` summaries to `data/tracker.json`.
- Tracker now reads All-Time HR and K Props from repo-persisted summaries when row-level historical data is not available on a device.
- GitHub Action updater preserves/grows all-time summaries instead of letting an empty mobile/browser cache reset them.
- Diamond Report Picks All-Time, Favorite Team, and Worst Team continue to use final graded DR picks.

## Files to update in GitHub

Replace/upload:

```text
index.html
README.md
data/tracker.json
scripts/updateTracker.js
```

No lineup workflow changes are required for this fix.
