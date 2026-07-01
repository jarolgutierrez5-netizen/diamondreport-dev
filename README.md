# Diamond Intelligence Engine (DIE)

## Version 8.1 — UI / Engine Separation

This release starts the modular architecture transition for DIE.

### What changed

- Extracted inline CSS into `css/styles.css`.
- Added `js/app.js` as the application entry scaffold.
- Added `engine/` scaffolds for future prediction, tracker, learning, scheduler, repository, confidence, and DR Line engines.
- Added `config/dieConfig.json`.
- Added `DIE_ARCHITECTURE.md`.
- Preserved existing functionality from v8.0.

### Purpose

The goal is to let layout/UI work happen without touching the future DIE model files.

### Safe to edit after this release

- `index.html`
- `css/styles.css`

### Protected unless changing engine behavior

- `engine/`
- `config/`
- `data/`
- `scripts/`
- `.github/`

### Tracker rule

The Tracker is historical-only and should use repository data as the source of truth.
