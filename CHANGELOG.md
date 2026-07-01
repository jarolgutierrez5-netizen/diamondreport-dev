# Changelog

## DIE v5.9 — K Props Scrollable Panel
- Made the K Props section internally scrollable on mobile and tablet to reduce full-page scrolling.
- Added touch-friendly momentum scrolling for mobile devices.
- Added a sticky top summary area inside K Props when today's record is available.
- Added clean thin scrollbar styling for supported browsers.
- Preserved the v5.8 mobile two-column Props layout and all v5.7 first-load fixes.
- Updated README.md for v5.9.

## DIE v5.8 — Mobile Props Two-Column Layout
- Updated the Props tab mobile layout so HR Potential and K's Today display next to each other.
- Updated the row below so HR's Today and HR's Completed from Projection display next to each other on mobile.
- Added mobile-safe spacing, title sizing, and min-width protection to prevent layout overflow.
- Preserved the existing developer-side first-load fixes from v5.7.
- Updated README.md for v5.8.

## DIE v5.7 — K's Today First-Load Fix
- Fixed K's Today in the Props tab requiring a manual page reload before populating reliably.
- Added `loadKsTodayWithRetry()` to retry lightly when live MLB data is still warming on first load.
- Added K's Today to the regular Props refresh loop so it stays current with HR Potential and HRs Today.
- Updated README.md for v5.7.
- Preserved Tracker tab layout and behavior.

## DIE v5.6 — First-Load Data Initialization Fix
- Fixed HRs Completed from Projection requiring a manual page reload before populating.
- Fixed Pitcher Report requiring a manual page reload before populating reliably.
- Added a coordinated first-load bootstrap that initializes Live Scores, Props, HR Potential, and Pitcher Report after the full script is parsed.
- Delayed the initial Live Scores call to prevent early async data from touching modules before all state is initialized.
- Re-runs HRs Today after HR Potential loads so projected HR completions are matched immediately.
- Preserved Tracker tab layout and behavior.

## DIE v5.5 — Font Enhancement Update
- Increased font sizes across the application for improved readability.
- Increased player name, table, card, label, button, and statistics font sizes.
- Tracker tab intentionally left unchanged.

## DIE v5.4 — Responsive Layout Fix
- Improved responsive behavior across mobile, tablet, and desktop.
- Preserved core DIE data folders, workflows, scripts, and app structure.

## DIE v5.3 — Mobile HR Potential + K's Today Fix
- Optimized HR Potential for phones.
- Optimized K's Today for phones.
- Prevented HR Potential from causing full-page horizontal overflow.
- Converted K's Today rows to a compact mobile grid.
