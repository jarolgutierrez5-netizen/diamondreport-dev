# Diamond Report DIE v5.2 — Full Developer Responsive Build

## Responsive Optimization Included
This build has been optimized for:
- Mobile phones
- Tablets
- Desktop/laptop screens

## Improvements
- Reduced horizontal page overflow.
- Improved scroll behavior inside tables/cards.
- Better mobile Tracker/DIE layout.
- Better tablet grid behavior.
- Better desktop spacing.
- Improved K Props, HR Potential, Pitcher Report, game cards, and modal responsiveness.
- Preserves API Request Optimizer.

---

# Diamond Report DIE v5.1 — Full Developer Repo Snapshot

This package is a **full developer repository snapshot**, not a small patch.

## Includes

```text
index.html
README.md
CHANGELOG.md

data/
  tracker.json
  daily-results.json
  model-data.json
  lineups.json
  lineup-intelligence.json
  statcast-hot-hitters.json

scripts/
  updateTracker.js
  updateLineups.js
  updateStatcastHotHitters.js

.github/workflows/
  tracker-update.yml
  lineup-update.yml
  statcast-hot-hitters-update.yml
```

## V5.1 Features
- 💎 Diamond Intelligence Engine (DIE) foundation inside Tracker.
- API Request Optimizer to reduce production/developer call volume.
- Caching, request deduplication, hidden-tab throttling, and stale-cache fallback.
- DIE API Guard stats for network calls, cache hits, deduped calls, and cache size.

## Upload to GitHub
Replace the contents of your **developer repo** with this package.

Do **not** upload temporary files named:

```text
script_0.js
script_1.js
script_2.js
```

They are intentionally not included in this full repo package.

---

# Diamond Report v5.1 — API Request Optimizer

## What changed
This update adds a request guard to reduce unnecessary API calls and help prevent live production from hitting request limits.

## Added protections
- Caches repeat GET requests for short safe windows.
- Deduplicates simultaneous requests to the same URL.
- Throttles repeated calls to the same endpoint.
- Slows background-tab polling.
- Serves stale cached data if a live request fails.
- Adds developer request stats to the DIE panel when available.

## Default cache windows
- MLB live/schedule data: about 90 seconds
- Repo JSON files: about 5 minutes
- Weather data: about 30 minutes
- Statcast / hot-hitter snapshots: about 60 minutes
- Odds / market data: about 5 minutes

## Developer console helpers
```js
DiamondRequestStats
DiamondClearRequestCache()
DiamondShouldRefreshLiveData()
```

## Upload to GitHub
Replace:

```text
index.html
README.md
```

No data-folder changes are required for this request optimizer.

