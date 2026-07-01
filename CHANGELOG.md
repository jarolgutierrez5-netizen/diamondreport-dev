# Changelog

## v7.0 — Tracker K Props Date + DRP Status Audit

- Added Date column to K Props — Daily + All-Time Accuracy.
- Changed K Props tracker table to render all-time stored records instead of only current-day rows.
- Added newest-first ordering for K Props tracker records.
- Confirmed Diamond Report Picks status and count logic:
  - Preserves stored repo win/loss results.
  - Rechecks pending DR Picks against final score data when available.
  - Uses repository all-time summary when it contains the larger verified completed sample.
- Updated documentation.
