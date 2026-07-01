// ============================================================
// Diamond Intelligence Engine (DIE) v8.1
// App Entry Point
//
// Current role: non-invasive bootstrap scaffold.
// Existing production logic remains in index.html for stability.
// Future releases will migrate UI orchestration here incrementally.
// ============================================================

window.DIE_APP = window.DIE_APP || {};
window.DIE_APP.version = '8.1';
window.DIE_APP.architecture = 'ui-engine-separation';

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.setAttribute('data-die-version', '8.1');
  console.info('Diamond Intelligence Engine v8.1 initialized');
});
