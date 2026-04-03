// Admin E2E UAT checker
// Flow: admin login -> centers list -> create center -> update/toggle checks -> users list/delete -> RBAC -> propagation -> logout

const API_BASE = (process.env.API_BASE || 'https://qlanka-gateway.redrock-2a740b8b.centralindia.azurecontainerapps.io').replace(/\/+$/, '').replace(/\/api$/i, '');
const BASE_API = `${API_BASE}/api`;
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);

const ADMIN_USER = process.env.ADMIN_USER || 'seed_admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Admin123!';
const CITIZEN_USER = process.env.CITIZEN_USER || 'Uvin';
const CITIZEN_PASS = process.env.CITIZEN_PASS || 'Diabalo@666';

function push(results, step, test, pass, details) {
  results.push({ step, test, pass: !!pass, details });
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

function tokenFromLogin(body) {
  return body?.data?.accessToken || body?.accessToken || body?.token || null;
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

async function tryPaths(paths, opts) {
  const attempts = [];
  for (const p of paths) {
    const res = await call(p, opts);
    attempts.push({ path: p, status: res.status, data: res.data });

    // Stop on non-route errors or success.
    if (![404, 405].includes(res.status)) {
      return { chosen: p, ...res, attempts };
    }
  }

  const last = attempts[attempts.length - 1] || { path: paths[0], status: 0, data: null };
  return { chosen: last.path, status: last.status, data: last.data, attempts };
}

(async function main() {
  const results = [];
  const artifacts = {};

  const suffix = Date.now().toString().slice(-7);
  const adminCenterName = `Admin UAT Center ${suffix}`;
  const adminCenterAddress = `No ${suffix}, Galle Road, Colombo`;

  // 1) Admin login
  const adminLogin = await call('/auth/login', {
    method: 'POST',
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const adminToken = tokenFromLogin(adminLogin.data);
  const adminJwt = adminToken ? decodeJwtPayload(adminToken) : null;
  const adminRole = adminJwt?.role || adminLogin.data?.role || null;

  push(results, 'Admin Login', 'POST /auth/login -> 200', adminLogin.status === 200 && !!adminToken, `status=${adminLogin.status}`);
  push(results, 'Admin Login', 'JWT issued with admin role', adminRole === 'admin', `role=${adminRole ?? 'null'}`);

  if (!adminToken) {
    const passCount = results.filter((r) => r.pass).length;
    const failCount = results.length - passCount;
    console.log(JSON.stringify({ baseUrl: API_BASE, passCount, failCount, results, artifacts, fatal: 'Cannot continue without admin token' }, null, 2));
    process.exit(1);
  }

  // Citizen token for RBAC and propagation checks.
  const citizenLogin = await call('/auth/login', {
    method: 'POST',
    body: { username: CITIZEN_USER, password: CITIZEN_PASS },
  });
  const citizenToken = tokenFromLogin(citizenLogin.data);

  // Admin-only access baseline: admin endpoint accessible.
  const adminUsersOk = await call('/admin/users', { token: adminToken });
  push(results, 'Admin Login', 'Admin-only data accessible to admin', adminUsersOk.status === 200, `status=${adminUsersOk.status}`);

  // Non-admin blocked.
  if (citizenToken) {
    const nonAdminBlocked = await call('/admin/users', { token: citizenToken });
    push(results, 'Admin Login', 'Non-admin blocked from admin endpoints (403)', nonAdminBlocked.status === 403, `status=${nonAdminBlocked.status}`);
  } else {
    push(results, 'Admin Login', 'Non-admin blocked from admin endpoints (403)', false, 'citizen login failed');
  }

  // 2) View service centers
  const centersRead = await tryPaths(['/admin/centers', '/service-centers'], { token: adminToken });
  const centersList = Array.isArray(centersRead.data?.data)
    ? centersRead.data.data
    : (Array.isArray(centersRead.data) ? centersRead.data : []);
  const centerShapeOk = centersList.length === 0 || centersList.every((c) => {
    const hasName = typeof c?.name === 'string' && c.name.length > 0;
    const hasAddress = typeof c?.address === 'string' && c.address.length > 0;
    const hasStatus = typeof c?.isActive === 'boolean' || typeof c?.isAvailable === 'boolean';
    return hasName && hasAddress && hasStatus;
  });

  artifacts.centersGetPath = centersRead.chosen;
  push(results, 'View Service Centers', 'GET centers endpoint reachable', centersRead.status === 200, `path=${centersRead.chosen}, status=${centersRead.status}`);
  push(results, 'View Service Centers', 'Center list has name/address/status fields', centerShapeOk, `count=${centersList.length}`);

  // 3) Create service center (core)
  const createPayload = {
    name: adminCenterName,
    address: adminCenterAddress,
    phone: '+94 11 555 1234',
    email: `admin.center.${suffix}@mailinator.com`,
    description: 'Created by admin UAT',
    timezone: 'Asia/Colombo',
    capacity: 80,
    averageServiceTimeMinutes: 12,
    openingTime: '08:00',
    closingTime: '17:00',
    isActive: true,
    city: 'Colombo',
    district: 'Colombo',
    province: 'Western Province',
    country: 'Sri Lanka'
  };

  const createCenter = await tryPaths(['/centers', '/service-centers'], {
    method: 'POST',
    token: adminToken,
    body: createPayload,
  });

  const createdCenter = createCenter.data?.data || createCenter.data || null;
  const createdCenterId = Number(createdCenter?.centerId ?? createdCenter?.id ?? 0);
  artifacts.createdCenterId = createdCenterId || null;
  artifacts.centersCreatePath = createCenter.chosen;

  push(results, 'Create Service Center', 'POST center -> 201 Created', createCenter.status === 201, `path=${createCenter.chosen}, status=${createCenter.status}`);

  const centersAfterCreate = await tryPaths(['/admin/centers', '/service-centers'], { token: adminToken });
  const centersAfterList = Array.isArray(centersAfterCreate.data?.data)
    ? centersAfterCreate.data.data
    : (Array.isArray(centersAfterCreate.data) ? centersAfterCreate.data : []);
  const centerVisibleAfterCreate = centersAfterList.some((c) => String(c?.name) === adminCenterName);
  push(results, 'Create Service Center', 'New center appears in admin center list', centerVisibleAfterCreate, `name=${adminCenterName}`);

  // 4) Update center (optional feature)
  let optionalUpdatePassed = false;
  let optionalUpdateNote = 'center not created';
  if (createdCenterId > 0) {
    const updatePayload = {
      ...createPayload,
      name: `${adminCenterName} Updated`,
      address: `${adminCenterAddress} - Updated`,
      isActive: true,
    };

    const updateTry = await tryPaths([
      `/centers/${createdCenterId}`,
      `/service-centers/${createdCenterId}`,
    ], {
      method: 'PUT',
      token: adminToken,
      body: updatePayload,
    });

    if ([404, 405].includes(updateTry.status)) {
      optionalUpdatePassed = true;
      optionalUpdateNote = `SKIPPED_UNSUPPORTED status=${updateTry.status}`;
    } else {
      optionalUpdatePassed = [200, 204].includes(updateTry.status);
      optionalUpdateNote = `status=${updateTry.status}, path=${updateTry.chosen}`;
    }
  }
  push(results, 'Update Center', 'Update center details (optional feature)', optionalUpdatePassed, optionalUpdateNote);

  // 5) Enable / disable center
  let togglePass = false;
  let toggleNote = 'center not created';
  if (createdCenterId > 0) {
    const disableTry = await tryPaths([
      `/admin/centers/${createdCenterId}/status`,
      `/centers/${createdCenterId}/status`,
      `/service-centers/${createdCenterId}/status`,
    ], {
      method: 'PATCH',
      token: adminToken,
      body: { isActive: false, status: 'closed', reason: 'Admin UAT disable check' },
    });

    if ([404, 405].includes(disableTry.status)) {
      togglePass = false;
      toggleNote = `UNSUPPORTED status=${disableTry.status}`;
    } else {
      // If disable API exists, verify citizen booking fails on this center.
      const citizenBlock = citizenToken
        ? await call('/appointment/book', {
            method: 'POST',
            token: citizenToken,
            body: {
              centerId: createdCenterId,
              appointmentDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              appointmentTime: '10:00:00',
            },
          })
        : { status: 0 };

      const blockedWhenClosed = [400, 404, 409, 422].includes(citizenBlock.status);

      const enableTry = await tryPaths([
        `/admin/centers/${createdCenterId}/status`,
        `/centers/${createdCenterId}/status`,
        `/service-centers/${createdCenterId}/status`,
      ], {
        method: 'PATCH',
        token: adminToken,
        body: { isActive: true, status: 'open', reason: 'Admin UAT enable check' },
      });

      togglePass = [200, 204].includes(disableTry.status) && [200, 204].includes(enableTry.status) && blockedWhenClosed;
      toggleNote = `disable=${disableTry.status}, enable=${enableTry.status}, blockedWhenClosed=${blockedWhenClosed}`;
    }
  }
  push(results, 'Enable / Disable Center', 'Toggle center open/closed and enforce booking rules', togglePass, toggleNote);

  // 6) View users
  const usersRes = await call('/admin/users', { token: adminToken });
  const usersList = Array.isArray(usersRes.data?.data)
    ? usersRes.data.data
    : (Array.isArray(usersRes.data) ? usersRes.data : []);
  const usersShapeOk = usersList.length === 0 || usersList.every((u) => typeof u?.username === 'string' && typeof u?.role === 'string');

  push(results, 'View Users', 'GET /admin/users returns 200', usersRes.status === 200, `status=${usersRes.status}`);
  push(results, 'View Users', 'User list contains role information', usersShapeOk, `count=${usersList.length}`);

  // 7) Delete user (create disposable user, then delete)
  const deleteUserName = `admin_del_uat_${suffix}`;
  const deleteUserEmail = `${deleteUserName}@mailinator.com`;
  const createDisposable = await call('/auth/register', {
    method: 'POST',
    body: { username: deleteUserName, email: deleteUserEmail, password: 'Citizen@123', role: 'citizen' },
  });

  const usersForDelete = await call('/admin/users', { token: adminToken });
  const usersForDeleteList = Array.isArray(usersForDelete.data?.data)
    ? usersForDelete.data.data
    : (Array.isArray(usersForDelete.data) ? usersForDelete.data : []);
  const disposable = usersForDeleteList.find((u) => String(u?.username) === deleteUserName);
  const disposableId = Number(disposable?.userId || 0);
  artifacts.deletedUserId = disposableId || null;

  const deleteRes = disposableId > 0
    ? await call(`/admin/users/${disposableId}`, { method: 'DELETE', token: adminToken })
    : { status: 0 };

  push(results, 'Delete User', 'Delete valid user succeeds', createDisposable.status === 201 && deleteRes.status === 200, `register=${createDisposable.status}, delete=${deleteRes.status}`);

  const invalidDelete = await call('/admin/users/999999', { method: 'DELETE', token: adminToken });
  push(results, 'Delete User', 'Delete invalid user returns 404', invalidDelete.status === 404, `status=${invalidDelete.status}`);

  // 8) RBAC validation with citizen account
  if (citizenToken) {
    const citizenAdminRead = await call('/admin/users', { token: citizenToken });
    const citizenAdminCreate = await call('/service-centers', {
      method: 'POST',
      token: citizenToken,
      body: createPayload,
    });

    push(results, 'RBAC Validation', 'Citizen blocked from admin user list', citizenAdminRead.status === 403, `status=${citizenAdminRead.status}`);
    push(results, 'RBAC Validation', 'Citizen blocked from center create', citizenAdminCreate.status === 403, `status=${citizenAdminCreate.status}`);
  } else {
    push(results, 'RBAC Validation', 'Citizen blocked from admin user list', false, 'citizen login failed');
    push(results, 'RBAC Validation', 'Citizen blocked from center create', false, 'citizen login failed');
  }

  // 9) Data propagation check
  const citizenCenters = citizenToken
    ? await tryPaths(['/admin/centers', '/service-centers'], { token: citizenToken })
    : { status: 0, data: null };

  const citizenCenterList = Array.isArray(citizenCenters.data?.data)
    ? citizenCenters.data.data
    : (Array.isArray(citizenCenters.data) ? citizenCenters.data : []);
  const propagated = citizenCenterList.some((c) => String(c?.name) === adminCenterName);

  push(results, 'Data Propagation', 'New admin-created center visible to citizen', citizenCenters.status === 200 && propagated, `status=${citizenCenters.status}, visible=${propagated}`);

  // 10) Logout validation (token removed simulation)
  const postLogoutCheck = await call('/admin/users');
  push(results, 'Logout', 'Protected admin endpoint denied without token', postLogoutCheck.status === 401, `status=${postLogoutCheck.status}`);

  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.length - passCount;

  console.log(JSON.stringify({ baseUrl: API_BASE, passCount, failCount, results, artifacts }, null, 2));
  if (failCount > 0) process.exit(1);
})();
