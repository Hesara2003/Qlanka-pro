/**
 * WSO2 APIM Key Fix Script
 * 
 * Bypasses the Developer Portal UI "partially-created keys" error by:
 *  1. Registering a DCR client for admin API access
 *  2. Getting an admin management token
 *  3. Finding the QueueLanka-Frontend application
 *  4. Cleaning up any partial key mappings
 *  5. Generating fresh OAuth2 keys under "Qlanka Identity" key manager
 *  6. Printing the new access token ready for the gateway test
 */

'use strict';

const https = require('https');
const qs    = require('querystring');

const WSO2_HOST   = '20.193.250.12';
const MGMT_PORT   = 9443;
const TIMEOUT_MS  = 20_000;
const APP_NAME    = 'QueueLanka-Frontend';   // exact name in Developer Portal

// ──────────────────────────────────────────────────────────────
function httpsReq(opts, bodyStr = null) {
  return new Promise((resolve) => {
    const req = https.request(
      { ...opts, hostname: WSO2_HOST, port: MGMT_PORT, rejectUnauthorized: false },
      (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(data); } catch {}
          resolve({ status: res.statusCode, headers: res.headers, json, raw: data });
        });
      }
    );
    req.on('error', err => resolve({ status: 0, json: null, raw: String(err) }));
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error('TIMEOUT')));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function post(path, headers, bodyStr) {
  return httpsReq({ path, method: 'POST', headers }, bodyStr);
}

function get(path, headers) {
  return httpsReq({ path, method: 'GET', headers });
}

function del(path, headers) {
  return httpsReq({ path, method: 'DELETE', headers });
}

function step(msg) {
  console.log(`\n── ${msg} ${'─'.repeat(Math.max(0, 58 - msg.length))}`);
}

// ──────────────────────────────────────────────────────────────
(async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(  '║       WSO2 APIM KEY FIX — QueueLanka Pro                   ║');
  console.log(  '╚══════════════════════════════════════════════════════════════╝\n');

  const adminBasic = Buffer.from('admin:admin').toString('base64');

  // ── STEP 1: Register DCR client for admin API access ─────────
  step('Step 1: DCR — Register admin REST API client');
  const dcrBody = JSON.stringify({
    clientName: 'qlanka-key-fix-script',
    owner: 'admin',
    grantType: 'client_credentials password',
    saasApp: true,
  });
  const dcrRes = await post(
    '/client-registration/v0.17/register',
    {
      'Authorization': `Basic ${adminBasic}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dcrBody),
    },
    dcrBody
  );

  let dcrKey, dcrSecret;
  if (dcrRes.status === 200 || dcrRes.status === 201) {
    dcrKey    = dcrRes.json?.clientId;
    dcrSecret = dcrRes.json?.clientSecret;
    console.log(`  ✅ DCR client registered: ${dcrKey}`);
  } else if (dcrRes.status === 409 && dcrRes.json?.clientId) {
    // Already registered — use existing
    dcrKey    = dcrRes.json.clientId;
    dcrSecret = dcrRes.json.clientSecret;
    console.log(`  ℹ  DCR client already exists: ${dcrKey}`);
  } else {
    console.error(`  ❌ DCR failed: HTTP ${dcrRes.status}  ${dcrRes.raw.substring(0, 300)}`);
    process.exit(1);
  }

  // ── STEP 2: Get admin management token ───────────────────────
  step('Step 2: Get admin management token');
  const dcrBasic = Buffer.from(`${dcrKey}:${dcrSecret}`).toString('base64');
  const tokenBody = qs.stringify({
    grant_type: 'password',
    username:   'admin',
    password:   'admin',
    scope:      'apim:app_manage apim:subscribe apim:app_import_export openid',
  });
  const tokenRes = await post(
    '/oauth2/token',
    {
      'Authorization': `Basic ${dcrBasic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(tokenBody),
    },
    tokenBody
  );

  const mgmtToken = tokenRes.json?.access_token;
  if (!mgmtToken) {
    console.error(`  ❌ Token failed: HTTP ${tokenRes.status}  ${tokenRes.raw.substring(0, 300)}`);
    process.exit(1);
  }
  console.log(`  ✅ Management token obtained (scope: ${tokenRes.json?.scope})`);

  const authHdr = { 'Authorization': `Bearer ${mgmtToken}`, 'Content-Type': 'application/json' };

  // ── STEP 3: Find the application ─────────────────────────────
  step(`Step 3: Find application "${APP_NAME}"`);
  const appsRes = await get('/api/am/devportal/v3/applications?limit=50', authHdr);
  const apps = appsRes.json?.list || [];
  const app = apps.find(a => a.name === APP_NAME) || apps[0];

  if (!app) {
    console.error(`  ❌ Application "${APP_NAME}" not found. Available: ${apps.map(a=>a.name).join(', ')}`);
    process.exit(1);
  }

  const appId = app.applicationId;
  console.log(`  ✅ Found: "${app.name}"  id=${appId}  throttle=${app.throttlingPolicy}`);
  console.log(`  Available apps: ${apps.map(a => a.name).join(' | ')}`);

  // ── STEP 4: List existing key mappings ───────────────────────
  step('Step 4: List existing OAuth key mappings');
  const keysRes = await get(`/api/am/devportal/v3/applications/${appId}/oauth-keys`, authHdr);
  const keyMappings = keysRes.json?.list || [];
  console.log(`  Found ${keyMappings.length} key mapping(s):`);
  for (const km of keyMappings) {
    console.log(`    - id=${km.keyMappingId}  keyManager=${km.keyManager}  state=${km.keyState}  env=${km.keyType}`);
  }

  // ── STEP 5: Clean up any PARTIAL or stuck mappings ───────────
  step('Step 5: Clean up partial key mappings');
  const partialMappings = keyMappings.filter(km =>
    km.keyState === 'CREATED' || km.keyState === 'PARTIAL' || !km.consumerKey
  );
  const identityMappings = keyMappings.filter(km =>
    (km.keyManager || '').toLowerCase().includes('identity') ||
    (km.keyManager || '').toLowerCase().includes('qlanka')
  );

  const toClean = [...new Map(
    [...partialMappings, ...identityMappings].map(km => [km.keyMappingId, km])
  ).values()];

  if (toClean.length === 0) {
    console.log('  ℹ  No partial mappings to clean — cleaning ALL mappings to start fresh');
    for (const km of keyMappings) {
      const cleanRes = await post(
        `/api/am/devportal/v3/applications/${appId}/oauth-keys/${km.keyMappingId}/clean-up`,
        { ...authHdr, 'Content-Length': '0' },
        ''
      );
      console.log(`  🧹 Cleaned ${km.keyMappingId}: HTTP ${cleanRes.status}`);
    }
  } else {
    for (const km of toClean) {
      const cleanRes = await post(
        `/api/am/devportal/v3/applications/${appId}/oauth-keys/${km.keyMappingId}/clean-up`,
        { ...authHdr, 'Content-Length': '0' },
        ''
      );
      console.log(`  🧹 Cleaned ${km.keyManager} (${km.keyMappingId}): HTTP ${cleanRes.status}`);
    }
  }

  // ── STEP 6: Generate fresh keys under Qlanka Identity KM ─────
  step('Step 6: Generate fresh Production keys — Qlanka Identity KM');

  // First, find the correct key manager name from the server
  const kmListRes = await get('/api/am/devportal/v3/key-managers', authHdr);
  const keyManagers = kmListRes.json?.list || [];
  console.log(`  Available Key Managers: ${keyManagers.map(k => k.name).join(', ')}`);

  const identityKM = keyManagers.find(km =>
    km.name.toLowerCase().includes('identity') ||
    km.name.toLowerCase().includes('qlanka')
  );
  const kmName = identityKM?.name || 'Qlanka Identity';
  console.log(`  Using Key Manager: "${kmName}"`);

  const genBody = JSON.stringify({
    keyType:        'PRODUCTION',
    keyManager:     kmName,
    grantTypesToBeSupported: ['client_credentials', 'password', 'refresh_token'],
    callbackUrl:    '',
    scopes:         ['default'],
    validityTime:   3600,
    additionalProperties: {},
  });

  const genRes = await post(
    `/api/am/devportal/v3/applications/${appId}/generate-keys`,
    { ...authHdr, 'Content-Length': Buffer.byteLength(genBody) },
    genBody
  );

  console.log(`  Generate Keys HTTP: ${genRes.status}`);

  if (genRes.status === 200 || genRes.status === 201) {
    const consumerKey    = genRes.json?.consumerKey;
    const consumerSecret = genRes.json?.consumerSecret;
    const token          = genRes.json?.token?.accessToken;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log(  '║                 ✅ KEYS GENERATED SUCCESSFULLY              ║');
    console.log(  '╚══════════════════════════════════════════════════════════════╝\n');
    console.log(`  Consumer Key    : ${consumerKey}`);
    console.log(`  Consumer Secret : ${consumerSecret}`);
    console.log(`  Access Token    : ${token || '(not returned — use token endpoint)'}\n`);

    if (token) {
      console.log('  ─── Run the gateway test now: ───────────────────────────────');
      console.log(`  $env:WSO2_TOKEN='${token}'; node scripts/wso2_gateway_test.js\n`);
    } else {
      // Request a token with the new keys
      step('Requesting access token with new consumer key');
      const newBasic = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      const ccBody = qs.stringify({ grant_type: 'client_credentials', scope: 'default' });
      const ccRes = await post('/oauth2/token', {
        'Authorization': `Basic ${newBasic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(ccBody),
      }, ccBody);

      if (ccRes.json?.access_token) {
        console.log(`  ✅ New Access Token: ${ccRes.json.access_token}\n`);
        console.log('  ─── Run the gateway test now: ───────────────────────────────');
        console.log(`  $env:WSO2_TOKEN='${ccRes.json.access_token}'; node scripts/wso2_gateway_test.js\n`);
      } else {
        console.log(`  ❌ Token request failed: ${ccRes.raw.substring(0, 200)}`);
      }
    }
  } else {
    console.error(`  ❌ Key generation failed: HTTP ${genRes.status}`);
    console.error(`  Body: ${genRes.raw.substring(0, 500)}`);
    console.log('\n  ── Fallback: Try with Resident Key Manager ─────────────────');
    const genBodyResident = JSON.stringify({
      keyType: 'PRODUCTION',
      keyManager: 'Resident Key Manager',
      grantTypesToBeSupported: ['client_credentials', 'password', 'refresh_token'],
      callbackUrl: '',
      scopes: ['default'],
      validityTime: 3600,
      additionalProperties: {},
    });
    const genResResident = await post(
      `/api/am/devportal/v3/applications/${appId}/generate-keys`,
      { ...authHdr, 'Content-Length': Buffer.byteLength(genBodyResident) },
      genBodyResident
    );
    console.log(`  Resident KM generate: HTTP ${genResResident.status}`);
    if (genResResident.status === 200 || genResResident.status === 201) {
      const cKey = genResResident.json?.consumerKey;
      const cSec = genResResident.json?.consumerSecret;
      console.log(`  Consumer Key    : ${cKey}`);
      console.log(`  Consumer Secret : ${cSec}`);
    } else {
      console.error(`  Body: ${genResResident.raw.substring(0, 400)}`);
    }
  }
})();
