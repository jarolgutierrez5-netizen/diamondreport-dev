# Diamond Intelligence Engine Architecture

## v8.1 UI / Engine Separation

This release starts separating the presentation layer from the engine layer.

## Safe to edit

- `index.html`
- `css/styles.css`

## Protected unless changing engine behavior

- `engine/`
- `config/`
- `data/`
- `scripts/`
- `.github/`

## Current status

- CSS has been extracted from `index.html` into `css/styles.css`.
- `js/app.js` has been added as a non-invasive app entry point.
- Engine modules have been scaffolded for future migration.
- Existing production logic remains intact to reduce risk.

## Rule

The Tracker should use the repository as the source of truth and should only display finalized historical data.


## DEV-DR-DIE-v9.1 Layout Formatting Merge

The Developer UI continues to use the existing `index.html` and modular `css/styles.css` structure. Layout formatting was imported from `index(22).html` into the stylesheet only, while Developer Tracker and workflow logic remain preserved.
