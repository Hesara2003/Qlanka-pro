// Citizen UAT checklist runner
// Covers: Register(API), Login(JWT claims for redirect), View Centers, Booking(200+409),
// Token View correctness, Real-time readiness (SignalR negotiate), Cancel status change,
// Logout simulation (token removed -> protected endpoint denied)

const API_BASE = (process.env.API_BASE || 'https://qlanka-gateway.redrock-2a740b8b.centralindia.azurecontainerapps.io').replace(/\/+$/, '');
const BASE_API = `${API_BASE}/api`;
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);
const SEARCH_DAYS = Number(process.env.SEARCH_DAYS || 14);

function b64UrlDecode(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    return JSON.parse(b64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

async function call(path, { method = 'GET', token, body, base = BASE_API } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  return { status: res.status, data };
}

function tokenFromLoginBody(body) {
  return body?.data?.accessToken || body?.accessToken || body?.token || null;
}

function parseHHMM(value, fallbackHours, fallbackMinutes) {
  if (typeof value !== 'string') return { hours: fallbackHours, minutes: fallbackMinutes };
  const parts = value.split(':');
  if (parts.length < 2) return { hours: fallbackHours, minutes: fallbackMinutes };
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return { hours: fallbackHours, minutes: fallbackMinutes };
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return { hours: fallbackHours, minutes: fallbackMinutes };
  return { hours, minutes };
}

function p2(v) {
  return String(v).padStart(2, '0');
}

function push(results, step, test, pass, details) {
  results.push({ step, test, pass, details });
}

(async function main() {
  const results = [];
  const artifacts = {};

  const suffix = Date.now().toString().slice(-7);
  const regUser = `citizen_uat_${suffix}`;
  const regEmail = `${regUser}@mailinator.com`;
  const regPass = 'Citizen@123';

  // 1) Register: API
  const registerRes = await call('/auth/register', {
    method: 'POST',
    body: { username: regUser, email: regEmail, password: regPass, role: 'citizen' },
  });
  push(results, 'Register', 'API register new citizen', registerRes.status === 200 || registerRes.status === 201, `status=${registerRes.status}`);
  artifacts.registerUser = regUser;
  artifacts.registerStatus = registerRes.status;

  // 2) Login: JWT + redirect contract
  const loginUser = process.env.CITIZEN_USER || regUser;
  const loginPass = process.env.CITIZEN_PASS || regPass;
  const loginRes = await call('/auth/login', {
    method: 'POST',
    body: { username: loginUser, password: loginPass },
  });

  const token = tokenFromLoginBody(loginRes.data);
  const jwtPayload = token ? decodeJwtPayload(token) : null;
  const role = jwtPayload?.role || loginRes.data?.role || null;

  push(results, 'Login', 'API login returns token', loginRes.status === 200 && !!token, `status=${loginRes.status}`);
  push(results, 'Login', 'JWT role supports citizen redirect', role === 'citizen', `role=${role ?? 'null'}`);

  if (!token) {
    const passCount = results.filter((r) => r.pass).length;
    const failCount = results.length - passCount;
    console.log(JSON.stringify({ passCount, failCount, results, artifacts, fatal: 'Cannot continue without token' }, null, 2));
    process.exit(1);
  }

  // 3) View Centers: data rendering contract
  const centersRes = await call('/service-centers', { token });
  const centerData = Array.isArray(centersRes.data?.data) ? centersRes.data.data : (Array.isArray(centersRes.data) ? centersRes.data : []);
  const sampleCenter = centerData[0] || null;
  const hasRenderableFields = !!(sampleCenter && (sampleCenter.name || sampleCenter.centerId || sampleCenter.id));

  push(results, 'View Centers', 'Centers API reachable', centersRes.status === 200, `status=${centersRes.status}`);
  push(results, 'View Centers', 'Center data renderable', hasRenderableFields, `count=${centerData.length}`);

  const preferredCenter = centerData.find((c) => Number(c?.centerId ?? c?.id) === 1 && c?.isActive !== false);
  const selectedCenter = preferredCenter || centerData.find((c) => c?.isActive !== false && c?.isAvailable !== false) || sampleCenter;
  const centerId = Number(selectedCenter?.centerId ?? selectedCenter?.id ?? 0);
  artifacts.centerId = centerId || null;

  // 4) Booking: success + 409
  let booking200 = false;
  let booking409 = false;
  let bookedTokenId = null;

  if (centerId > 0) {
    const open = parseHHMM(selectedCenter?.openingTime, 9, 0);
    const close = parseHHMM(selectedCenter?.closingTime, 16, 0);

    let hh = open.hours;
    let mm = open.minutes + 30;
    if (mm >= 60) {
      hh += 1;
      mm -= 60;
    }
    if (hh > close.hours || (hh === close.hours && mm >= close.minutes)) {
      hh = open.hours;
      mm = open.minutes;
    }

    const time = `${p2(hh)}:${p2(mm)}:00`;

    for (let i = 1; i <= SEARCH_DAYS; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(hh, mm, 0, 0);

      const b = await call('/appointment/book', {
        method: 'POST',
        token,
        body: { centerId, appointmentDate: date.toISOString(), appointmentTime: time },
      });

      if (b.status === 409) {
        booking409 = true;
        continue;
      }

      if (b.status === 200) {
        booking200 = true;
        bookedTokenId = Number(b.data?.data?.tokenId || 0) || null;
        artifacts.bookedDate = date.toISOString();
        break;
      }
    }
  }

  push(results, 'Booking', 'Booking success scenario (200)', booking200, `bookedTokenId=${bookedTokenId ?? 'null'}`);
  push(results, 'Booking', 'Booking conflict scenario (409)', booking409, 'Observed at least one conflict day/slot');

  // 5) Token View: data correctness
  const myTokensRes = await call('/token/my-tokens', { token });
  const myTokens = Array.isArray(myTokensRes.data?.data) ? myTokensRes.data.data : (Array.isArray(myTokensRes.data) ? myTokensRes.data : []);
  const tokenShapeOk = myTokens.every((t) => t && typeof t.tokenId === 'number' && typeof t.centerId === 'number' && typeof t.status === 'string');
  const bookedTokenVisible = bookedTokenId ? myTokens.some((t) => Number(t.tokenId) === bookedTokenId) : true;

  push(results, 'Token View', 'My tokens endpoint returns 200', myTokensRes.status === 200, `status=${myTokensRes.status}`);
  push(results, 'Token View', 'Token object shape valid', tokenShapeOk, `count=${myTokens.length}`);
  push(results, 'Token View', 'Newly booked token visible', bookedTokenVisible, `bookedTokenId=${bookedTokenId ?? 'none'}`);

  // 6) Real-time: SignalR negotiate endpoint readiness
  const negotiate = await call('/hubs/queue/negotiate?negotiateVersion=1', {
    method: 'POST',
    token,
    base: API_BASE,
    body: {},
  });
  const negotiateOk = negotiate.status === 200 && (negotiate.data?.connectionId || negotiate.data?.connectionToken);
  push(results, 'Real-time', 'SignalR negotiate reachable for citizen', !!negotiateOk, `status=${negotiate.status}`);

  // 7) Cancel: status change
  const waitingToken = myTokens.find((t) => String(t?.status || '').toLowerCase() === 'waiting');
  const targetTokenId = waitingToken ? Number(waitingToken.tokenId) : bookedTokenId;
  let cancelOk = false;
  let statusChanged = false;

  if (targetTokenId) {
    const cancelRes = await call(`/token/${targetTokenId}/cancel`, { method: 'PUT', token });
    cancelOk = cancelRes.status === 200;

    const afterCancel = await call('/token/my-tokens', { token });
    const tokensAfter = Array.isArray(afterCancel.data?.data) ? afterCancel.data.data : (Array.isArray(afterCancel.data) ? afterCancel.data : []);
    const targetAfter = tokensAfter.find((t) => Number(t.tokenId) === targetTokenId);
    statusChanged = String(targetAfter?.status || '').toLowerCase() === 'cancelled';

    artifacts.cancelTokenId = targetTokenId;
    artifacts.cancelStatus = cancelRes.status;
  }

  push(results, 'Cancel', 'Cancel API returns success', cancelOk, `tokenId=${targetTokenId ?? 'none'}`);
  push(results, 'Cancel', 'Token status changed to Cancelled', statusChanged, `tokenId=${targetTokenId ?? 'none'}`);

  // 8) Logout: token removal behavior simulation
  const protectedWithNoToken = await call('/token/my-tokens');
  push(results, 'Logout', 'Protected endpoint denied without token', protectedWithNoToken.status === 401, `status=${protectedWithNoToken.status}`);

  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.length - passCount;

  console.log(JSON.stringify({ baseUrl: API_BASE, passCount, failCount, results, artifacts }, null, 2));
  if (failCount > 0) process.exit(1);
})();
