// Citizen endpoint matrix check (gateway)
// Usage:
//   $env:API_BASE='https://qlanka-gateway.redrock-2a740b8b.centralindia.azurecontainerapps.io'
//   $env:CITIZEN_USER='Uvin'
//   $env:CITIZEN_PASS='Diabalo@666'
//   node scripts/tmp_citizen_endpoint_matrix.js

const API_BASE = (process.env.API_BASE || 'https://qlanka-gateway.redrock-2a740b8b.centralindia.azurecontainerapps.io').replace(/\/+$/, '');
const CITIZEN_USER = process.env.CITIZEN_USER || 'Uvin';
const CITIZEN_PASS = process.env.CITIZEN_PASS || 'Diabalo@666';
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);
const SEARCH_DAYS = Number(process.env.SEARCH_DAYS || 14);

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  return { status: response.status, body: parsed };
}

function parseHHMM(value, fallbackHours, fallbackMinutes) {
  if (typeof value !== 'string') return { hours: fallbackHours, minutes: fallbackMinutes };
  const [h, m] = value.split(':');
  const hours = Number(h);
  const minutes = Number(m);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return { hours: fallbackHours, minutes: fallbackMinutes };
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return { hours: fallbackHours, minutes: fallbackMinutes };
  return { hours, minutes };
}

function pad2(v) {
  return String(v).padStart(2, '0');
}

function extractToken(loginBody) {
  return loginBody?.data?.accessToken || loginBody?.accessToken || loginBody?.token || null;
}

function addCase(result, name, actual, expected, note) {
  const ok = expected.includes(actual);
  result.cases.push({ name, actual, expected, ok, note: note || '' });
}

async function main() {
  const result = {
    baseUrl: API_BASE,
    passed: 0,
    failed: 0,
    cases: [],
    artifacts: {},
  };

  // 1) Auth login valid
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { username: CITIZEN_USER, password: CITIZEN_PASS },
  });
  addCase(result, 'POST /api/auth/login (valid)', login.status, [200]);

  const token = extractToken(login.body);
  if (!token) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  // 2) Auth login invalid
  const badLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: CITIZEN_USER, password: 'wrong-password' },
  });
  addCase(result, 'POST /api/auth/login (invalid password)', badLogin.status, [401]);

  // 3) Public/authorized service centers
  const centers = await api('/api/service-centers', { token });
  addCase(result, 'GET /api/service-centers (citizen)', centers.status, [200]);

  const centerList = Array.isArray(centers.body?.data) ? centers.body.data : (Array.isArray(centers.body) ? centers.body : []);
  const center = centerList.find((c) => c?.isAvailable !== false && c?.isActive !== false) || centerList[0];
  const centerId = Number(center?.centerId ?? center?.id ?? 0);
  result.artifacts.centerId = centerId || null;

  // 4) Unauthorized protected endpoint
  const noAuthMyTokens = await api('/api/token/my-tokens');
  addCase(result, 'GET /api/token/my-tokens (no auth)', noAuthMyTokens.status, [401]);

  // 5) Authorized list endpoints
  const myBookingsBefore = await api('/api/appointment/my-bookings', { token });
  addCase(result, 'GET /api/appointment/my-bookings (citizen)', myBookingsBefore.status, [200]);

  const myTokensBefore = await api('/api/token/my-tokens', { token });
  addCase(result, 'GET /api/token/my-tokens (citizen)', myTokensBefore.status, [200]);

  // 6) Invalid booking payload
  const badBook = await api('/api/appointment/book', {
    method: 'POST',
    token,
    body: {},
  });
  addCase(result, 'POST /api/appointment/book (empty payload)', badBook.status, [400, 404], '400 validation error or 404 when centerId defaults to invalid resource');

  // 7) Valid booking payload with slot-search
  let bookedTokenId = null;
  if (centerId > 0) {
    const open = parseHHMM(center?.openingTime, 9, 0);
    const close = parseHHMM(center?.closingTime, 16, 0);

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

    const time = `${pad2(hh)}:${pad2(mm)}:00`;

    let validBookStatus = null;
    for (let i = 1; i <= SEARCH_DAYS; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(hh, mm, 0, 0);

      const book = await api('/api/appointment/book', {
        method: 'POST',
        token,
        body: {
          centerId,
          appointmentDate: date.toISOString(),
          appointmentTime: time,
        },
      });

      if (book.status === 200) {
        validBookStatus = 200;
        bookedTokenId = Number(book.body?.data?.tokenId || 0) || null;
        result.artifacts.bookedDate = date.toISOString();
        break;
      }

      // Keep trying on normal conflict statuses.
      if (book.status === 409) {
        continue;
      }

      validBookStatus = book.status;
      break;
    }

    if (validBookStatus === null) validBookStatus = 409;
    addCase(result, 'POST /api/appointment/book (valid payload)', validBookStatus, [200, 409], '200 when slot found; 409 when all slots conflict');
  } else {
    addCase(result, 'POST /api/appointment/book (valid payload)', 0, [200, 409], 'Skipped because no center available');
  }

  // 8) Post-booking lists
  const myBookingsAfter = await api('/api/appointment/my-bookings', { token });
  addCase(result, 'GET /api/appointment/my-bookings (after booking)', myBookingsAfter.status, [200]);

  const myTokensAfter = await api('/api/token/my-tokens', { token });
  addCase(result, 'GET /api/token/my-tokens (after booking)', myTokensAfter.status, [200]);

  const tokenList = Array.isArray(myTokensAfter.body?.data)
    ? myTokensAfter.body.data
    : (Array.isArray(myTokensAfter.body) ? myTokensAfter.body : []);

  // 9) Cancel invalid token id
  const cancelInvalid = await api('/api/token/99999999/cancel', { method: 'PUT', token });
  addCase(result, 'PUT /api/token/99999999/cancel (invalid id)', cancelInvalid.status, [404, 409], '404 not found or 409 non-cancellable');

  // 10) Cancel valid waiting token if present
  const waiting = tokenList.find((t) => String(t?.status || '').toLowerCase() === 'waiting');
  if (waiting) {
    const cancel = await api(`/api/token/${waiting.tokenId}/cancel`, { method: 'PUT', token });
    result.artifacts.cancelTokenId = Number(waiting.tokenId);
    addCase(result, 'PUT /api/token/{id}/cancel (waiting token)', cancel.status, [200]);
  } else if (bookedTokenId) {
    const cancel = await api(`/api/token/${bookedTokenId}/cancel`, { method: 'PUT', token });
    result.artifacts.cancelTokenId = bookedTokenId;
    addCase(result, 'PUT /api/token/{id}/cancel (booked token)', cancel.status, [200, 409]);
  } else {
    addCase(result, 'PUT /api/token/{id}/cancel (waiting token)', 0, [200], 'Skipped because no waiting token was available');
  }

  result.passed = result.cases.filter((c) => c.ok).length;
  result.failed = result.cases.length - result.passed;

  console.log(JSON.stringify(result, null, 2));

  if (result.failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(JSON.stringify({ fatal: error?.message || String(error) }, null, 2));
  process.exit(1);
});
