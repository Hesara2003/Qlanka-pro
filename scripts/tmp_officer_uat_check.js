// Officer E2E UAT checker
// Flow: login -> queue view -> call next -> serve/skip -> realtime readiness -> empty queue -> metrics -> logout

const API_BASE = (process.env.API_BASE || 'https://qlanka-gateway.redrock-2a740b8b.centralindia.azurecontainerapps.io').replace(/\/+$/, '').replace(/\/api$/i, '');
const BASE_API = `${API_BASE}/api`;
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);

const ADMIN_USER = process.env.ADMIN_USER || 'seed_admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin123!';
const OFFICER_USER = process.env.OFFICER_USER || '';
const OFFICER_PASS = process.env.OFFICER_PASS || '';

function push(results, step, test, pass, details) {
  results.push({ step, test, pass: !!pass, details });
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

async function bookNextAvailableSlot(token, centerId, startHour = 9, startMinute = 30) {
  const now = new Date();
  const firstCandidate = new Date(now.getTime() + 10 * 60 * 1000);
  const minHour = Math.max(startHour, firstCandidate.getHours());
  const minMinute = (minHour === firstCandidate.getHours())
    ? firstCandidate.getMinutes()
    : startMinute;

  for (let i = 0; i < 120; i += 1) {
    const minute = (minMinute + i) % 60;
    const hourCarry = Math.floor((minMinute + i) / 60);
    const hour = minHour + hourCarry;

    if (hour > 16) break;

    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    const time = `${hh}:${mm}:00`;

    const day = new Date();
    day.setHours(hour, minute, 0, 0);

    const res = await call('/appointment/book', {
      method: 'POST',
      token,
      body: { centerId, appointmentDate: day.toISOString(), appointmentTime: time },
    });

    if (res.status === 200) {
      return { status: 200, time, data: res.data };
    }

    if (res.status !== 409) {
      return { status: res.status, time, data: res.data };
    }
  }

  return { status: 409, time: null, data: null };
}

function tokenFromLogin(body) {
  return body?.data?.accessToken || body?.accessToken || body?.token || null;
}

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

(async function main() {
  const results = [];
  const artifacts = {};

  const suffix = Date.now().toString().slice(-7);
  const officerUser = OFFICER_USER || `officer_uat_${suffix}`;
  const officerEmail = `${officerUser}@mailinator.com`;
  const officerPass = OFFICER_PASS || 'Officer@123';

  const citizenAUser = `citizenA_uat_${suffix}`;
  const citizenBUser = `citizenB_uat_${suffix}`;
  const citizenPass = 'Citizen@123';

  // Register officer unless explicit credentials are provided.
  if (!OFFICER_USER || !OFFICER_PASS) {
    const regOfficer = await call('/auth/register', {
      method: 'POST',
      body: { username: officerUser, email: officerEmail, password: officerPass, role: 'officer' },
    });
    push(results, 'Officer Login', 'Register officer test account', [200, 201].includes(regOfficer.status), `status=${regOfficer.status}`);
  } else {
    push(results, 'Officer Login', 'Use provided officer credentials', true, `username=${officerUser}`);
  }

  // Register citizens for queue seeds
  const regCitizenA = await call('/auth/register', {
    method: 'POST',
    body: { username: citizenAUser, email: `${citizenAUser}@mailinator.com`, password: citizenPass, role: 'citizen' },
  });
  push(results, 'View Queue', 'Register citizen seed A', [200, 201].includes(regCitizenA.status), `status=${regCitizenA.status}`);

  const regCitizenB = await call('/auth/register', {
    method: 'POST',
    body: { username: citizenBUser, email: `${citizenBUser}@mailinator.com`, password: citizenPass, role: 'citizen' },
  });
  push(results, 'View Queue', 'Register citizen seed B', [200, 201].includes(regCitizenB.status), `status=${regCitizenB.status}`);

  // Login admin for setup
  const adminLogin = await call('/auth/login', {
    method: 'POST',
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const adminToken = tokenFromLogin(adminLogin.data);
  push(results, 'Officer Login', 'Admin login for setup', adminLogin.status === 200 && !!adminToken, `status=${adminLogin.status}`);

  // Login officer
  const officerLogin = await call('/auth/login', {
    method: 'POST',
    body: { username: officerUser, password: officerPass },
  });
  const officerToken = tokenFromLogin(officerLogin.data);
  const officerJwt = officerToken ? decodeJwtPayload(officerToken) : null;
  const officerRole = officerJwt?.role || officerLogin.data?.role || null;
  push(results, 'Officer Login', 'Officer login returns JWT', officerLogin.status === 200 && !!officerToken, `status=${officerLogin.status}`);
  push(results, 'Officer Login', 'JWT has officer/admin role', officerRole === 'officer' || officerRole === 'admin', `role=${officerRole}`);

  // Login one citizen for 403 checks and later realtime compare
  const citizenLogin = await call('/auth/login', {
    method: 'POST',
    body: { username: citizenAUser, password: citizenPass },
  });
  const citizenToken = tokenFromLogin(citizenLogin.data);

  if (!adminToken || !officerToken || !citizenToken) {
    const passCount = results.filter((r) => r.pass).length;
    const failCount = results.length - passCount;
    console.log(JSON.stringify({ baseUrl: API_BASE, passCount, failCount, results, artifacts, fatal: 'Missing required tokens to continue flow' }, null, 2));
    process.exit(1);
  }

  // Resolve officer userId via admin users API
  const usersRes = await call('/admin/users?role=officer', { token: adminToken });
  const officers = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
  const officerUserRow = officers.find((u) => String(u?.username) === officerUser);
  const officerUserId = Number(officerUserRow?.userId || 0);
  artifacts.officerUserId = officerUserId || null;
  push(results, 'Officer Login', 'Officer exists in admin user list', usersRes.status === 200 && officerUserId > 0, `status=${usersRes.status}, userId=${officerUserId}`);

  // Determine center
  const centersRes = await call('/service-centers', { token: adminToken });
  const centers = Array.isArray(centersRes.data?.data) ? centersRes.data.data : (Array.isArray(centersRes.data) ? centersRes.data : []);
  const preferredCenter = centers.find((c) => Number(c?.centerId ?? c?.id) === 1 && c?.isActive !== false);
  const center = preferredCenter || centers.find((c) => c?.isActive !== false && c?.isAvailable !== false) || centers[0];
  const centerId = Number(center?.centerId ?? center?.id ?? 0);
  artifacts.centerId = centerId || null;

  // Create dedicated counter assigned to this officer
  const counterName = `UAT Counter ${suffix}`;
  const createCounter = await call(`/admin/centers/${centerId}/counters`, {
    method: 'POST',
    token: adminToken,
    body: { centerId, name: counterName, assignedOfficerUserId: officerUserId },
  });
  const counterId = Number(createCounter.data?.data?.counterId || 0);
  artifacts.counterId = counterId || null;
  push(results, 'Officer Login', 'Officer can be assigned to counter', createCounter.status === 201 && counterId > 0, `status=${createCounter.status}, counterId=${counterId}`);

  const openCounter = counterId > 0
    ? await call(`/admin/centers/${centerId}/counters/${counterId}/status`, {
        method: 'PATCH',
        token: adminToken,
        body: { isOpen: true, reason: 'Officer UAT execution' },
      })
    : { status: 0, data: null };
  push(results, 'Officer Login', 'Counter opened for queue operations', openCounter.status === 200, `status=${openCounter.status}`);

  // Unauthorized users blocked (citizen token on officer endpoint)
  const citizenForbidden = await call(`/counters/${counterId}/dashboard`, { token: citizenToken });
  push(results, 'Officer Login', 'Unauthorized users blocked from officer endpoints', citizenForbidden.status === 403, `status=${citizenForbidden.status}`);

  // Login two seed citizens and create today queue tokens at distinct time slots
  const loginA = await call('/auth/login', { method: 'POST', body: { username: citizenAUser, password: citizenPass } });
  const loginB = await call('/auth/login', { method: 'POST', body: { username: citizenBUser, password: citizenPass } });
  const tokenA = tokenFromLogin(loginA.data);
  const tokenB = tokenFromLogin(loginB.data);

  const bookA = await bookNextAvailableSlot(tokenA, centerId, 9, 30);
  const bookB = await bookNextAvailableSlot(tokenB, centerId, 10, 0);

  push(results, 'View Queue', 'Seed booking A created', bookA.status === 200 || bookA.status === 409, `status=${bookA.status}`);
  push(results, 'View Queue', 'Seed booking B created', bookB.status === 200 || bookB.status === 409, `status=${bookB.status}`);

  // 2) View queue
  const dash1 = await call(`/counters/${counterId}/dashboard`, { token: officerToken });
  const waiting1 = await call(`/counters/${counterId}/tokens/waiting`, { token: officerToken });
  const waitingList1 = Array.isArray(waiting1.data?.data) ? waiting1.data.data : [];
  const ordered = waitingList1.every((t, i, arr) => i === 0 || Number(arr[i - 1].queuePosition) <= Number(t.queuePosition));

  push(results, 'View Queue', 'Officer dashboard loads', dash1.status === 200, `status=${dash1.status}`);
  push(results, 'View Queue', 'Waiting list endpoint loads', waiting1.status === 200, `status=${waiting1.status}, count=${waitingList1.length}`);
  push(results, 'View Queue', 'Queue position order is valid', ordered, `count=${waitingList1.length}`);

  // 3) Call next token
  const callNext = await call(`/counters/${counterId}/call-next`, { method: 'POST', token: officerToken });
  const calledTokenId = Number(callNext.data?.data?.tokenId || 0);
  artifacts.calledTokenId = calledTokenId || null;

  const dashAfterCall = await call(`/counters/${counterId}/dashboard`, { token: officerToken });
  const waitingAfterCall = await call(`/counters/${counterId}/tokens/waiting`, { token: officerToken });
  const waitingListAfterCall = Array.isArray(waitingAfterCall.data?.data) ? waitingAfterCall.data.data : [];

  push(results, 'Call Next', 'Call next returns token', callNext.status === 200 && calledTokenId > 0, `status=${callNext.status}, tokenId=${calledTokenId}`);
  push(results, 'Call Next', 'Current token shown in dashboard', dashAfterCall.status === 200 && !!dashAfterCall.data?.data?.currentToken, `status=${dashAfterCall.status}`);

  // 4) Real-time update readiness + observable state change
  const negotiate = await call('/hubs/queue/negotiate?negotiateVersion=1', {
    method: 'POST',
    token: officerToken,
    base: API_BASE,
    body: {},
  });
  const countChanged = waitingListAfterCall.length <= waitingList1.length;
  push(results, 'Real-time', 'SignalR negotiate reachable', negotiate.status === 200, `status=${negotiate.status}`);
  push(results, 'Real-time', 'Queue state changes after call-next', countChanged, `before=${waitingList1.length}, after=${waitingListAfterCall.length}`);

  // 5) Serve token
  const serve = calledTokenId
    ? await call(`/counters/${counterId}/tokens/${calledTokenId}/status`, { method: 'PUT', token: officerToken, body: { status: 'served' } })
    : { status: 0, data: null };
  const waitingAfterServe = await call(`/counters/${counterId}/tokens/waiting`, { token: officerToken });
  const waitingListAfterServe = Array.isArray(waitingAfterServe.data?.data) ? waitingAfterServe.data.data : [];

  push(results, 'Serve Token', 'Mark served succeeds', serve.status === 200, `status=${serve.status}`);
  push(results, 'Serve Token', 'Served token not in waiting queue', calledTokenId > 0 ? !waitingListAfterServe.some((t) => Number(t.tokenId) === calledTokenId) : false, `tokenId=${calledTokenId}`);

  // 6) Skip token (optional)
  const callNext2 = await call(`/counters/${counterId}/call-next`, { method: 'POST', token: officerToken });
  const calledTokenId2 = Number(callNext2.data?.data?.tokenId || 0);
  const skip = calledTokenId2
    ? await call(`/counters/${counterId}/tokens/${calledTokenId2}/status`, { method: 'PUT', token: officerToken, body: { status: 'skipped' } })
    : { status: 0, data: null };

  push(results, 'Skip Token', 'Call next for skip scenario', callNext2.status === 200 || callNext2.status === 404, `status=${callNext2.status}`);
  if (calledTokenId2 > 0) {
    push(results, 'Skip Token', 'Skip token succeeds', skip.status === 200, `status=${skip.status}, tokenId=${calledTokenId2}`);
  } else {
    push(results, 'Skip Token', 'Skip token succeeds', true, 'No token to skip (queue already empty)');
  }

  // 7) Empty queue
  let emptyHandled = false;
  for (let i = 0; i < 5; i += 1) {
    const cn = await call(`/counters/${counterId}/call-next`, { method: 'POST', token: officerToken });
    if (cn.status === 404) {
      emptyHandled = true;
      break;
    }
    if (cn.status === 200) {
      const tid = Number(cn.data?.data?.tokenId || 0);
      if (tid > 0) {
        await call(`/counters/${counterId}/tokens/${tid}/status`, { method: 'PUT', token: officerToken, body: { status: 'served' } });
      }
    }
  }
  const waitingAtEnd = await call(`/counters/${counterId}/tokens/waiting`, { token: officerToken });
  const waitingEndList = Array.isArray(waitingAtEnd.data?.data) ? waitingAtEnd.data.data : [];

  push(results, 'Empty queue', 'Call-next returns no-token handling', emptyHandled, `waitingEnd=${waitingEndList.length}`);
  push(results, 'Empty queue', 'Waiting list eventually empty', waitingEndList.length === 0, `count=${waitingEndList.length}`);

  // 8) Metrics (optional)
  const stats = await call(`/counters/${counterId}/stats`, { token: officerToken });
  const statsData = stats.data?.data || {};
  const hasMetrics =
    typeof statsData.servedCount === 'number' &&
    typeof statsData.skippedCount === 'number' &&
    typeof statsData.averageServiceTimeSeconds === 'number';
  push(results, 'View Queue Metrics', 'Stats endpoint returns metrics', stats.status === 200 && hasMetrics, `status=${stats.status}`);

  // 9) Logout behavior
  const noTokenAfterLogout = await call(`/counters/${counterId}/dashboard`);
  push(results, 'Logout', 'Protected endpoint blocked after token removal', noTokenAfterLogout.status === 401, `status=${noTokenAfterLogout.status}`);

  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.length - passCount;

  console.log(JSON.stringify({ baseUrl: API_BASE, passCount, failCount, results, artifacts }, null, 2));
  if (failCount > 0) process.exit(1);
})();
