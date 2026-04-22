'use strict';

/**
 * User Registration Diagnostic
 * Tests POST /api/auth/register against the app gateway
 * No backend changes — read-only diagnosis only.
 */

const https = require('https');

const GATEWAY = process.env.API_BASE
  || 'https://qlanka-gateway.redrock-2a740b8b.centralindia.azurecontainerapps.io';

const TIMEOUT = 20_000;
const TS      = Date.now().toString().slice(-6);

// Test payloads — covering all common failure scenarios
const TESTS = [
  {
    label:  '1. Valid citizen user',
    expect: [200, 201],
    body: {
      username: `test_citizen_${TS}`,
      email:    `test_citizen_${TS}@mailinator.com`,
      password: 'Test@1234',
      role:     'citizen',
    },
  },
  {
    label:  '2. Valid officer user (centerId=1)',
    expect: [200, 201],
    body: {
      username: `test_officer_${TS}`,
      email:    `test_officer_${TS}@mailinator.com`,
      password: 'Test@1234',
      role:     'officer',
      centerId: 1,
    },
  },
  {
    label:  '3. Weak password (no special char) — expect 400/422',
    expect: [400, 422],
    body: {
      username: `weakpw_${TS}`,
      email:    `weakpw_${TS}@mailinator.com`,
      password: 'Password1',
      role:     'citizen',
    },
  },
  {
    label:  '4. Invalid role — expect 422',
    expect: [400, 422],
    body: {
      username: `badrole_${TS}`,
      email:    `badrole_${TS}@mailinator.com`,
      password: 'Test@1234',
      role:     'superadmin',
    },
  },
  {
    label:  '5. Officer without centerId — expect 422',
    expect: [400, 422],
    body: {
      username: `officer_nc_${TS}`,
      email:    `officer_nc_${TS}@mailinator.com`,
      password: 'Test@1234',
      role:     'officer',
    },
  },
  {
    label:  '6. Missing required fields — expect 400',
    expect: [400, 422],
    body: { username: `partial_${TS}` },
  },
  {
    label:  '7. Duplicate username (re-register same user)',
    expect: [409, 422],
    body: {
      username: `test_citizen_${TS}`,      // same as test 1
      email:    `dup_${TS}@mailinator.com`,
      password: 'Test@1234',
      role:     'citizen',
    },
  },
];

function apiPost(path, body) {
  return new Promise(resolve => {
    const url    = new URL(path, GATEWAY);
    const isHttps = url.protocol === 'https:';
    const lib    = isHttps ? https : require('http');
    const bodyStr = JSON.stringify(body);

    const options = {
      hostname: url.hostname,
      port:     url.port || (isHttps ? 443 : 80),
      path:     url.pathname,
      method:   'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };

    const req = lib.request(options, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, json, raw: data.substring(0, 400) });
      });
    });

    req.on('error', err => resolve({ status: 0, json: null, raw: String(err) }));
    req.setTimeout(TIMEOUT, () => req.destroy(new Error('TIMEOUT')));
    req.write(bodyStr);
    req.end();
  });
}

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(  '║         USER REGISTRATION DIAGNOSTIC — QueueLanka Pro      ║');
  console.log(  '╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`  Gateway : ${GATEWAY}`);
  console.log(`  Endpoint: POST /api/auth/register`);
  console.log(`  Time    : ${new Date().toISOString()}\n`);

  // ── First: confirm gateway is reachable ──────────────────────
  console.log('── Step 0: Gateway Reachability ──────────────────────────────');
  const ping = await apiPost('/api/auth/login', { username: '_ping_', password: '_ping_' });
  if (ping.status === 0) {
    console.log(`  ❌ Gateway UNREACHABLE: ${ping.raw}`);
    console.log(`  Cannot continue — check if gateway is deployed and running.\n`);
    process.exit(1);
  }
  console.log(`  ✅ Gateway reachable (login probe returned HTTP ${ping.status})\n`);

  // ── Run registration tests ────────────────────────────────────
  console.log('── Registration Tests ────────────────────────────────────────\n');

  let pass = 0, fail = 0;
  const successfulUsers = [];

  for (const test of TESTS) {
    const res = await apiPost('/api/auth/register', test.body);

    const expected  = test.expect.includes(res.status);
    const icon      = expected ? '✅' : '❌';
    if (expected) pass++; else fail++;

    console.log(`  ${icon}  ${test.label}`);
    console.log(`     HTTP: ${res.status}  (expected: ${test.expect.join(' or ')})`);

    // Show response detail
    if (res.status === 0) {
      console.log(`     Error: ${res.raw}`);
    } else if (res.status === 200 || res.status === 201) {
      console.log(`     Created: userId=${res.json?.data?.userId || res.json?.userId}  username=${res.json?.data?.username || res.json?.username}  role=${res.json?.data?.role || res.json?.role}`);
      if (test.body.username) successfulUsers.push(test.body.username);
    } else {
      // Show the error message from the server
      const msg  = res.json?.message || res.json?.title || res.json?.error || '';
      const code = res.json?.code    || res.json?.status || '';
      const errs = res.json?.errors
        ? JSON.stringify(res.json.errors).substring(0, 200)
        : res.json?.detail || res.raw.substring(0, 200);
      console.log(`     Code   : ${code}`);
      console.log(`     Message: ${msg}`);
      console.log(`     Detail : ${errs}`);
    }
    console.log();
  }

  // ── Login check for successfully created users ─────────────── 
  if (successfulUsers.length > 0) {
    console.log('── Login Verification for Created Users ──────────────────────\n');
    for (const uname of successfulUsers) {
      const loginRes = await apiPost('/api/auth/login', {
        username: uname,
        password: 'Test@1234',
      });
      const icon = loginRes.status === 200 ? '✅' : '❌';
      const token = loginRes.json?.data?.accessToken || loginRes.json?.accessToken || loginRes.json?.token;
      console.log(`  ${icon}  Login as "${uname}": HTTP ${loginRes.status}${token ? '  token issued ✓' : '  ' + (loginRes.json?.message || loginRes.raw?.substring(0,80))}`);
    }
    console.log();
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(  '║                      SUMMARY                               ║');
  console.log(  '╚══════════════════════════════════════════════════════════════╝');
  const verdict = fail === 0
    ? '🟢 Registration working correctly'
    : pass === 0
    ? '🔴 Registration is BROKEN — all tests failed'
    : '🟡 Partial — some tests failed unexpectedly';
  console.log(`\n  ${verdict}`);
  console.log(`  Total: ${pass + fail}  |  ✅ As Expected: ${pass}  |  ❌ Unexpected: ${fail}\n`);

  if (fail > 0) process.exit(1);
})();
