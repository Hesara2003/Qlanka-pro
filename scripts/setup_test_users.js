// =============================================================================
//  QueueLanka — Create test users then run the full health check
//  Usage: node setup_test_users.js
// =============================================================================

const { execSync } = require('child_process');
const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};

// Fixed credentials used by both this script and health_check.js
const TEST_ADMIN   = { username: 'healthcheck_admin',   password: 'Health@Check1', email: 'healthcheck.admin@queuelanka.test',   role: 'admin' };
const TEST_CITIZEN = { username: 'healthcheck_citizen', password: 'Health@Check1', email: 'healthcheck.citizen@queuelanka.test', role: 'citizen' };

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

async function ensureUser(user) {
  process.stdout.write(`  Registering "${user.username}" (${user.role})... `);

  const { status, data } = await post('/auth/register', user);

  if (status === 201) {
    console.log(`${C.green}created${C.reset}`);
    return true;
  }
  if (status === 409) {
    // Already exists — that's fine
    const code = data?.code ?? '';
    if (code === 'DUPLICATE_USERNAME' || code === 'DUPLICATE_EMAIL' ||
        (data?.message ?? '').toLowerCase().includes('taken') ||
        (data?.message ?? '').toLowerCase().includes('already')) {
      console.log(`${C.yellow}already exists — skipping${C.reset}`);
      return true;
    }
  }

  // Any other status is a real failure
  const msg = data?.message ?? data?.errors ?? JSON.stringify(data).substring(0, 120);
  console.log(`${C.red}FAILED (HTTP ${status}): ${msg}${C.reset}`);
  return false;
}

async function verifyLogin(user) {
  process.stdout.write(`  Verifying login for "${user.username}"... `);
  const { status, data } = await post('/auth/login', {
    username: user.username,
    password: user.password,
  });
  if (status === 200) {
    console.log(`${C.green}OK${C.reset}`);
    return true;
  }
  const msg = data?.message ?? `HTTP ${status}`;
  console.log(`${C.red}FAILED: ${msg}${C.reset}`);
  return false;
}

async function main() {
  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  QueueLanka — Test User Setup${C.reset}`);
  console.log(`${C.bold}${C.cyan}  API: ${API_BASE}${C.reset}`);
  console.log(`${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}\n`);

  // ── Reachability ────────────────────────────────────────────
  try {
    await fetch(`${API_BASE}/service-centers`);
  } catch {
    console.error(`${C.red}  Cannot reach ${API_BASE} — is the backend running?${C.reset}\n`);
    process.exit(1);
  }

  // ── Register users ──────────────────────────────────────────
  console.log(`${C.bold}  Step 1: Register test users${C.reset}`);
  const adminOk   = await ensureUser(TEST_ADMIN);
  const citizenOk = await ensureUser(TEST_CITIZEN);

  if (!adminOk || !citizenOk) {
    console.error(`\n${C.red}  One or more users could not be created. Aborting.${C.reset}\n`);
    process.exit(1);
  }

  // ── Verify logins ───────────────────────────────────────────
  console.log(`\n${C.bold}  Step 2: Verify logins${C.reset}`);
  const adminLogin   = await verifyLogin(TEST_ADMIN);
  const citizenLogin = await verifyLogin(TEST_CITIZEN);

  if (!adminLogin || !citizenLogin) {
    console.error(`\n${C.red}  Login verification failed. Aborting.${C.reset}\n`);
    process.exit(1);
  }

  // ── Run health check ────────────────────────────────────────
  console.log(`\n${C.bold}  Step 3: Running full health check${C.reset}\n`);

  const env = {
    ...process.env,
    ADMIN_USER:   TEST_ADMIN.username,
    ADMIN_PASS:   TEST_ADMIN.password,
    CITIZEN_USER: TEST_CITIZEN.username,
    CITIZEN_PASS: TEST_CITIZEN.password,
  };

  try {
    execSync('node health_check.js', {
      env,
      cwd: __dirname,
      stdio: 'inherit',
    });
  } catch {
    // health_check.js exits with code 1 when tests fail — that's expected output
    process.exit(1);
  }
}

main();
