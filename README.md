# Diamond Report Tracker V3

Upload all files/folders in this ZIP to the root of your GitHub Pages repository.

What changed:
- `index.html` now has Export Tracker, Import Tracker, and Reload Repo Data controls in the Tracker source stack.
- `data/tracker.json` is the repo seed every device can read.
- AZ/ARI is normalized to prevent duplicate `AZ @ SF` / `ARI @ SF` rows.
- Tracker rendering de-dupes DRP rows by date, matchup, and pick.

Important: GitHub Pages is static. The browser cannot directly write back to `data/tracker.json`. To move desktop history to iPhone:
1. Open Diamond Report on the desktop/device that has the full history.
2. Tracker → Export backup.
3. Open GitHub → `data/tracker.json` → Edit.
4. Replace the file contents with the exported JSON.
5. Commit and wait for Pages to deploy.
6. On iPhone, use a hard refresh or tap Reload Repo Data.
