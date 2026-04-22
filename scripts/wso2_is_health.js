'use strict';
const https = require('https');

const HOST    = '20.193.250.12';
const PORT    = 9443;
const ADMIN_B = Buffer.from('admin:admin').toString('base64');
const TIMEOUT = 12000;

function req(path, extraHeaders = {}) {
  return new Promise(resolve => {
    const r = https.request(
      {
        hostname: HOST, port: PORT, path, method: 'GET',
        rejectUnauthorized: false,
        headers: { 'Authorization': 'Basic ' + ADMIN_B, ...extraHeaders },
      },
      res => {
        let d = '';
        res.on('data', c => { d += c; });
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(d); } catch {}
          resolve({ status: res.statusCode, json, raw: d.substring(0, 300) });
        });
      }
    );
    r.on('error', e => resolve({ status: 0, json: null, raw: String(e) }));
    r.setTimeout(TIMEOUT, () => r.destroy(new Error('TIMEOUT')));
    r.end();
  });
}

(async () => {
  console.log('\n  ╔══════════════════════════════════════════════════════════╗');
  console.log(  '  ║       WSO2 Identity Server — Health Check               ║');
  console.log(  '  ╚══════════════════════════════════════════════════════════╝');
  console.log('  Host: ' + HOST + ':' + PORT);
  console.log('  ' + new Date().toISOString() + '\n');

  const checks = [
    ['/oauth2/token/.well-known/openid-configuration', 'OIDC Discovery Endpoint'],
    ['/oauth2/jwks',                                    'JWKS Signing Keys'],
    ['/oauth2/userinfo',                                'UserInfo Endpoint'],
    ['/scim2/ServiceProviderConfig',                    'SCIM2 Service Provider Config'],
    ['/scim2/Users?count=1',                            'SCIM2 User Management'],
    ['/api/server/v1/configs',                          'Server Config API'],
    ['/api/server/v1/identity-providers',               'Identity Providers API'],
    ['/api/identity/user/v1.0/me',                      'Identity User (Me) API'],
  ];

  let pass = 0, fail = 0;

  for (const [path, label] of checks) {
    const res = await req(path);
    const isUp  = res.status > 0 && res.status < 500;
    const isOk  = res.status === 200;
    const icon  = isOk ? '✅' : isUp ? '🟡' : '❌';
    if (isUp) pass++; else fail++;

    const detail =
      res.status === 0   ? 'TIMEOUT / NETWORK ERROR' :
      res.status === 200 ? 'OK' :
      res.status === 401 ? 'Endpoint exists (auth required)' :
      res.status === 403 ? 'Endpoint exists (access denied)' :
      res.status === 404 ? 'Not found' :
      'HTTP ' + res.status;

    console.log('  ' + icon + '  ' + label.padEnd(38) + ' → ' + detail);

    // Print extra detail for key endpoints
    if (isOk && res.json) {
      if (path.includes('openid-configuration')) {
        console.log('       issuer          : ' + res.json.issuer);
        console.log('       token_endpoint  : ' + res.json.token_endpoint);
        console.log('       jwks_uri        : ' + res.json.jwks_uri);
        console.log('       grant_types     : ' + (res.json.grant_types_supported || []).join(', '));
      }
      if (path.includes('jwks')) {
        console.log('       keys count      : ' + (res.json.keys || []).length);
        if (res.json.keys && res.json.keys[0]) {
          console.log('       key alg         : ' + res.json.keys[0].alg);
          console.log('       key use         : ' + res.json.keys[0].use);
        }
      }
      if (path.includes('scim2/Users')) {
        console.log('       totalResults    : ' + res.json.totalResults);
        if (res.json.Resources) {
          res.json.Resources.forEach(u => console.log('       user            : ' + u.userName));
        }
      }
      if (path.includes('identity-providers')) {
        const count = res.json.totalResults || (res.json.identityProviders || []).length;
        console.log('       IdP count       : ' + count);
      }
    }
  }

  // Token endpoint test (POST)
  console.log('\n  ── Token Endpoint (POST test) ────────────────────────────');
  const qs = require('querystring');
  const CONSUMER_KEY    = 'bOhc0ENWBPxvw_sXu8fxHv_Rz2Aa';
  const CONSUMER_SECRET = 'obSMMQApn1PIkkAcZRCQ80rl_doa';
  const ccBody = qs.stringify({ grant_type: 'client_credentials', scope: 'default' });
  const ccBasic = Buffer.from(CONSUMER_KEY + ':' + CONSUMER_SECRET).toString('base64');

  const tokenPromise = new Promise(resolve => {
    const r = https.request(
      {
        hostname: HOST, port: PORT, path: '/oauth2/token', method: 'POST',
        rejectUnauthorized: false,
        headers: {
          'Authorization': 'Basic ' + ccBasic,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(ccBody),
        },
      },
      res => {
        let d = '';
        res.on('data', c => { d += c; });
        res.on('end', () => {
          let json = null; try { json = JSON.parse(d); } catch {}
          resolve({ status: res.statusCode, json, raw: d.substring(0, 200) });
        });
      }
    );
    r.on('error', e => resolve({ status: 0, json: null, raw: String(e) }));
    r.setTimeout(TIMEOUT, () => r.destroy());
    r.write(ccBody);
    r.end();
  });

  const tokenRes = await tokenPromise;
  const gotToken = !!tokenRes.json?.access_token;
  const tokenIcon = gotToken ? '✅' : '❌';
  if (gotToken) pass++; else fail++;

  console.log('  ' + tokenIcon + '  Token Issuance (client_credentials)    → HTTP ' + tokenRes.status + (gotToken ? ' — token issued ✓' : ' — ' + tokenRes.raw));

  if (gotToken) {
    try {
      const tok = tokenRes.json.access_token;
      const payload = JSON.parse(Buffer.from(tok.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')+'==','base64').toString());
      console.log('       iss             : ' + payload.iss);
      console.log('       scope           : ' + payload.scope);
      console.log('       expires         : ' + new Date(payload.exp * 1000).toISOString());
    } catch {}
  }

  // SCIM2 user count via POST introspection
  console.log('\n  ── SCIM2 User List ────────────────────────────────────────');
  const scimRes = await req('/scim2/Users');
  if (scimRes.status === 200) {
    const users = scimRes.json?.Resources || [];
    console.log('  ✅ Total users in Identity Server: ' + (scimRes.json?.totalResults || users.length));
    users.slice(0, 5).forEach(u => {
      const roles = (u.groups || []).map(g => g.display).join(', ') || 'N/A';
      console.log('     → ' + u.userName + '  (groups: ' + roles + ')');
    });
  } else {
    console.log('  🟡 SCIM2 Users: HTTP ' + scimRes.status);
  }

  // Summary
  const total = pass + fail;
  const status = fail === 0 ? '🟢 HEALTHY — All endpoints operational'
               : fail <= 2  ? '🟡 MOSTLY UP — Minor issues'
               :              '🔴 ISSUES DETECTED';

  console.log('\n  ╔══════════════════════════════════════════════════════════╗');
  console.log(  '  ║                    VERDICT                              ║');
  console.log(  '  ╚══════════════════════════════════════════════════════════╝');
  console.log('  ' + status);
  console.log('  Checks: ' + total + '  |  ✅ Up: ' + pass + '  |  ❌ Down: ' + fail + '\n');
})();
