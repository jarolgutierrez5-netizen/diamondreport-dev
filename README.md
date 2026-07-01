# Diamond Intelligence Engine (DIE)

## Version 6.3 — Tracker K Props DR Line Accuracy Update

This developer build uses the provided `index(20).html` as the base file.

### Changes
- Added **K Projection for Game** column to **K Props + All-Time Accuracy**.
- Renamed **Line** to **Projected Line**.
- Added **DR Line** column.
- Added **Over DR Line?** column with `Y` / `N` output.
- Added **Final K Count** column.
- Updated K Props status logic to read **K Projection**, **Final K Count**, and **DR Line** before marking a pick **Right**, **Wrong**, or **Pending**.
- Added **All Time DR Line Accuracy** section to support future DIE Foundation tuning for pitcher DR Lines.

### Notes
- This is a developer/test build.
- Live site deployment should only happen after mobile, tablet, desktop, and Tracker validation.
- Tracker data remains part of the DIE learning foundation.
