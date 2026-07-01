# Diamond Report DIE — v7.1 Tracker DR Picks Repository History Fix

This developer build fixes the Diamond Report Picks tracker display so it preserves and counts every stored repository record after Reload Repo Data.

## Changes
- DIAMOND REPORT PICKS — DAILY + ALL-TIME ACCURACY no longer hides valid stored records just because the mobile matchup-label parser cannot rebuild an `@` matchup label.
- All-time DR Picks totals are calculated from every stored repository DR Pick with a final win/loss result.
- The table displays a fallback label from the stored record when matchup parsing is unavailable.
- Fixed a defensive duplicate `finalK` declaration in the DR Line accuracy calculation.

## Expected Result
If tracker.json contains a 20-8 Diamond Report Picks record, the Tracker should continue showing 20-8 after Reload Repo Data on iPhone.
