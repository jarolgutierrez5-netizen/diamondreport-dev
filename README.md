# Diamond Report — V4.1 Hot Hitter HR Potential

This build adds the **Hot Hitter HR Potential Engine**.

## Updated files

Upload/replace these in GitHub:

```text
index.html
README.md
data/statcast-hot-hitters.json
scripts/updateStatcastHotHitters.js
.github/workflows/statcast-hot-hitters-update.yml
```

Keep your existing files/folders:

```text
data/tracker.json
data/daily-results.json
data/model-data.json
data/lineups.json
data/lineup-intelligence.json
scripts/updateTracker.js
scripts/updateLineups.js
.github/workflows/tracker-update.yml
.github/workflows/lineup-update.yml
```

Do **not** upload temporary root files named `script_0.js`, `script_1.js`, or `script_2.js`.

## What changed

The **HR Potential** odds now include an On-Fire / Hot Hitter boost using:

- xwOBA level and trend
- Hard-Hit % level and trend
- Sweet-Spot % level and trend
- Barrel % level and trend
- Bat Speed level and trend
- Blast Rate level and trend
- Rolling 5–10 game contact-quality signals

When `data/statcast-hot-hitters.json` is available, HR Potential reads those repo-fed Statcast metrics. If the file is empty or unavailable, the site falls back to the live page data it already has: OPS, ISO, last-10 HRs, streak signal, and matchup edge.

## GitHub Action

`.github/workflows/statcast-hot-hitters-update.yml` runs every two hours during the MLB day and updates:

```text
data/statcast-hot-hitters.json
```

This lets HR Potential improve without forcing browser downloads or device-specific storage.
