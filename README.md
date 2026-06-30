# Diamond Report V3.7 — Next Day Model Lock

This update fixes the Tracker tab so **Next Day K Props** do not show before today's games have started or while games are still pending/live.

## Changed

- Next Day Prediction Model now unlocks only after all of today's games are final.
- Next Day K Props no longer display stale stored props in the morning.
- HR Potential, Diamond Report Picks, and K Props next-day panels all show a waiting message until the current slate is fully settled.
- Prevents incomplete live/in-progress data from affecting tomorrow's recommendations.

## Files to update

Upload/replace:

```text
index.html
README.md
```

No data folder changes are required for this fix.
