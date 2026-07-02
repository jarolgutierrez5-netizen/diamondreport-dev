# DIE Architecture Note — v9.4

Tracker history remains repository-first and final-only.

This release adds identity-based deduplication in `scripts/updateTracker.js` so workflow reruns cannot double-count the same final result.

Canonical tracker identities:
- DR Picks: date + `gamePk` when available, with migration fallback to date + team pair.
- K Props: date + `gamePk` + pitcher identity.
- HR Picks: date + `gamePk` + player identity.

The UI continues to read `data/tracker.json`; no UI logic changed in this release.
