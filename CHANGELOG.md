# Changelog

## DEV-DR-DIE-v9.6-Full-Slate-Snapshot-Fix
- Fixed issue where an early/partial snapshot could lock DR Picks to fewer games than the full slate.
- Added same-day snapshot top-off logic for DR Picks, K Props, and HR picks.
- Existing snapshot rows are preserved; missing rows are merged in by identity/key.
- Updated snapshot version metadata to 9.6.
- Preserved v9.5 workflow conflict fixes and v9.4 dedupe behavior.
