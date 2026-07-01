#!/usr/bin/env node
/*
  DEV DR DIE v8.5 - Tracker Workflow Script Filename Fix

  GitHub Actions workflow calls: node scripts/update-tracker.mjs
  The current tracker updater exists as: scripts/updateTracker.js

  This wrapper keeps the workflow path stable and executes the existing
  CommonJS tracker update script without changing tracker logic.
*/
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
require('./updateTracker.js');
