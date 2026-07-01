# Diamond Intelligence Engine (DIE)
## v8.0 — Historical Tracker Rewrite

This developer release changes the Tracker into a historical-only view.

## What changed
- Repository `data/tracker.json` is the source of truth for Tracker history.
- Browser/local cached Tracker data is no longer merged into repository data.
- Pending DR Picks and K Props are excluded from Tracker tables and all-time counts.
- The Tracker is treated as read-only historical data.
- Live/current-day projections remain on the normal live tabs, not in the Tracker.

## Deployment Type
🟢 Index Only

Replace only:
- `index.html`

No changes required to:
- `data/tracker.json`
- `.github/workflows/`
- `scripts/`

## Important behavior
The Tracker will now show only final graded records already stored in the repository. If a date still shows no results, that means the repository has not stored graded final records for that date yet.
