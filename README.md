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

## Tracker V3.1 auto backup

The Tracker now keeps a rolling local auto-backup snapshot in the browser and attempts one automatic JSON download per day when the Tracker saves. The Tracker Source Stack includes:

- Export backup
- Auto backup ON/OFF
- Latest auto backup
- Import backup

Note: iOS/Safari and some desktop browser settings may block automatic downloads unless triggered by a tap/click. Even when a download is blocked, the latest snapshot remains saved locally and can be downloaded with **Latest auto backup**.

## Daily Batter Lineup Trigger

This package adds an automated GitHub Action that updates `data/lineups.json` every day at **7:00 AM Central during daylight saving time**.

Files added:

- `scripts/updateLineups.js` — pulls today's MLB schedule and lineups from the public MLB Stats API.
- `.github/workflows/lineup-update.yml` — scheduled trigger for the lineup update.
- `data/lineups.json` — generated lineup data read by the website.

Notes:

- If MLB has posted official batting orders, the file stores the actual lineup from the MLB boxscore feed.
- If official lineups are not posted yet at 7:00 AM, the script stores a projected active-roster lineup so the site still has batter data.
- The website reads `data/lineups.json` as a fallback before using the active-roster fallback.
- You can manually run the update anytime from GitHub: **Actions → Daily Lineup Update → Run workflow**.


## V3.3 Hourly Lineup Watch

This update changes the lineup workflow from one daily run to an hourly watcher. The GitHub Action checks MLB lineups every hour from morning through late evening Central time.

Files added/updated:

```text
scripts/updateLineups.js
.github/workflows/lineup-update.yml
data/lineups.json
```

How it works:

1. At each hourly run, `scripts/updateLineups.js` pulls today’s MLB schedule.
2. For every game, it checks the MLB Stats API boxscore for batting order data.
3. If at least nine batters are available for a team, that team is marked as `confirmed: true`.
4. If the official lineup is not posted yet, the script stores a projected active-roster lineup so HR Projections and Pitcher Reports still have player data.
5. Once a lineup has been confirmed, future runs preserve that confirmed lineup if the API temporarily returns incomplete data.
6. `data/lineups.json` includes a top-level `status` block showing how many teams are confirmed and how many are still projected.

The site can use:

```js
fetch('data/lineups.json')
```

to feed confirmed batters into HR Projections and Pitcher Reports.
