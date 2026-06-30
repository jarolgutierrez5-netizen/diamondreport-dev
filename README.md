# Diamond Report — V4.2 HR Potential On-Fire Filter

This build adds a dedicated **🔥 ON FIRE** filter to the **HR Potential** section.

## Updated files

Upload/replace these in GitHub:

```text
index.html
README.md
```

Keep your existing files/folders:

```text
data/tracker.json
data/daily-results.json
data/model-data.json
data/lineups.json
data/lineup-intelligence.json
data/statcast-hot-hitters.json
scripts/updateTracker.js
scripts/updateLineups.js
scripts/updateStatcastHotHitters.js
.github/workflows/tracker-update.yml
.github/workflows/lineup-update.yml
.github/workflows/statcast-hot-hitters-update.yml
```

## What changed

The HR Potential filter row now includes:

```text
🔥 ON FIRE
```

When selected, the HR Potential table shows only hitters with strong hot-hitter indicators:

- On Fire Score >= 70
- or Hot Hitter boost >= +4.5%
- or the player is flagged as `isOnFire`

The On-Fire list sorts the hottest batted-ball profiles first, using On Fire Score, hot boost, and HR probability.

The existing filters still work:

- Top HR Threat
- Drought
- Favorable Matchup
- All

## Notes

No data files, scripts, or GitHub workflows need to be replaced for this version.
