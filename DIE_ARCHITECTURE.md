# DIE Architecture Note - v9.5

This release stabilizes the Developer repository automation layer.

## Rule
Only `update-tracker.yml` owns Tracker grading and tracker history writes.

## Data-writing workflows
All data-writing workflows share the same concurrency group:

`diamond-report-data-${{ github.ref }}`

This prevents overlapping data jobs from pushing competing commits to `main`.

## Tracker source of truth
- `data/today-predictions.json` stores the daily snapshot.
- `data/tracker.json` stores finalized historical tracker records.
- The website displays repository data only.
