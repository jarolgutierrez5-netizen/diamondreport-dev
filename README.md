# DEV DR DIE v8.5 - Tracker Workflow Script Filename Fix

This developer patch fixes the GitHub Actions tracker workflow failure where the workflow runs:

```text
node scripts/update-tracker.mjs
```

but the repository contains:

```text
scripts/updateTracker.js
```

The new `scripts/update-tracker.mjs` file is a wrapper that calls the existing `scripts/updateTracker.js` tracker updater.

## Deployment Type

Script-only patch.

## Upload / Replace

```text
scripts/update-tracker.mjs
```

## Leave Unchanged

```text
index.html
css/
js/
engine/
config/
data/
.github/
scripts/updateTracker.js
```
