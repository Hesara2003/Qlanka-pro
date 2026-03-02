// =============================================================================
//  QueueLanka API — Full Health Check
//  Covers every route across all controllers.
//  Usage:  node health_check.js
//          ADMIN_USER=myAdmin ADMIN_PASS=myPass node health_check.js
// =============================================================================

const API_BASE      = process.env.API_BASE      || 'http://localhost:5000/api';
const ADMIN_USER    = process.env.ADMIN_USER    || 'Hesara';
const ADMIN_PASS    = process.env.ADMIN_PASS    || '';
const CITIZEN_USER  = process.env.CITIZEN_USER  || 'HesaraP';
const CITIZEN_PASS  = process.env.CITIZEN_PASS  || '';

// ── Colour helpers ────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  grey:   '\x1b[90m',
};
const pass  = `${C.green}PASS${C.reset}`;
const fail  = `${C.red}FAIL${C.reset}`;
const skip  = `${C.yellow}SKIP${C.reset}`;
const info  = (s) => `${C.grey}${s}${C.reset}`;

// ── Result tracking ───────────────────────────────────────────────────────────
const results = [];

// ── Core request helper ───────────────────────────────────────────────────────
async function req(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { data = await res.json(); } catch { /* ignore */ }
  }

  return { status: res.status, data };
}

// ── Test runner ───────────────────────────────────────────────────────────────
async function test(group, name, fn) {
  process.stdout.write(`  ${info(group.padEnd(20))} ${name.padEnd(52)}`);
  try {
    const { ok, note } = await fn();
    if (ok) {
      console.log(`${pass}  ${info(note || '')}`);
      results.push({ group, name, ok: true });
    } else {
      console.log(`${fail}  ${C.red}${note || ''}${C.reset}`);
      results.push({ group, name, ok: false, note });
    }
  } catch (err) {
    console.log(`${fail}  ${C.red}${err.message}${C.reset}`);
    results.push({ group, name, ok: false, note: err.message });
  }
}

function expect(actual, expected, note) {
  if (actual === expected) return { ok: true, note: `${actual} ${info(note || '')}` };
  return { ok: false, note: `expected ${expected}, got ${actual}. ${note || ''}` };
}

// ── Auth flow: get JWTs once, reuse everywhere ─────────────────────────────────
let adminToken    = null;
let citizenToken  = null;

async function login(username, password) {
  if (!password) return null;  // skip silently — user must supply via env
  try {
    const { status, data } = await req('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    if (status === 200 && data?.data?.accessToken) return data.data.accessToken;
    if (status === 200 && data?.accessToken)        return data.accessToken;
    if (status === 200 && data?.token)              return data.token;
    // Surface the exact failure so the user knows what went wrong
    const reason = data?.message || data?.code || `HTTP ${status}`;
    process.stdout.write(`${C.yellow}    ⚠ login(${username}) failed: ${reason}\n${C.reset}`);
  } catch (err) {
    process.stdout.write(`${C.yellow}    ⚠ login(${username}) threw: ${err.message}\n${C.reset}`);
  }
  return null;
}

// =============================================================================
//  TEST SUITES
// =============================================================================

async function runAuthTests() {
  // ── Valid login ──────────────────────────────────────────────────────────
  await test('Auth', 'POST /auth/login — valid admin credentials', async () => {
    if (!ADMIN_PASS) return { ok: false, note: `ADMIN_PASS not set — run: $env:ADMIN_PASS="<password>"; node health_check.js` };
    adminToken = await login(ADMIN_USER, ADMIN_PASS);
    if (adminToken) return { ok: true, note: `token received for "${ADMIN_USER}"` };
    const { status } = await req('/auth/login', {
      method: 'POST', body: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    return { ok: false, note: `HTTP ${status} — wrong password for "${ADMIN_USER}"?` };
  });

  await test('Auth', 'POST /auth/login — valid citizen credentials', async () => {
    if (!CITIZEN_PASS) return { ok: false, note: `CITIZEN_PASS not set — run: $env:CITIZEN_PASS="<password>"; node health_check.js` };
    citizenToken = await login(CITIZEN_USER, CITIZEN_PASS);
    if (citizenToken) return { ok: true, note: `token received for "${CITIZEN_USER}"` };
    const { status } = await req('/auth/login', {
      method: 'POST', body: { username: CITIZEN_USER, password: CITIZEN_PASS },
    });
    return { ok: false, note: `HTTP ${status} — wrong password for "${CITIZEN_USER}"?` };
  });

  // ── Invalid credentials ──────────────────────────────────────────────────
  await test('Auth', 'POST /auth/login — wrong password → 401', async () => {
    const { status } = await req('/auth/login', {
      method: 'POST', body: { username: 'nobody', password: 'wrongpassword' },
    });
    return expect(status, 401);
  });

  // ── Missing fields → 422 / 400 ───────────────────────────────────────────
  await test('Auth', 'POST /auth/login — empty body → 400/422', async () => {
    const { status } = await req('/auth/login', { method: 'POST', body: {} });
    const ok = status === 400 || status === 422;
    return { ok, note: `${status}` };
  });

  // ── Register validation ──────────────────────────────────────────────────
  await test('Auth', 'POST /auth/register — weak password → 400/422', async () => {
    const { status } = await req('/auth/register', {
      method: 'POST',
      body: { username: 'testuser', password: 'weak', email: 'x@x.com', role: 'citizen' },
    });
    const ok = status === 400 || status === 422;
    return { ok, note: `${status}` };
  });

  await test('Auth', 'POST /auth/register — invalid email → 400/422', async () => {
    const { status } = await req('/auth/register', {
      method: 'POST',
      body: { username: 'testuser2', password: 'ValidPass@1', email: 'not-an-email', role: 'citizen' },
    });
    const ok = status === 400 || status === 422;
    return { ok, note: `${status}` };
  });

  // ── Email verification ────────────────────────────────────────────────────
  await test('Auth', 'GET /auth/verify-email — missing token → 400', async () => {
    const { status } = await req('/auth/verify-email');
    return expect(status, 400);
  });

  await test('Auth', 'GET /auth/verify-email — invalid token → 400', async () => {
    const { status } = await req('/auth/verify-email?token=invalid-token-xyz');
    const ok = status === 400;
    return { ok, note: `${status}` };
  });
}

async function runServiceCenterTests() {
  // ── Public listing ────────────────────────────────────────────────────────
  await test('ServiceCenters', 'GET /service-centers — public list', async () => {
    const { status, data } = await req('/service-centers');
    if (status !== 200) return { ok: false, note: `${status}` };
    const count = data?.metadata?.totalCount ?? data?.data?.length ?? '?';
    return { ok: true, note: `${status} — ${count} center(s)` };
  });

  // ── By ID (valid) ─────────────────────────────────────────────────────────
  await test('ServiceCenters', 'GET /service-centers/1 — known ID', async () => {
    const { status } = await req('/service-centers/1');
    const ok = status === 200 || status === 404;  // 404 is fine if DB has no ID 1
    return { ok, note: `${status}` };
  });

  // ── Bad ID → 400 ─────────────────────────────────────────────────────────
  await test('ServiceCenters', 'GET /service-centers/0 — invalid ID → 400', async () => {
    const { status } = await req('/service-centers/0');
    return expect(status, 400);
  });

  await test('ServiceCenters', 'GET /service-centers/-1 — negative ID → 400', async () => {
    const { status } = await req('/service-centers/-1');
    return expect(status, 400);
  });

  // ── Not found ─────────────────────────────────────────────────────────────
  await test('ServiceCenters', 'GET /service-centers/999999 — not found → 404', async () => {
    const { status } = await req('/service-centers/999999');
    return expect(status, 404);
  });

  // ── Availability ──────────────────────────────────────────────────────────
  await test('ServiceCenters', 'GET /service-centers/1/availability', async () => {
    const { status } = await req('/service-centers/1/availability');
    const ok = status === 200 || status === 404;
    return { ok, note: `${status}` };
  });

  await test('ServiceCenters', 'GET /service-centers/0/availability — invalid ID → 400', async () => {
    const { status } = await req('/service-centers/0/availability');
    return expect(status, 400);
  });

  // ── Location ──────────────────────────────────────────────────────────────
  await test('ServiceCenters', 'GET /service-centers/1/location', async () => {
    const { status } = await req('/service-centers/1/location');
    const ok = status === 200 || status === 404;
    return { ok, note: `${status}` };
  });

  await test('ServiceCenters', 'GET /service-centers/0/location — invalid ID → 400', async () => {
    const { status } = await req('/service-centers/0/location');
    return expect(status, 400);
  });

  // ── Auth guard on POST ────────────────────────────────────────────────────
  await test('ServiceCenters', 'POST /service-centers — no token → 401', async () => {
    const { status } = await req('/service-centers', { method: 'POST', body: {} });
    return expect(status, 401);
  });

  await test('ServiceCenters', 'PUT /service-centers/1/location — no token → 401', async () => {
    const { status } = await req('/service-centers/1/location', { method: 'PUT', body: {} });
    return expect(status, 401);
  });
}

async function runAdminUserTests() {
  // ── Auth guards ───────────────────────────────────────────────────────────
  await test('AdminUsers', 'GET /admin/users — no token → 401', async () => {
    const { status } = await req('/admin/users');
    return expect(status, 401);
  });

  await test('AdminUsers', 'DELETE /admin/users/1 — no token → 401', async () => {
    const { status } = await req('/admin/users/1', { method: 'DELETE' });
    return expect(status, 401);
  });

  if (adminToken) {
    // ── Listing ────────────────────────────────────────────────────────────
    await test('AdminUsers', 'GET /admin/users — admin token', async () => {
      const { status, data } = await req('/admin/users', { token: adminToken });
      if (status !== 200) return { ok: false, note: `${status}` };
      const count = data?.metadata?.totalCount ?? '?';
      return { ok: true, note: `${status} — ${count} user(s)` };
    });

    await test('AdminUsers', 'GET /admin/users?role=citizen', async () => {
      const { status } = await req('/admin/users?role=citizen', { token: adminToken });
      return expect(status, 200);
    });

    await test('AdminUsers', 'GET /admin/users?role=admin', async () => {
      const { status } = await req('/admin/users?role=admin', { token: adminToken });
      return expect(status, 200);
    });

    // ── Invalid role filter → 400 ──────────────────────────────────────────
    await test('AdminUsers', 'GET /admin/users?role=superuser → 400', async () => {
      const { status, data } = await req('/admin/users?role=superuser', { token: adminToken });
      const ok = status === 400 && data?.code === 'INVALID_ROLE_FILTER';
      return { ok, note: `${status} code=${data?.code}` };
    });

    // ── Delete validation ─────────────────────────────────────────────────
    await test('AdminUsers', 'DELETE /admin/users/0 — invalid ID → 400', async () => {
      const { status, data } = await req('/admin/users/0', { method: 'DELETE', token: adminToken });
      const ok = status === 400 && data?.code === 'INVALID_USER_ID';
      return { ok, note: `${status} code=${data?.code}` };
    });

    await test('AdminUsers', 'DELETE /admin/users/999999 — not found → 404', async () => {
      const { status, data } = await req('/admin/users/999999', { method: 'DELETE', token: adminToken });
      const ok = status === 404 && data?.code === 'USER_NOT_FOUND';
      return { ok, note: `${status} code=${data?.code}` };
    });
  } else {
    const hint = ADMIN_PASS
      ? `login failed for "${ADMIN_USER}" — wrong password?`
      : `set ADMIN_PASS env var: $env:ADMIN_PASS="<password>"; node health_check.js`;
    await test('AdminUsers', 'GET /admin/users — needs auth token', async () => {
      return { ok: false, note: hint };
    });
  }

  // ── Citizen cannot access admin routes → 403 ─────────────────────────────
  if (citizenToken) {
    await test('AdminUsers', 'GET /admin/users — citizen token → 403', async () => {
      const { status } = await req('/admin/users', { token: citizenToken });
      return expect(status, 403);
    });
  }
}

async function runTokenTests() {
  // ── Auth guards ───────────────────────────────────────────────────────────
  await test('Tokens', 'GET /token/my-tokens — no token → 401', async () => {
    const { status } = await req('/token/my-tokens');
    return expect(status, 401);
  });

  await test('Tokens', 'PUT /token/1/cancel — no token → 401', async () => {
    const { status } = await req('/token/1/cancel', { method: 'PUT' });
    return expect(status, 401);
  });

  if (citizenToken) {
    await test('Tokens', 'GET /token/my-tokens — citizen token', async () => {
      const { status, data } = await req('/token/my-tokens', { token: citizenToken });
      if (status !== 200) return { ok: false, note: `${status}` };
      const count = Array.isArray(data) ? data.length : (data?.data?.length ?? '?');
      return { ok: true, note: `${status} — ${count} token(s)` };
    });

    await test('Tokens', 'PUT /token/999999/cancel — not found → 404', async () => {
      const { status } = await req('/token/999999/cancel', { method: 'PUT', token: citizenToken });
      const ok = status === 404;
      return { ok, note: `${status}` };
    });
  }
}

async function runAppointmentTests() {
  // ── Auth guards ───────────────────────────────────────────────────────────
  await test('Appointments', 'GET /appointment/my-bookings — no token → 401', async () => {
    const { status } = await req('/appointment/my-bookings');
    return expect(status, 401);
  });

  await test('Appointments', 'POST /appointment/book — no token → 401', async () => {
    const { status } = await req('/appointment/book', { method: 'POST', body: {} });
    return expect(status, 401);
  });

  if (citizenToken) {
    await test('Appointments', 'GET /appointment/my-bookings — citizen token', async () => {
      const { status, data } = await req('/appointment/my-bookings', { token: citizenToken });
      if (status !== 200) return { ok: false, note: `${status}` };
      const count = data?.metadata?.totalCount ?? data?.data?.length ?? '?';
      return { ok: true, note: `${status} — ${count} appointment(s)` };
    });

    await test('Appointments', 'POST /appointment/book — missing body → 400/422', async () => {
      const { status } = await req('/appointment/book', {
        method: 'POST', body: {}, token: citizenToken,
      });
      const ok = status === 400 || status === 404 || status === 422;
      return { ok, note: `${status}` };
    });
  }
}

// =============================================================================
//  ENTRY POINT
// =============================================================================
async function run() {
  const width = 80;
  const line  = '─'.repeat(width);

  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(width)}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  QueueLanka API — Health Check${C.reset}`);
  console.log(`${C.bold}${C.cyan}  Base URL: ${API_BASE}${C.reset}`);
  console.log(`${C.bold}${C.cyan}${'═'.repeat(width)}${C.reset}\n`);

  // Check reachability first
  try {
    await fetch(`${API_BASE}/service-centers`);
  } catch {
    console.error(`${C.red}${C.bold}  Cannot reach ${API_BASE} — is the backend running?${C.reset}\n`);
    process.exit(1);
  }

  console.log(`${C.bold}  Group                Name                                                 Result${C.reset}`);
  console.log(`  ${line}\n`);

  await runAuthTests();
  await runServiceCenterTests();
  await runAdminUserTests();
  await runTokenTests();
  await runAppointmentTests();

  // ── Summary ───────────────────────────────────────────────────────────────
  const total   = results.length;
  const passed  = results.filter(r => r.ok).length;
  const failed  = results.filter(r => !r.ok).length;

  console.log(`\n  ${line}`);
  console.log(`${C.bold}  SUMMARY${C.reset}`);
  console.log(`  ${line}`);
  console.log(`  Total   ${total}`);
  console.log(`  ${C.green}Passed  ${passed}${C.reset}`);
  if (failed > 0) {
    console.log(`  ${C.red}Failed  ${failed}${C.reset}`);
    console.log(`\n${C.bold}  Failed tests:${C.reset}`);
    results.filter(r => !r.ok).forEach(r => {
      console.log(`  ${C.red}✗${C.reset} [${r.group}] ${r.name}`);
      if (r.note) console.log(`    ${C.grey}${r.note}${C.reset}`);
    });
  }
  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(width)}${C.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run();
