# DEV DR DIE v9.5 - Tracker Push Conflict Fix

Developer-only workflow stability release.

## Changes
- Adds one shared GitHub Actions concurrency group for all data-writing workflows.
- Updates workflow Node runtime to Node 24.
- Replaces fragile direct `git push`/auto-commit behavior with rebase-safe push retries.
- Keeps `update-tracker.yml` as the owner of tracker grading.
- Prevents `tracker-update.yml` from also grading/writing tracker history.
- Includes the v9.4 tracker dedupe script.

## Deployment
Upload only the workflow files and `scripts/updateTracker.js` listed in `DEPLOYMENT.md`.
