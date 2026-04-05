import type { APIRequestContext, APIResponse, Page } from "@playwright/test";

const API_BASE_URL = (process.env.API_BASE_URL ?? process.env.SMOKE_BASE_URL ?? "http://localhost:5000").replace(/\/+$/, "");
const UI_BASE_URL = (process.env.UI_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const DEFAULT_PASSWORD = "Health@Check1";

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
  const parsed = await response.json().catch(async () => JSON.parse(await response.text()));
  const body = (parsed?.data ?? parsed) as T;

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
  const { response, body } = await apiJson<BookingRecord>(request, "POST", "/api/appointment/book", {
    token: userToken,
    clientIp,
    data: {
      centerId,
      appointmentDate,
      appointmentTime,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to book appointment (${response.status()})`);
  }

  return body;
}

export async function loginThroughUi(
  page: Page,
  user: Pick<TestUser, "username" | "password" | "role">,
  destinationPath: string
): Promise<void> {
  await page.goto(`${UI_BASE_URL}/login`);
  await page.getByTestId("login-username").fill(user.username);
  await page.getByTestId("login-password").fill(user.password);
  await page.getByTestId("login-submit").click();
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

  const officer = await registerUser(
    request,
    { ...buildUserIdentity("officer", "queue_officer", runId), centerId: center.centerId },
    clientIp
  );

  const counter = await createCounter(
    request,
    admin.token!,
    clientIp,
    center.centerId,
    officer.userId ?? 0,
    `E2E Counter ${runId}`
  );
  await setCounterOpen(request, admin.token!, clientIp, center.centerId, counter.counterId, "Playwright queue setup");

  const loggedInOfficer = await loginUser(request, officer, clientIp);

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
      ...loggedInOfficer,
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