# Diamond Intelligence Engine (DIE)

## Version 7.3 — DR Picks Repository Source-of-Truth Fix

This developer build fixes the Tracker issue where **Diamond Report Picks — Daily + All-Time Accuracy** could show fewer games or skewed all-time records on iPhone after pressing **Reload Repo Data**.

## What Changed

- `data/tracker.json` is now treated as the source of truth for Diamond Report Picks history.
- Browser/local cache no longer overrides DR Picks records after repo reload.
- Mobile DOM parsing no longer rebuilds or drops stored DR Picks records.
- The DR Picks all-time card and detailed table are both based on the same repository-backed data.
- Every stored DR Pick row is displayed; records are no longer removed by matchup dedupe.

## Deployment Type

🟢 **Index Only**

Replace only:

```text
index.html
```

No `data/`, `scripts/`, or workflow files need to be updated for this fix.
