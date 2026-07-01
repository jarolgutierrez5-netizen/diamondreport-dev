# Diamond Intelligence Engine (DIE)

## Version 7.0 — Tracker K Props Date + DRP Status Audit

This developer build updates the Tracker accuracy tables and continues the DIE versioned release workflow.

### Changes
- Added a **Date** column to **K Props — Daily + All-Time Accuracy**.
- K Props table now displays all stored K Props records, not only today's rows.
- K Props rows sort newest date first.
- Confirmed **Diamond Report Picks — Daily + All-Time Accuracy** status logic:
  - Stored repository `win/loss` results are preserved.
  - Pending DR Pick rows are rechecked against final-score data when available.
  - The all-time card/header continues to use the repository summary when it has the larger completed sample.
- Updated README and CHANGELOG.

### Notes
- `Projected Line` remains the K Projection value.
- `DR Line` remains separate and is used only for DR Line accuracy.
- `Status` for Diamond Report Picks is based on final pick result: Right for wins, Wrong for losses, pending only when no final result is available.
