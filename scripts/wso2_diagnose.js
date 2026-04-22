/**
 * WSO2 Gateway Base Path Discovery + Deep Diagnostics
 * 
 * Probes all known context paths for the Officer API,
 * decodes the JWT token to check aud/iss claims,
 * and shows the raw WSO2 error body from 401 responses.
 */

'use strict';

const https = require('https');
const qs    = require('querystring');

const WSO2_HOST      = '20.193.250.12';
const MGMT_PORT      = 9443;
const GW_PORT        = 8243;
const CONSUMER_KEY   = 'bOhc0ENWBPxvw_sXu8fxHv_Rz2Aa';
const CONSUMER_SECRET= 'obSMMQApn1PIkkAcZRCQ80rl_doa';
const USERNAME       = 'admin';
const PASSWORD       = 'admin';
const TIMEOUT_MS     = 12_000;

// All known context paths — probe each to find which resolves
const CONTEXT_PATHS_TO_TRY = [
  '/officer/v1',
  '/queuelanka-officer/v1',
  '/queuelankaOfficerAPI/v1',
  '/QueueLankaOfficerAPI/v1',
  '/officer',
  '/officerapi/v1',
  '/queuelanka/officer/v1',
  '/api',
];

function httpsReq(opts, bodyStr = null) {
  return new Promise((resolve) => {
    const req = https.request({ ...opts, rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, json, raw: data });
      });
    });
    req.on('error', err => resolve({ status: 0, headers: {}, json: null, raw: String(err) }));
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error('TIMEOUT')));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch { return null; }
}

(async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(  '║         WSO2 BASE PATH DISCOVERY & TOKEN DIAGNOSTICS        ║');
  console.log(  '╚══════════════════════════════════════════════════════════════╝\n');

  // ── 1. Get token ──────────────────────────────────────────────
  const basicAuth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const tokenBody = qs.stringify({ grant_type: 'password', username: USERNAME, password: PASSWORD, scope: 'openid' });

  const tokenRes = await httpsReq({
    hostname: WSO2_HOST, port: MGMT_PORT, path: '/oauth2/token', method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(tokenBody),
    },
  }, tokenBody);

  const accessToken = tokenRes.json?.access_token;
  if (!accessToken) {
    console.error('❌ Failed to obtain token:', tokenRes.raw);
    process.exit(1);
  }
  console.log(`✅ Token obtained (type=${tokenRes.json?.token_type}, expires_in=${tokenRes.json?.expires_in}s)\n`);

  // ── 2. Decode JWT payload ─────────────────────────────────────
  const payload = decodeJwtPayload(accessToken);
  console.log('── JWT Token Payload Analysis ────────────────────────────────');
  if (payload) {
    console.log(`  iss (Issuer)       : ${payload.iss}`);
    console.log(`  aud (Audience)     : ${JSON.stringify(payload.aud)}`);
    console.log(`  sub (Subject)      : ${payload.sub}`);
    console.log(`  scope              : ${payload.scope}`);
    console.log(`  azp (Auth. Party)  : ${payload.azp}`);
    console.log(`  exp                : ${new Date(payload.exp * 1000).toISOString()}`);
    console.log(`  iat                : ${new Date(payload.iat * 1000).toISOString()}`);
    console.log(`\n  Full payload: ${JSON.stringify(payload, null, 2)}\n`);
  } else {
    console.log('  Token is OPAQUE (not a JWT) — introspection-based validation used');
    console.log(`  Raw token prefix: ${accessToken.substring(0, 40)}...\n`);
  }

  // ── 3. Probe all context paths ────────────────────────────────
  console.log('── Gateway Context Path Discovery (port 8243) ────────────────');
  console.log('   Testing /api/counters/1/dashboard under each context path:\n');

  let winningPath = null;
  for (const ctx of CONTEXT_PATHS_TO_TRY) {
    const fullPath = `${ctx}/api/counters/1/dashboard`;

    // Test WITHOUT token (should get 401 if path exists, or 404 if not)
    const noAuth = await httpsReq({
      hostname: WSO2_HOST, port: GW_PORT, path: fullPath, method: 'GET',
      headers: {},
    });

    // Test WITH token
    const withAuth = await httpsReq({
      hostname: WSO2_HOST, port: GW_PORT, path: fullPath, method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const noAuthStatus  = noAuth.status || 'TIMEOUT';
    const withAuthStatus = withAuth.status || 'TIMEOUT';

    // 401 (no auth) + 200/403/404 (with auth) = correct path, auth issue
    // 401 both = path found but token rejected
    // 404 = path doesn't exist
    const pathFound = noAuthStatus === 401 || noAuthStatus === 403;
    const tokenWorks = withAuthStatus === 200 || withAuthStatus === 403 || withAuthStatus === 404;
    const icon = tokenWorks ? '✅' : (pathFound ? '🔐' : '❌');

    console.log(`  ${icon}  ${fullPath.padEnd(50)} noAuth=${noAuthStatus}  withToken=${withAuthStatus}`);

    if (withAuthStatus === 401 && withAuth.raw) {
      const rawSnip = withAuth.raw.substring(0, 200);
      console.log(`     401 body: ${rawSnip}`);
    }

    if (pathFound && !winningPath) winningPath = ctx;
    if (tokenWorks) {
      winningPath = ctx;
      console.log(`  ★  MATCH FOUND: ${ctx}`);
      break;
    }
  }

  // ── 4. Also try with no basePath at all ──────────────────────
  console.log('\n── Trying direct path (no base path prefix) ──────────────────');
  const directPath = '/api/counters/1/dashboard';
  const directNoAuth = await httpsReq({
    hostname: WSO2_HOST, port: GW_PORT, path: directPath, method: 'GET', headers: {},
  });
  const directWithAuth = await httpsReq({
    hostname: WSO2_HOST, port: GW_PORT, path: directPath, method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  console.log(`  noAuth=${directNoAuth.status}  withToken=${directWithAuth.status}  path=${directPath}`);

  // ── 5. Fetch API list via APIM REST API ──────────────────────
  console.log('\n── WSO2 API Manager — Published API Contexts ─────────────────');
  const apiList = await httpsReq({
    hostname: WSO2_HOST, port: MGMT_PORT,
    path: '/api/am/publisher/v3/apis?limit=20',
    method: 'GET',
    headers: { 'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}` },
  });

  if (apiList.status === 200 && apiList.json?.list) {
    console.log('  APIs found in Publisher:');
    for (const api of apiList.json.list) {
      console.log(`    - ${api.name} v${api.version}  context=${api.context}  state=${api.lifeCycleStatus}`);
    }
  } else {
    console.log(`  Publisher API list: HTTP ${apiList.status}`);
    // Try devportal API
    const devList = await httpsReq({
      hostname: WSO2_HOST, port: MGMT_PORT,
      path: '/api/am/devportal/v3/apis?limit=20',
      method: 'GET',
      headers: { 'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}` },
    });
    if (devList.status === 200 && devList.json?.list) {
      console.log('  APIs from DevPortal:');
      for (const api of devList.json.list) {
        console.log(`    - ${api.name} v${api.version}  context=${api.context}  state=${api.lifeCycleStatus || 'PUBLISHED'}`);
      }
    } else {
      console.log(`  DevPortal API list: HTTP ${devList.status}  body=${devList.raw?.substring(0, 150)}`);
    }
  }

  console.log('\n── Summary ───────────────────────────────────────────────────');
  if (winningPath) {
    console.log(`✅ Context path found: ${winningPath}`);
  } else {
    console.log('❌ No working context path found.');
    console.log('   Action: Check WSO2 Publisher for the exact API context path.');
  }

  if (payload) {
    console.log(`\n  Token aud: ${JSON.stringify(payload.aud)}`);
    console.log(`  Consumer Key: ${CONSUMER_KEY}`);
    const audMatch = payload.aud === CONSUMER_KEY ||
      (Array.isArray(payload.aud) && payload.aud.includes(CONSUMER_KEY));
    console.log(`  aud includes consumer key: ${audMatch ? '✅ YES' : '❌ NO — THIS IS LIKELY THE PROBLEM'}`);
  }

  console.log();
})();
