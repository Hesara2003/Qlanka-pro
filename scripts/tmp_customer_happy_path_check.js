// Customer-side happy-path checker for QueueLanka gateway.
// Usage (PowerShell):
//   $env:API_BASE='https://qlanka-gateway.redrock-2a740b8b.centralindia.azurecontainerapps.io'
//   $env:CITIZEN_USER='Uvin'
//   $env:CITIZEN_PASS='Diabalo@666'
//   node scripts/tmp_customer_happy_path_check.js

const API_BASE = (process.env.API_BASE || 'https://qlanka-gateway.redrock-2a740b8b.centralindia.azurecontainerapps.io').replace(/\/+$/, '');
const CITIZEN_USER = process.env.CITIZEN_USER || 'Uvin';
const CITIZEN_PASS = process.env.CITIZEN_PASS || 'Diabalo@666';
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);
const MAX_BOOKING_DAYS_AHEAD = Number(process.env.MAX_BOOKING_DAYS_AHEAD || 14);

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

function getToken(loginBody) {
  return (
    loginBody?.data?.accessToken ||
    loginBody?.accessToken ||
    loginBody?.token ||
    null
  );
}

function parseHHMM(value, fallbackHours, fallbackMinutes) {
  if (typeof value !== 'string') return { hours: fallbackHours, minutes: fallbackMinutes };
  const parts = value.split(':');
  if (parts.length < 2) return { hours: fallbackHours, minutes: fallbackMinutes };

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return { hours: fallbackHours, minutes: fallbackMinutes };
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { hours: fallbackHours, minutes: fallbackMinutes };
  }

  return { hours, minutes };
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function buildCandidateSlots(center) {
  const open = parseHHMM(center?.openingTime, 9, 0);
  const close = parseHHMM(center?.closingTime, 16, 0);

  let slotHours = open.hours;
  let slotMinutes = open.minutes + 30;
  if (slotMinutes >= 60) {
    slotHours += 1;
    slotMinutes -= 60;
  }

  if (slotHours > close.hours || (slotHours === close.hours && slotMinutes >= close.minutes)) {
    slotHours = open.hours;
    slotMinutes = open.minutes;
  }

  const timeString = `${pad2(slotHours)}:${pad2(slotMinutes)}:00`;
  const slots = [];

  // Start from tomorrow to avoid same-day edge cases and search forward.
  for (let i = 1; i <= MAX_BOOKING_DAYS_AHEAD; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(slotHours, slotMinutes, 0, 0);
    slots.push({ dateIso: date.toISOString(), time: timeString });
  }

  return slots;
}

function bookingFailureMessage(responseBody) {
  if (!responseBody) return '';
  return String(responseBody.message || responseBody.code || '').toLowerCase();
}

async function run() {
  const result = {
    baseUrl: API_BASE,
    login: null,
    centers: null,
    centerId: null,
    book: null,
    myBookings: null,
    myBookingsCount: null,
    myTokens: null,
    myTokensCount: null,
    cancel: null,
    cancelTokenId: null,
    notes: [],
  };

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { username: CITIZEN_USER, password: CITIZEN_PASS },
  });
  result.login = login.status;

  const token = getToken(login.body);
  if (!token) {
    result.notes.push('Login failed or token not found in response payload.');
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const centers = await api('/api/service-centers', { token });
  result.centers = centers.status;

  const centerList = Array.isArray(centers.body?.data)
    ? centers.body.data
    : Array.isArray(centers.body)
      ? centers.body
      : [];

  const selectedCenter =
    centerList.find((c) => c?.isActive !== false && c?.isAvailable !== false) || centerList[0];

  if (!selectedCenter) {
    result.notes.push('No service centers available from /api/service-centers.');
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const centerId = Number(selectedCenter.centerId ?? selectedCenter.id);
  result.centerId = Number.isFinite(centerId) ? centerId : null;

  const candidateSlots = buildCandidateSlots(selectedCenter);
  let finalBook = null;
  let lastFailedBook = null;

  for (const slot of candidateSlots) {
    const book = await api('/api/appointment/book', {
      method: 'POST',
      token,
      body: {
        centerId: result.centerId,
        appointmentDate: slot.dateIso,
        appointmentTime: slot.time,
      },
    });

    if (book.status < 400) {
      finalBook = book;
      result.notes.push(`Booked using slot ${slot.dateIso} ${slot.time}.`);
      break;
    }

    lastFailedBook = book;

    const msg = bookingFailureMessage(book.body);
    const retriableConflict =
      book.status === 409 && (
        msg.includes('closed on this day') ||
        msg.includes('outside operating hours') ||
        msg.includes('not available')
      );

    if (retriableConflict) {
      result.notes.push(`Slot rejected (${book.status}) for ${slot.dateIso} ${slot.time}: ${book.body?.message || book.body?.code || 'conflict'}`);
      continue;
    }

    result.notes.push(`Slot failed (${book.status}) for ${slot.dateIso} ${slot.time}: ${book.body?.message || book.body?.code || 'error'}`);
  }

  if (!finalBook && lastFailedBook) {
    finalBook = lastFailedBook;
  }

  result.book = finalBook?.status ?? null;

  if (!finalBook) {
    result.notes.push('Booking was not attempted due to missing candidate slots.');
  } else if (finalBook.status >= 400) {
    result.notes.push(`Booking failed with status ${finalBook.status}.`);
    result.notes.push(`Booking response: ${JSON.stringify(finalBook.body)}`);
  }

  const myBookings = await api('/api/appointment/my-bookings', { token });
  result.myBookings = myBookings.status;
  result.myBookingsCount = Array.isArray(myBookings.body?.data)
    ? myBookings.body.data.length
    : Array.isArray(myBookings.body)
      ? myBookings.body.length
      : null;

  const myTokens = await api('/api/token/my-tokens', { token });
  result.myTokens = myTokens.status;

  const tokenList = Array.isArray(myTokens.body?.data)
    ? myTokens.body.data
    : Array.isArray(myTokens.body)
      ? myTokens.body
      : [];

  result.myTokensCount = tokenList.length;

  const waitingToken = tokenList.find((t) => String(t?.status || '').toLowerCase() === 'waiting');

  if (!waitingToken) {
    result.cancel = 'SKIPPED_NO_WAITING_TOKEN';
    result.notes.push('No waiting token found to cancel.');
  } else {
    result.cancelTokenId = Number(waitingToken.tokenId);
    const cancel = await api(`/api/token/${result.cancelTokenId}/cancel`, {
      method: 'PUT',
      token,
    });
    result.cancel = cancel.status;

    if (cancel.status >= 400) {
      result.notes.push(`Cancel failed with status ${cancel.status}.`);
      result.notes.push(`Cancel response: ${JSON.stringify(cancel.body)}`);
    }
  }

  console.log(JSON.stringify(result, null, 2));

  const criticalStatuses = [result.login, result.centers, result.myBookings, result.myTokens];
  const hasCriticalFailure = criticalStatuses.some((s) => typeof s === 'number' && s >= 400);
  if (hasCriticalFailure) process.exit(1);
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        fatal: error?.message || String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
