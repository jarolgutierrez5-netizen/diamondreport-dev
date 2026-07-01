# Changelog

## v7.3 — DR Picks Repository Source-of-Truth Fix

### Fixed
- Diamond Report Picks — Daily + All-Time Accuracy now reads DR Picks history directly from `data/tracker.json`.
- Prevented iPhone/mobile DOM parsing from dropping stored Diamond Report Picks after Reload Repo Data.
- Stopped local browser cache from overriding repository DR Picks history.
- Removed DR Picks table dedupe-by-matchup behavior so every stored repository row displays.
- Preserved repository all-time records such as 20-8 when the repo contains the full record.

### Deployment
- Deployment Type: Index Only
- Replace `index.html` only.
