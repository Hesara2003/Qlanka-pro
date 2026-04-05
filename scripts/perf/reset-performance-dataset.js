#!/usr/bin/env node

/**
 * SCRUM-167 dataset reset helper.
 * Uses environment-driven cleanup mode; by default performs a safe no-op and prints required commands.
 */

const mode = process.env.PERF_RESET_MODE || 'manual';

function main() {
  console.log(`[SCRUM-167] Reset mode: ${mode}`);

  if (mode === 'manual') {
    console.log('[SCRUM-167] Manual reset selected. Run project-specific cleanup scripts as needed:');
    console.log(' - node scripts/tmp_fix_tokens_status_enum.js');
    console.log(' - node scripts/sync_is_open.js');
    console.log(' - node scripts/tmp_call_cancel_sp.js');
    console.log('Then verify baseline users/centers are intact before next run.');
    return;
  }

  console.log('[SCRUM-167] No automatic destructive reset is enabled in repository defaults.');
}

try {
  main();
} catch (error) {
  console.error('[SCRUM-167] Reset failed:', error.message);
  process.exit(1);
}
