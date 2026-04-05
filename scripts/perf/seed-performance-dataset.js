#!/usr/bin/env node

/**
 * SCRUM-167 deterministic dataset bootstrap.
 * This script orchestrates existing seed scripts to prepare staging/local performance runs.
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

const scriptSequence = [
  'scripts/seed.js',
  'scripts/setup_test_users.js',
  'scripts/seed_admin_identity.js',
  'scripts/seed_waiting_token.js'
];

function runNodeScript(relativePath) {
  const scriptPath = path.join(repoRoot, relativePath);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env
  });

  if (result.status !== 0) {
    throw new Error(`Failed: ${relativePath} (exit ${result.status ?? 'unknown'})`);
  }
}

function main() {
  console.log('[SCRUM-167] Starting performance dataset seed...');
  for (const script of scriptSequence) {
    console.log(`[SCRUM-167] Running ${script}`);
    runNodeScript(script);
  }
  console.log('[SCRUM-167] Performance dataset seed completed successfully.');
}

try {
  main();
} catch (error) {
  console.error('[SCRUM-167] Dataset seed failed:', error.message);
  process.exit(1);
}
