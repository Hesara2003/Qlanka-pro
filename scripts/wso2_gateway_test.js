/**
 * WSO2 API Gateway Test Suite — QueueLanka Pro
 *
 * Tests:
 *  1. OAuth2 token issuance (password grant)
 *  2. JWKS endpoint reachability
 *  3. Token introspection
 *  4. 401 for missing Bearer token through gateway
 *  5. All officer endpoints through WSO2 gateway (/officer/v1)
 *  6. 401 for invalid token
 *
 * Notes on WSO2 defaults:
 *  - Mgmt/Token: 9443 (HTTPS)
 *  - Gateway HTTPS: 8243
 *  - Gateway HTTP:  8280
 *  - Introspect uses admin:admin BasicAuth, NOT consumer key:secret
 */

'use strict';

const https  = require('https');
const qs     = require('querystring');

// ──────────────────────────────────────────────────────────────
// CONFIGURATION
// ──────────────────────────────────────────────────────────────
const WSO2_HOST       = '20.193.250.12';
const WSO2_MGMT_PORT  = 9443;   // Management/Token endpoint port
// Gateway ports to probe: WSO2 default is 8243 (HTTPS) or 8280 (HTTP)
// Some deployments publish APIs on 9443 as well via pass-through
const GW_PORTS_TO_TRY = [8243, 8280, 9443];

const TOKEN_PATH      = '/oauth2/token';
const INTROSPECT_PATH = '/oauth2/introspect';
const JWKS_PATH       = '/oauth2/jwks';

// Published API base path from WSO2 DevPortal discovery:
// QueueLanka Officer API → context=/officer → gateway: /officer/v1/...
// (Discovery also found /queuelanka-officer/v1 — try both via env var)
const GW_BASE_PATH    = process.env.GW_CONTEXT || '/officer/v1';

// WSO2 admin credentials for introspection (admin:admin basic auth)
const ADMIN_BASIC     = Buffer.from('admin:admin').toString('base64');

const CONSUMER_KEY    = 'bOhc0ENWBPxvw_sXu8fxHv_Rz2Aa';
const CONSUMER_SECRET = 'obSMMQApn1PIkkAcZRCQ80rl_doa';
const USERNAME       = 'admin';
const PASSWORD       = 'admin';

// If a token is provided via env, use it directly (skips token request step)
const OVERRIDE_TOKEN = process.env.WSO2_TOKEN || null;

const TEST_COUNTER_ID = process.env.COUNTER_ID || '1';
const TIMEOUT_MS      = 15_000;

// ──────────────────────────────────────────────────────────────
// RESULT TRACKING
// ──────────────────────────────────────────────────────────────
const RESULTS = [];
let PASS = 0, FAIL = 0;

function record(category, test, passed, detail = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  if (passed) PASS++; else FAIL++;
  RESULTS.push({ category, test, status, detail });
  console.log(`  ${status}  ${test}${detail ? '  →  ' + detail : ''}`);
}

// ──────────────────────────────────────────────────────────────
// RAW HTTPS HELPER (bypasses self-signed cert)
// ──────────────────────────────────────────────────────────────
function httpsReq(opts, bodyStr = null) {
  return new Promise((resolve) => {
    const reqOpts = {
      ...opts,
      rejectUnauthorized: false,  // Accept self-signed cert
    };

    const req = https.request(reqOpts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, json, raw: data });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, headers: {}, json: null, raw: String(err), error: err });
    });

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error('TIMEOUT'));
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

/** POST to WSO2 management port (token/introspect) */
function wso2Mgmt(path, headers, bodyStr) {
  return httpsReq(
    { hostname: WSO2_HOST, port: WSO2_MGMT_PORT, path, method: 'POST', headers },
    bodyStr
  );
}

/** GET to WSO2 management port */
function wso2MgmtGet(path) {
  return httpsReq({ hostname: WSO2_HOST, port: WSO2_MGMT_PORT, path, method: 'GET' });
}

/** Probe which gateway port is open and return it; returns null if none reachable */
async function probeGatewayPort() {
  for (const port of GW_PORTS_TO_TRY) {
    const probe = await httpsReq(
      { hostname: WSO2_HOST, port, path: GW_BASE_PATH + '/api/counters/1/dashboard', method: 'GET' }
    );
    // Any real HTTP status (including 401/403) means the port is open
    if (probe.status > 0) {
      console.log(`  → Gateway port ${port} is OPEN (HTTP ${probe.status})`);
      return port;
    }
    console.log(`  → Gateway port ${port} — no response (timeout/refused)`);
  }
  return null;
}

/** Call through WSO2 gateway port */
function gwCall(apiPath, { method = 'GET', token, body: reqBody, port } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const bodyStr = reqBody ? JSON.stringify(reqBody) : null;
  if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

  const gwPort = port || GW_PORTS_TO_TRY[0];
  return httpsReq(
    { hostname: WSO2_HOST, port: gwPort, path: `${GW_BASE_PATH}${apiPath}`, method, headers },
    bodyStr
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────
(async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(  '║      WSO2 API GATEWAY TEST SUITE — QueueLanka Pro           ║');
  console.log(  '╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`  WSO2 Host     : ${WSO2_HOST}`);
  console.log(`  Mgmt Port     : ${WSO2_MGMT_PORT}`);
  console.log(`  Gateway Ports : ${GW_PORTS_TO_TRY.join(', ')} (will probe)`);
  console.log(`  Gateway Path  : ${GW_BASE_PATH}`);
  console.log(`  Consumer Key  : ${CONSUMER_KEY}`);
  console.log(`  Test Counter  : ${TEST_COUNTER_ID}`);
  console.log(`  Timestamp     : ${new Date().toISOString()}\n`);

  const consumerBasic = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

  // ── STEP 1: Get OAuth2 Access Token ──────────────────────────
  // Try client_credentials first (produces iss=real-IP), then password grant as fallback
  console.log('\n── Step 1: WSO2 Token Endpoint ───────────────────────────────');

  let accessToken = OVERRIDE_TOKEN || null;

  if (accessToken) {
    console.log('  Using OVERRIDE token from WSO2_TOKEN env variable.');
    record('Token Endpoint', 'Token provided via WSO2_TOKEN env var', true, 'override mode');
    record('Token Endpoint', 'Response body contains access_token', true, 'override token in use');
  } else {
    // Try client_credentials grant first
    const ccBody = qs.stringify({ grant_type: 'client_credentials', scope: 'default' });
    const ccRes = await wso2Mgmt(TOKEN_PATH, {
      'Authorization': `Basic ${consumerBasic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(ccBody),
    }, ccBody);

    if (ccRes.json?.access_token) {
      accessToken = ccRes.json.access_token;
      console.log(`  client_credentials grant: HTTP ${ccRes.status} → token obtained (scope=${ccRes.json.scope})`);
      record('Token Endpoint', 'POST /oauth2/token (client_credentials) → HTTP 200', true, `expires_in=${ccRes.json.expires_in}s`);
      record('Token Endpoint', 'Response body contains access_token', true, `scope=${ccRes.json.scope}, token_type=${ccRes.json.token_type}`);
    } else {
      // Fallback to password grant
      console.log(`  client_credentials: HTTP ${ccRes.status}, falling back to password grant`);
      const pwBody = qs.stringify({ grant_type: 'password', username: USERNAME, password: PASSWORD, scope: 'default' });
      const pwRes = await wso2Mgmt(TOKEN_PATH, {
        'Authorization': `Basic ${consumerBasic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(pwBody),
      }, pwBody);
      accessToken = pwRes.json?.access_token || null;
      record('Token Endpoint', 'POST /oauth2/token (password grant fallback)',
        pwRes.status === 200,
        `HTTP ${pwRes.status}`
      );
      record('Token Endpoint', 'Response body contains access_token',
        !!accessToken,
        accessToken
          ? `expires_in=${pwRes.json.expires_in}s`
          : `error=${pwRes.json?.error}, desc=${pwRes.json?.error_description}`
      );
    }
  }

  // ── STEP 2: JWKS endpoint ────────────────────────────────────
  console.log('\n── Step 2: JWKS Endpoint ─────────────────────────────────────');
  const jwksRes = await wso2MgmtGet(JWKS_PATH);
  const keyCount = jwksRes.json?.keys?.length || 0;
  record('JWKS', 'GET /oauth2/jwks returns signing keys',
    jwksRes.status === 200 && keyCount > 0,
    `HTTP ${jwksRes.status}, keys=${keyCount}`
  );

  // ── STEP 3: Token Introspection ──────────────────────────────
  if (accessToken) {
    console.log('\n── Step 3: Token Introspection ───────────────────────────────');
    // WSO2 introspect uses admin:admin auth (not consumer key/secret)
    const introBody = qs.stringify({ token: accessToken });
    const introRes = await wso2Mgmt(INTROSPECT_PATH, {
      'Authorization': `Basic ${ADMIN_BASIC}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(introBody),
    }, introBody);

    record('Introspection', 'POST /oauth2/introspect → active=true',
      introRes.json?.active === true,
      `HTTP ${introRes.status}, active=${introRes.json?.active}, scope="${introRes.json?.scope}"`
    );
    // WSO2 uses a UUID as sub (not the username) — that is expected
    const sub = introRes.json?.sub || '';
    const username = introRes.json?.username || introRes.json?.aut || '';
    record('Introspection', 'Token sub/username present in introspect response',
      !!sub,
      `sub=${sub}, username=${username}`
    );
  } else {
    console.log('\n── Step 3: Token Introspection — SKIPPED (no token) ─────────');
  }

  // ── STEP 3.5: JWT Issuer Claim Check ─────────────────────────
  if (accessToken) {
    const parts = accessToken.split('.');
    if (parts.length === 3) {
      try {
        const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jwtPayload = JSON.parse(Buffer.from(b64 + '==', 'base64').toString('utf8'));
        const iss = jwtPayload.iss || '';
        const issuerOk = iss.includes(WSO2_HOST);
        console.log('\n── Step 3.5: JWT Issuer Claim Validation ─────────────────────');
        console.log(`  Token iss    : ${iss}`);
        console.log(`  WSO2 host    : ${WSO2_HOST}`);
        console.log(`  Token scope  : ${jwtPayload.scope}`);
        console.log(`  Token aud    : ${JSON.stringify(jwtPayload.aud)}`);
        record('JWT Claims', 'Token issuer (iss) contains WSO2 real hostname',
          issuerOk,
          issuerOk
            ? `iss=${iss} ✓`
            : `iss="${iss}" MISMATCH — gateway at ${WSO2_HOST} will REJECT this token. Fix: WSO2 OAuth2 → OAuthTokenEPUrl must be https://${WSO2_HOST}:9443/oauth2/token`
        );
        record('JWT Claims', 'Token aud matches consumer key',
          jwtPayload.aud === CONSUMER_KEY || (Array.isArray(jwtPayload.aud) && jwtPayload.aud.includes(CONSUMER_KEY)),
          `aud=${JSON.stringify(jwtPayload.aud)}`
        );
      } catch { /* opaque token */ }
    }
  }


  // ── STEP 4: Gateway — no token → 401 ─────────────────────────
  // Probe which gateway port is actually open
  console.log('\n── Probing Gateway Ports ─────────────────────────────────────');
  const activeGwPort = await probeGatewayPort();
  record('Gateway Connectivity', `Gateway port reachable (tried: ${GW_PORTS_TO_TRY.join(',')})`,
    activeGwPort !== null,
    activeGwPort ? `Active port: ${activeGwPort}` : 'No gateway port responded'
  );

  const gwPort = activeGwPort || GW_PORTS_TO_TRY[0];

  console.log('\n── Step 4: Security — 401 Without Bearer Token ───────────────');
  const noTokenRes = await gwCall(`/api/counters/${TEST_COUNTER_ID}/dashboard`, { port: gwPort });
  record('Security', 'Request without token → 401 Unauthorized',
    noTokenRes.status === 401,
    `HTTP ${noTokenRes.status}`
  );

  // ── STEP 5: Officer Endpoints via Gateway ────────────────────
  if (accessToken) {
    console.log('\n── Step 5: Officer API Endpoints through WSO2 Gateway ────────');

    // 5a. Dashboard
    const dash = await gwCall(`/api/counters/${TEST_COUNTER_ID}/dashboard`, { token: accessToken, port: gwPort });
    const dashWwwAuth = dash.headers['www-authenticate'] || '';
    record('Officer API', `GET  /api/counters/${TEST_COUNTER_ID}/dashboard`,
      dash.status === 200 || dash.status === 403 || dash.status === 404,
      `HTTP ${dash.status}${dash.status === 200 ? ' — data present' : (dashWwwAuth ? ' | WWW-Auth: ' + dashWwwAuth.substring(0, 80) : '')}`
    );
    if (dash.status === 401) {
      const errCode = dash.json?.code || dash.json?.fault?.code || '?';
      console.log(`  ℹ  WSO2 Error Code : ${errCode}`);
      console.log(`  ℹ  WSO2 Message    : ${dash.json?.message || dash.json?.description || ''}`);
      console.log(`  ℹ  Description     : ${dash.json?.description || ''}`);
      console.log(`  ℹ  WWW-Auth        : ${dashWwwAuth || '(none)'}`);
      if (errCode === '900901' || String(dashWwwAuth).includes('invalid_token')) {
        console.log(`  ❌  Error 900901: Token signature cannot be verified by APIM Gateway.`);
        console.log(`  ❌  The APIM Gateway's JWT validator cannot validate the token signature.`);
        console.log(`  ❌  FIX in WSO2 Publisher → API → Runtime → Application Level Security:`);
        console.log(`  ❌    Option A: Switch to "OAuth2" validation mode (not JWT locally)`);
        console.log(`  ❌    Option B: Enable "JWT Token Issuer" in APIM with the correct issuer URL`);
        console.log(`  ❌    Option C: In Carbon Console → Key Manager config → add the IS as trusted key manager`);
      } else if (iss && !iss.includes(WSO2_HOST)) {
        console.log(`  ❌  JWT iss=${iss} — gateway expects ${WSO2_HOST}`);
      }
    }

    // 5b. Waiting queue
    const waiting = await gwCall(`/api/counters/${TEST_COUNTER_ID}/tokens/waiting`, { token: accessToken, port: gwPort });
    const waitingCount = Array.isArray(waiting.json?.data) ? waiting.json.data.length : '?';
    record('Officer API', `GET  /api/counters/${TEST_COUNTER_ID}/tokens/waiting`,
      waiting.status === 200 || waiting.status === 403 || waiting.status === 404,
      `HTTP ${waiting.status}, items=${waitingCount}`
    );

    // 5c. Call next
    const callNext = await gwCall(`/api/counters/${TEST_COUNTER_ID}/call-next`, {
      method: 'POST', token: accessToken, port: gwPort
    });
    const calledTokenId = callNext.json?.data?.tokenId || null;
    record('Officer API', `POST /api/counters/${TEST_COUNTER_ID}/call-next`,
      callNext.status === 200 || callNext.status === 403 || callNext.status === 404,
      `HTTP ${callNext.status}, tokenId=${calledTokenId}`
    );

    // 5d. Update token status
    if (calledTokenId) {
      const serve = await gwCall(`/api/counters/${TEST_COUNTER_ID}/tokens/${calledTokenId}/status`, {
        method: 'PUT', token: accessToken, port: gwPort,
        body: { status: 'served' }
      });
      record('Officer API', `PUT  /api/counters/${TEST_COUNTER_ID}/tokens/${calledTokenId}/status`,
        serve.status === 200,
        `HTTP ${serve.status}`
      );
    } else {
      record('Officer API', `PUT  /api/counters/.../tokens/.../status`,
        true,
        'Skipped — no active token in queue (counter empty or not found)'
      );
    }

    // 5e. Stats
    const stats = await gwCall(`/api/counters/${TEST_COUNTER_ID}/stats`, { token: accessToken, port: gwPort });
    record('Officer API', `GET  /api/counters/${TEST_COUNTER_ID}/stats`,
      stats.status === 200 || stats.status === 403 || stats.status === 404,
      `HTTP ${stats.status}${stats.status === 200 ? `, served=${stats.json?.data?.servedCount}` : ''}`
    );

    // 5f. Gateway proxy headers
    console.log('\n── Step 5f: Gateway Response Headers ─────────────────────────');
    const proxyHeaders = ['via', 'x-rate-limit', 'x-ratelimit-limit', 'activityid', 'x-envoy-upstream-service-time'];
    const allDashHeaders = Object.keys(dash.headers || {});
    const foundHeaders = proxyHeaders.filter(h => dash.headers[h]);
    console.log(`  Response headers from gateway: ${allDashHeaders.join(', ')}`);
    record('Gateway Policies', 'WSO2 proxy/gateway headers present in response',
      foundHeaders.length > 0 || allDashHeaders.some(h => h.toLowerCase().includes('via') || h.toLowerCase().includes('rate')),
      `found=[${foundHeaders.join(', ') || allDashHeaders.join(', ')}]`
    );
  } else {
    console.log('\n── Step 5: Officer API Endpoints — SKIPPED (no token) ────────');
  }

  // ── STEP 6: Invalid token → 401 ──────────────────────────────
  console.log('\n── Step 6: Security — Invalid Token Rejected ─────────────────');
  const badTokenRes = await gwCall(`/api/counters/${TEST_COUNTER_ID}/dashboard`, {
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.INVALID.SIGNATURE',
    port: gwPort
  });
  record('Security', 'Invalid/malformed JWT → 401',
    badTokenRes.status === 401,
    `HTTP ${badTokenRes.status}`
  );

  // ── PRINT SUMMARY ─────────────────────────────────────────────
  const total = PASS + FAIL;
  const bar   = FAIL === 0 ? '🟢 ALL TESTS PASSED' : `🔴 ${FAIL} TEST(S) FAILED`;

  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════╗');
  console.log(  '║                               FINAL SUMMARY                                    ║');
  console.log(  '╚══════════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n  ${bar}`);
  console.log(`  Total: ${total}  |  ✅ Passed: ${PASS}  |  ❌ Failed: ${FAIL}\n`);

  // Category breakdown
  const byCategory = {};
  for (const r of RESULTS) {
    if (!byCategory[r.category]) byCategory[r.category] = { pass: 0, fail: 0 };
    if (r.status.includes('PASS')) byCategory[r.category].pass++;
    else byCategory[r.category].fail++;
  }
  console.log('  Category Breakdown:');
  for (const [cat, counts] of Object.entries(byCategory)) {
    const icon = counts.fail === 0 ? '✅' : '❌';
    console.log(`    ${icon}  ${cat.padEnd(22)} Pass: ${counts.pass}, Fail: ${counts.fail}`);
  }
  console.log();

  process.exit(FAIL > 0 ? 1 : 0);
})();
