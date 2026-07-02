# DIE Architecture Note - v9.6

This release improves the Developer tracker snapshot layer.

## Problem fixed
A same-day snapshot could be created while only part of the MLB slate was available. Because the script previously only created DRP/K/HR rows when the snapshot section was empty, later workflow runs reused the partial snapshot and never added missing games.

## New rule
Every tracker workflow run rebuilds the available same-day slate and merges in missing rows.

## Data flow
- `data/today-predictions.json` remains the daily prediction snapshot.
- `scripts/updateTracker.js` now tops off missing DRP/K/HR snapshot rows on each run.
- `data/tracker.json` still stores finalized historical records only.

## Still protected
The website UI remains unchanged. This release does not modify `index.html`, CSS, engine files, or data files directly.
