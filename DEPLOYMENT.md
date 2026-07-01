# Deployment

## DEV DR DIE v8.5 - Tracker Workflow Script Filename Fix

Deployment Type: Script-only patch

Upload/add:

```text
scripts/update-tracker.mjs
```

Do not change:

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

After upload:

1. Commit the new file.
2. Go to GitHub Actions.
3. Re-run `update-tracker`.
4. Confirm the workflow reaches the commit/update step.
