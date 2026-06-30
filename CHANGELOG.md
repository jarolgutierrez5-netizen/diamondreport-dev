# Changelog

## Diamond Report DIE v5.1 — Developer Foundation + API Optimizer

### Added
- 💎 Diamond Intelligence Engine (DIE) developer panel inside Tracker.
- Engine status, prediction counts, learning queue, pipeline status, model weights, learning journal, and API Guard stats.
- API request optimizer:
  - Response caching
  - In-flight request deduplication
  - Hidden-tab throttling
  - Stale-cache fallback
  - Developer request stats

### Included from previous full base
- Persistent Tracker data files.
- Lineup intelligence data file.
- Statcast hot-hitter data file.
- Tracker updater script.
- Lineup updater script.
- Statcast hot-hitter updater script.
- GitHub workflows for tracker, lineup, and Statcast hot-hitter updates.

### Removed
- Temporary packaging artifacts: `script_0.js`, `script_1.js`, `script_2.js`.

## Upload
This ZIP is a full developer repo snapshot. Replace the developer repo contents with the files in this package.
