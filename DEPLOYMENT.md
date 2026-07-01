# DIE v8.1 Deployment

## Deployment Type
🔴 Full Architecture Update

## Upload / replace these files and folders

```text
index.html
css/
js/
engine/
config/
README.md
CHANGELOG.md
DEPLOYMENT.md
DIE_ARCHITECTURE.md
```

## Do not change unless intentionally updating data/workflows

```text
data/
scripts/
.github/
```

## After upload

1. Open the dev site.
2. Hard refresh.
3. Confirm the layout looks the same as v8.0.
4. Open Tracker.
5. Press Reload Repo Data.
6. Confirm historical-only Tracker behavior remains intact.

## Future UI work

After this release, most layout edits should happen in:

```text
index.html
css/styles.css
```

The `engine/` folder should not be edited for layout-only changes.
