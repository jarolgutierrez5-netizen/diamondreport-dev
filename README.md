# DEV DR DIE v9.6 - Full Slate Snapshot Fix

Developer-only tracker snapshot reliability release.

## Changes
- Fixes partial DRP snapshots that captured only part of the MLB slate.
- Rebuilds the same-day snapshot every tracker run and merges in missing DRP/K/HR rows.
- Preserves existing same-day snapshot rows while topping off missing games/props.
- Keeps final-only Tracker behavior: no Pending or Wait Final rows are stored in history.
- Keeps v9.5 workflow push-conflict protections intact.

## Deployment
Upload only `scripts/updateTracker.js` plus the docs listed in `DEPLOYMENT.md`.
