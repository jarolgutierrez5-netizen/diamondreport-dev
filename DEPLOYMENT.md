# DIE v8.3 Deployment

## Deployment Type

🟡 Tracker Reset Update

## Replace / Upload

```text
data/tracker.json
scripts/updateTracker.js
```

## Optional

```text
README.md
CHANGELOG.md
DEPLOYMENT.md
```

## Do Not Change

```text
index.html
css/
js/
engine/
config/
.github/
data/daily-results.json
data/model-data.json
data/lineups.json
data/lineup-intelligence.json
data/statcast-hot-hitters.json
```

## After Upload

1. Commit the files.
2. Open the dev site.
3. Go to Tracker.
4. Press **Reload Repo Data**.
5. Confirm Tracker all-time records are reset to `0-0`.
6. Going forward, only finalized graded records should appear in Tracker.
