# Diamond Intelligence Engine (DIE)

## Version 6.5 — K Props Accuracy Status Fix

This developer build fixes the Tracker issue where **K Props — Daily + All-Time Accuracy** could show `Wrong` incorrectly after live/final K count updates.

### Changes
- Preserved original K Projection values using stable row data attributes.
- Preserved original DR Line values separately from K Projection.
- Prevented live/final K count labels from overwriting tracker grading inputs.
- Ensured `Projected Line` in Tracker equals the original K Projection, not DR Line.
- Ensured `Status` compares original K Projection against Final K Count.
- Ensured `Over DR Line?` compares original DR Line against Final K Count.

### Notes
The visible K Props card may update during live/final games, but the Tracker now uses the original projection data captured when the K Props card was first rendered.
