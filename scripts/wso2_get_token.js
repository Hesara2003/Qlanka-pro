/**
 * WSO2 - Extract existing completed keys and get a working access token
 * The Resident Key Manager already has COMPLETED keys - use those.
 * Also retry Qlanka_Identity generation now that partial is cleaned.
 */

'use strict';

const https = require('https');
const qs    = require('querystring');

const WSO2_HOST  = '20.193.250.12';
const MGMT_PORT  = 9443;
const APP_ID     = 'e784a2a4-1ab1-404c-a3cf-a75b57d8ef51';   // QueueLanka-Frontend
const TIMEOUT_MS = 20_000;

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
          resolve({ status: res.statusCode, json, raw: data });
        });
      }
    );
    req.on('error', err => resolve({ status: 0, json: null, raw: String(err) }));
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error('TIMEOUT')));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function post(path, headers, bodyStr = '') {
  return httpsReq({ path, method: 'POST', headers }, bodyStr);
}

function get(path, headers) {
  return httpsReq({ path, method: 'GET', headers });
}

(async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(  '║       WSO2 — Extract Keys & Get Token                      ║');
  console.log(  '╚══════════════════════════════════════════════════════════════╝\n');

  // ── Step 1: Get management token ─────────────────────────────
  const dcrBasic = Buffer.from('62zi2fQlxfKceFm3f2KEfm5rFmAa:' +
    // We need the DCR secret — re-register to get it
    '').toString('base64');

  // Re-register DCR to get the secret fresh
  const adminBasic = Buffer.from('admin:admin').toString('base64');
  const dcrBody = JSON.stringify({
    clientName: 'qlanka-key-fix-script-v2',
    owner:      'admin',
    grantType:  'client_credentials password',
    saasApp:    true,
  });
  const dcrRes = await post('/client-registration/v0.17/register',
    { 'Authorization': `Basic ${adminBasic}`, 'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(dcrBody) },
    dcrBody
  );
  const dcrKey    = dcrRes.json?.clientId;
  const dcrSecret = dcrRes.json?.clientSecret;
  console.log(`DCR: HTTP ${dcrRes.status}  key=${dcrKey}`);

  const pwBody = qs.stringify({
    grant_type: 'password', username: 'admin', password: 'admin',
    scope: 'apim:app_manage apim:subscribe openid',
  });
  const mgmtTokenRes = await post('/oauth2/token',
    { 'Authorization': `Basic ${Buffer.from(`${dcrKey}:${dcrSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(pwBody) },
    pwBody
  );
  const mgmtToken = mgmtTokenRes.json?.access_token;
  console.log(`Mgmt token: HTTP ${mgmtTokenRes.status}  ok=${!!mgmtToken}\n`);

  const H = { 'Authorization': `Bearer ${mgmtToken}`, 'Content-Type': 'application/json' };

  // ── Step 2: Get the COMPLETED key mapping details ─────────────
  console.log('── Getting key details for QueueLanka-Frontend ─────────────────');
  const kmRes = await get(`/api/am/devportal/v3/applications/${APP_ID}/oauth-keys`, H);
  const mappings = kmRes.json?.list || [];
  console.log(`Key mappings: ${mappings.length}`);

  let residentKey = null;
  for (const km of mappings) {
    console.log(`  ${km.keyManager.padEnd(25)} state=${km.keyState}  consumerKey=${km.consumerKey || '(none)'}`);
    if (km.keyManager === 'Resident Key Manager' && km.keyState === 'COMPLETED') {
      residentKey = km;
    }
  }

  // ── Step 3: Get full details of the Resident KM (includes secret) ──
  if (residentKey) {
    console.log(`\n── Fetching Resident Key Manager details ─────────────────────`);
    const kmDetailRes = await get(
      `/api/am/devportal/v3/applications/${APP_ID}/oauth-keys/${residentKey.keyMappingId}`,
      H
    );
    const consumerKey    = kmDetailRes.json?.consumerKey;
    const consumerSecret = kmDetailRes.json?.consumerSecret;
    console.log(`  Consumer Key    : ${consumerKey}`);
    console.log(`  Consumer Secret : ${consumerSecret}`);

    if (consumerKey && consumerSecret) {
      // ── Step 4: Get a fresh access token using these keys ──────
      console.log('\n── Requesting access token (client_credentials) ──────────────');
      const ccBody = qs.stringify({ grant_type: 'client_credentials', scope: 'default' });
      const ccRes = await post('/oauth2/token',
        { 'Authorization': `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(ccBody) },
        ccBody
      );
      console.log(`  Token: HTTP ${ccRes.status}  iss=${ccRes.json?.access_token ? '(decoding)' : 'N/A'}`);

      if (ccRes.json?.access_token) {
        const tok = ccRes.json.access_token;
        // Decode to check iss
        try {
          const payload = JSON.parse(Buffer.from(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')+'==', 'base64').toString());
          console.log(`  iss   : ${payload.iss}`);
          console.log(`  scope : ${payload.scope}`);
          console.log(`  aud   : ${payload.aud}`);
        } catch {}

        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log(  '║              ✅ ACCESS TOKEN READY                         ║');
        console.log(  '╚══════════════════════════════════════════════════════════════╝\n');
        console.log('  Run this command to test the gateway:\n');
        console.log(`  $env:WSO2_TOKEN='${tok}'; node scripts/wso2_gateway_test.js\n`);
      } else {
        console.log(`  ❌ Token failed: ${ccRes.raw.substring(0, 200)}`);
      }
    }
  }

  // ── Step 5: Retry Qlanka_Identity KM generation ───────────────
  console.log('\n── Retrying Qlanka_Identity key generation ───────────────────');
  const genBody = JSON.stringify({
    keyType:    'PRODUCTION',
    keyManager: 'Qlanka_Identity',
    grantTypesToBeSupported: ['client_credentials', 'password', 'refresh_token'],
    callbackUrl: '',
    scopes:      ['default'],
    validityTime: 3600,
    additionalProperties: {},
  });
  const genRes = await post(
    `/api/am/devportal/v3/applications/${APP_ID}/generate-keys`,
    { ...H, 'Content-Length': Buffer.byteLength(genBody) },
    genBody
  );
  console.log(`  Qlanka_Identity generate: HTTP ${genRes.status}`);
  if (genRes.status === 200 || genRes.status === 201) {
    console.log(`  ✅ Consumer Key : ${genRes.json?.consumerKey}`);
    console.log(`  ✅ Token: ${genRes.json?.token?.accessToken || '(use token endpoint)'}`);
    if (genRes.json?.token?.accessToken) {
      console.log('\n  Run with Qlanka_Identity token:');
      console.log(`  $env:WSO2_TOKEN='${genRes.json.token.accessToken}'; node scripts/wso2_gateway_test.js\n`);
    }
  } else {
    console.log(`  ❌ Error: ${genRes.raw.substring(0, 300)}`);
  }
})();
