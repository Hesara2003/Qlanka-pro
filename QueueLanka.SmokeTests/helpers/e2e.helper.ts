import type { APIRequestContext, APIResponse, Page } from "@playwright/test";

const API_BASE_URL = (process.env.API_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "http://localhost:5000").replace(/\/+$/, "");
const UI_BASE_URL = (process.env.UI_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const DEFAULT_PASSWORD = "Health@Check1";
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.SMOKE_REQUEST_TIMEOUT_MS ?? "20000", 10);
const SEEDED_OFFICER_USERNAME = process.env.OFFICER_USER ?? "officer_uat";
const SEEDED_OFFICER_PASSWORD = process.env.OFFICER_PASS ?? "Admin123!";

export interface TestUser {
  userId?: number;
  username: string;
  email: string;
  password: string;
  role: "citizen" | "officer" | "admin";
  token?: string;
  counterId?: number;
  centerId?: number;
}

export interface ServiceCenterRecord {
  centerId: number;
  name: string;
  address: string;
  openingTime: string;
  closingTime: string;
  averageServiceTimeMinutes: number;
}

export interface CounterRecord {
  counterId: number;
  name: string;
  centerId: number;
  status?: string;
}

export interface BookingRecord {
  appointmentId: number;
  centerId: number;
  userId: number;
  tokenNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

export interface BookingScenario {
  runId: string;
  clientIp: string;
  admin: TestUser;
  center: ServiceCenterRecord;
  citizen: TestUser;
}

export interface QueueScenario {
  runId: string;
  clientIp: string;
  admin: TestUser;
  center: ServiceCenterRecord;
  officer: TestUser;
  counter: CounterRecord;
  citizens: TestUser[];
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getUiBaseUrl(): string {
  return UI_BASE_URL;
}

export function getDefaultPassword(): string {
  return DEFAULT_PASSWORD;
}

export function buildDateKey(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split("T")[0];
}

export function buildTimeSlot(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function buildUniqueSuffix(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function buildClientIp(seed?: string): string {
  const lastOctet = seed
    ? Math.abs(seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 200 + 10
    : Math.floor(Math.random() * 200) + 10;

  return `198.51.100.${lastOctet}`;
}

export function buildUserIdentity(role: TestUser["role"], label: string, runId: string): TestUser {
  const username = `${label}_${runId}`.replace(/[^a-zA-Z0-9_]/g, "_");

  return {
    username,
    email: `${username}@example.test`,
    password: DEFAULT_PASSWORD,
    role,
  };
}

export async function apiRequest(
  request: APIRequestContext,
  method: string,
  path: string,
  options: {
    data?: unknown;
    token?: string;
    clientIp?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<APIResponse> {
  const response = await request.fetch(`${API_BASE_URL}${path}`, {
    method,
    data: options.data,
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      "Content-Type": "application/json",
      ...(options.clientIp ? { "X-Forwarded-For": options.clientIp } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  });

  return response;
}

export async function apiJson<T>(
  request: APIRequestContext,
  method: string,
  path: string,
  options: {
    data?: unknown;
    token?: string;
    clientIp?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<{ response: APIResponse; body: T }> {
  const response = await apiRequest(request, method, path, options);
  let parsed: unknown = null;

  try {
    parsed = await response.json();
  } catch {
    const raw = await response.text();
    parsed = raw.trim().length > 0 ? JSON.parse(raw) : null;
  }

  const body = ((parsed as { data?: unknown } | null)?.data ?? parsed) as T;

  return { response, body };
}

export async function registerUser(
  request: APIRequestContext,
  user: TestUser,
  clientIp: string
): Promise<TestUser> {
  const { response, body } = await apiJson<{ userId: number; username: string; role: string }>(
    request,
    "POST",
    "/api/auth/register",
    {
      data: {
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role,
        ...(typeof user.centerId === "number" ? { centerId: user.centerId } : {}),
      },
      clientIp,
    }
  );

  if (response.status() !== 201) {
    throw new Error(`Failed to register ${user.role} ${user.username} (${response.status()})`);
  }

  return {
    ...user,
    userId: body.userId,
  };
}

export async function loginUser(
  request: APIRequestContext,
  user: Pick<TestUser, "username" | "password">,
  clientIp: string
): Promise<TestUser> {
  const { response, body } = await apiJson<{ token: string; role: string; counterId?: number }>(
    request,
    "POST",
    "/api/auth/login",
    {
      data: {
        username: user.username,
        password: user.password,
      },
      clientIp,
    }
  );

  if (!response.ok()) {
    throw new Error(`Failed to log in ${user.username} (${response.status()})`);
  }

  return {
    ...user,
    email: `${user.username}@example.test`,
    password: user.password,
    role: body.role.toLowerCase() as TestUser["role"],
    token: body.token,
    counterId: body.counterId,
  } as TestUser;
}

export async function createServiceCenter(
  request: APIRequestContext,
  adminToken: string,
  clientIp: string,
  label: string,
  overrides: Partial<Pick<ServiceCenterRecord, "openingTime" | "closingTime" | "averageServiceTimeMinutes">> = {}
): Promise<ServiceCenterRecord> {
  const centerName = `E2E ${label} Center ${Date.now()}`;
  const { response, body } = await apiJson<ServiceCenterRecord>(request, "POST", "/api/service-centers", {
    token: adminToken,
    clientIp,
    data: {
      name: centerName,
      address: `${centerName}, Test Avenue, Colombo`,
      phone: "+94 11 000 0000",
      email: `${label}.${Date.now()}@example.test`,
      description: `Automated ${label} center created for Playwright E2E runs.`,
      timezone: "Asia/Colombo",
      capacity: 200,
      averageServiceTimeMinutes: overrides.averageServiceTimeMinutes ?? 15,
      openingTime: overrides.openingTime ?? "08:00",
      closingTime: overrides.closingTime ?? "12:00",
      isActive: true,
      streetAddress: `${centerName} Street`,
      city: "Colombo",
      district: "Colombo",
      province: "Western",
      postalCode: "00000",
      country: "Sri Lanka",
      latitude: 6.92,
      longitude: 79.86,
      googleMapsUrl: "https://maps.google.com/?q=Colombo",
      landmark: "Playwright E2E Fixture",
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create service center (${response.status()})`);
  }

  return {
    ...body,
    openingTime: body.openingTime ?? overrides.openingTime ?? "08:00",
    closingTime: body.closingTime ?? overrides.closingTime ?? "12:00",
    averageServiceTimeMinutes: body.averageServiceTimeMinutes ?? overrides.averageServiceTimeMinutes ?? 15,
  };
}

export async function createCounter(
  request: APIRequestContext,
  adminToken: string,
  clientIp: string,
  centerId: number,
  officerUserId: number,
  name: string
): Promise<CounterRecord> {
  const { response, body } = await apiJson<CounterRecord>(request, "POST", `/api/admin/centers/${centerId}/counters`, {
    token: adminToken,
    clientIp,
    data: {
      name,
      centerId,
      assignedOfficerUserId: officerUserId,
    },
  });

  if (!(response.status() === 201 || response.status() === 200)) {
    throw new Error(`Failed to create counter (${response.status()})`);
  }

  return body;
}

export async function setCounterOpen(
  request: APIRequestContext,
  adminToken: string,
  clientIp: string,
  centerId: number,
  counterId: number,
  reason: string
): Promise<void> {
  const response = await apiRequest(request, "PATCH", `/api/admin/centers/${centerId}/counters/${counterId}/status`, {
    token: adminToken,
    clientIp,
    data: { isOpen: true, reason },
  });

  if (!response.ok()) {
    throw new Error(`Failed to open counter (${response.status()})`);
  }
}

export async function bookAppointment(
  request: APIRequestContext,
  userToken: string,
  clientIp: string,
  centerId: number,
  appointmentDate: string,
  appointmentTime: string
): Promise<BookingRecord> {
  const parseMinutes = (value: string): number => {
    const [hourRaw, minuteRaw] = value.split(":");
    const hour = Number.parseInt(hourRaw ?? "0", 10);
    const minute = Number.parseInt(minuteRaw ?? "0", 10);
    return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
  };

  const formatWithSeconds = (minutes: number): string => {
    const dayMinutes = Math.max(0, Math.min(23 * 60 + 59, minutes));
    const hours = Math.floor(dayMinutes / 60);
    const mins = dayMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
  };

  const addDays = (dateString: string, days: number): string => {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  // Queue setup can race with slot initialization in local runs.
  // Retry across nearby slots and the next day for transient 409/5xx responses.
  const initialMinutes = parseMinutes(appointmentTime);
  const retryPlan = [
    { dayOffset: 0, slotOffset: 0 },
    { dayOffset: 0, slotOffset: 1 },
    { dayOffset: 0, slotOffset: 2 },
    { dayOffset: 1, slotOffset: 0 },
    { dayOffset: 1, slotOffset: 1 },
    { dayOffset: 1, slotOffset: 2 },
  ];

  for (let attempt = 0; attempt < retryPlan.length; attempt += 1) {
    const plan = retryPlan[attempt];
    const slot = formatWithSeconds(initialMinutes + plan.slotOffset * 30);
    const date = addDays(appointmentDate, plan.dayOffset);

    try {
      const { response, body } = await apiJson<BookingRecord>(request, "POST", "/api/appointment/book", {
        token: userToken,
        clientIp,
        data: {
          centerId,
          appointmentDate: date,
          appointmentTime: slot,
        },
      });

      if (response.ok()) {
        return body;
      }

      if ([409, 500, 502, 503].includes(response.status()) && attempt < retryPlan.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }

      throw new Error(`Failed to book appointment (${response.status()})`);
    } catch (error) {
      if (attempt < retryPlan.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to book appointment due to an unexpected error");
    }
  }

  throw new Error("Failed to book appointment after retrying available slots");
}

export async function loginThroughUi(
  page: Page,
  request: APIRequestContext,
  user: Pick<TestUser, "username" | "password" | "role">,
  destinationPath: string
): Promise<void> {
  const { body } = await apiJson<{ token: string; role: string; counterId?: number }>(request, "POST", "/api/auth/login", {
    data: {
      username: user.username,
      password: user.password,
    },
  });

  const authUser = {
    username: user.username,
    role: body.role.toLowerCase() as TestUser["role"],
    token: body.token,
    counterId: body.counterId,
  };

  await page.goto(`${UI_BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate((value) => {
    localStorage.setItem("token", value.token);
    localStorage.setItem("auth_user", JSON.stringify(value));
  }, authUser);
  await page.goto(`${UI_BASE_URL}${destinationPath}`, { waitUntil: "domcontentloaded" });
  await page.waitForURL(new RegExp(`${destinationPath.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`));
}

export async function prepareBookingScenario(request: APIRequestContext): Promise<BookingScenario> {
  const runId = buildUniqueSuffix("booking");
  const clientIp = buildClientIp(runId);

  const admin = await registerAndLoginAdmin(request, runId, clientIp, "booking-admin");
  const center = await createServiceCenter(request, admin.token!, clientIp, "booking", {
    openingTime: "08:00",
    closingTime: "12:00",
    averageServiceTimeMinutes: 15,
  });

  const citizen = await registerUser(
    request,
    buildUserIdentity("citizen", "booking_citizen", runId),
    clientIp
  );

  const loggedInCitizen = await loginUser(request, citizen, clientIp);

  return {
    runId,
    clientIp,
    admin,
    center,
    citizen: loggedInCitizen,
  };
}

export async function prepareQueueScenario(
  request: APIRequestContext,
  citizenCount = 2
): Promise<QueueScenario> {
  const runId = buildUniqueSuffix("queue");
  const clientIp = buildClientIp(runId);

  const admin = await registerAndLoginAdmin(request, runId, clientIp, "queue-admin");
  const center = await createServiceCenter(request, admin.token!, clientIp, "queue", {
    openingTime: "08:00",
    closingTime: "12:00",
    averageServiceTimeMinutes: 12,
  });

  const officers = await apiJson<Array<{ userId: number; username: string; role: string }>>(
    request,
    "GET",
    "/api/admin/users?role=officer",
    { token: admin.token!, clientIp }
  );

  const officerUser = officers.body.find((user) => user.username === SEEDED_OFFICER_USERNAME);
  if (!officerUser) {
    throw new Error(`Seeded officer ${SEEDED_OFFICER_USERNAME} was not found in admin users`);
  }

  const officerLogin = await loginUser(
    request,
    { username: SEEDED_OFFICER_USERNAME, password: SEEDED_OFFICER_PASSWORD },
    clientIp
  );

  const counter = await createCounter(
    request,
    admin.token!,
    clientIp,
    center.centerId,
    officerUser.userId,
    `E2E Counter ${runId}`
  );
  await setCounterOpen(request, admin.token!, clientIp, center.centerId, counter.counterId, "Playwright queue setup");

  const citizens: TestUser[] = [];
  for (let index = 0; index < citizenCount; index += 1) {
    const citizen = await registerUser(
      request,
      buildUserIdentity("citizen", `queue_citizen_${index + 1}`, `${runId}-${index + 1}`),
      clientIp
    );
    citizens.push(await loginUser(request, citizen, clientIp));
  }

  return {
    runId,
    clientIp,
    admin,
    center,
    officer: {
      ...officerLogin,
      counterId: counter.counterId,
    },
    counter,
    citizens,
  };
}

async function registerAndLoginAdmin(
  request: APIRequestContext,
  runId: string,
  clientIp: string,
  label: string
): Promise<TestUser> {
  const admin = await registerUser(
    request,
    buildUserIdentity("admin", label, runId),
    clientIp
  );

  return loginUser(request, admin, clientIp);
}