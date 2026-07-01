# Diamond Report DIE

## Version 7.2 — Tracker Source-of-Truth Reload Fix

This developer build fixes Tracker history display issues after pressing **Reload Repo Data** on iPhone/mobile.

### Changes
- Preserves all stored Diamond Report Picks from `data/tracker.json`.
- Stops mobile parsing from dropping historical DR Picks when a matchup label cannot be rebuilt.
- Keeps Diamond Report Picks all-time records tied to repository history.
- Ensures the DR Picks detail table displays stored records instead of hiding records with imperfect labels.
- Keeps README and CHANGELOG updated per DIE release standards.

### Notes
The Tracker should treat repository data as the source of truth. UI rendering should not remove historical records just because the mobile DOM parser cannot reconstruct a clean `TEAM @ TEAM` label.
