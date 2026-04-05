import { expect, test } from "@playwright/test";
import {
  apiRequest,
  buildClientIp,
  buildDateKey,
  buildTimeSlot,
  buildUniqueSuffix,
  buildUserIdentity,
  getApiBaseUrl,
  loginUser,
  prepareQueueScenario,
  registerUser,
} from "../helpers/e2e.helper";

test.describe.configure({ mode: "serial" });

let scenario: Awaited<ReturnType<typeof prepareQueueScenario>>;

test.beforeEach(async ({ request }) => {
  scenario = await prepareQueueScenario(request, 1);
});

test("requires valid tokens for protected endpoints", async ({ request }) => {
  const unauthenticated = await apiRequest(request, "GET", "/api/appointment/my-bookings", {
    clientIp: scenario.clientIp,
  });

  expect(unauthenticated.status()).toBe(401);

  const citizenBookings = await apiRequest(request, "GET", "/api/appointment/my-bookings", {
    token: scenario.citizens[0].token,
    clientIp: scenario.clientIp,
  });

  expect(citizenBookings.ok()).toBeTruthy();

  const citizenCounterDashboard = await apiRequest(request, "GET", `/api/counters/${scenario.counter.counterId}/dashboard`, {
    token: scenario.citizens[0].token,
    clientIp: scenario.clientIp,
  });

  expect(citizenCounterDashboard.status()).toBe(403);

  const officerCounterDashboard = await apiRequest(request, "GET", `/api/counters/${scenario.counter.counterId}/dashboard`, {
    token: scenario.officer.token,
    clientIp: scenario.clientIp,
  });

  expect(officerCounterDashboard.ok()).toBeTruthy();
});

test("enforces the booking rate limit per client IP", async ({ request }) => {
  const rateLimitIp = buildClientIp(`${scenario.runId}-limit`);
  const bookingDate = buildDateKey(1);
  const timeSlots = [
    buildTimeSlot(8, 0),
    buildTimeSlot(8, 30),
    buildTimeSlot(9, 0),
    buildTimeSlot(9, 30),
    buildTimeSlot(10, 0),
    buildTimeSlot(10, 30),
  ];

  const users = [scenario.citizens[0]];

  for (let index = 0; index < 5; index += 1) {
    const suffix = buildUniqueSuffix(`rate-${index + 1}`);
    const user = await registerUser(
      request,
      buildUserIdentity("citizen", `rate_limit_${index + 1}`, suffix),
      scenario.clientIp
    );
    users.push(await loginUser(request, user, scenario.clientIp));
  }

  for (let index = 0; index < 5; index += 1) {
    const response = await apiRequest(request, "POST", "/api/appointment/book", {
      token: users[index].token,
      clientIp: rateLimitIp,
      data: {
        centerId: scenario.center.centerId,
        appointmentDate: bookingDate,
        appointmentTime: `${timeSlots[index]}:00`,
      },
    });

    expect(response.status()).toBe(200);
  }

  const rateLimited = await apiRequest(request, "POST", "/api/appointment/book", {
    token: users[5].token,
    clientIp: rateLimitIp,
    data: {
      centerId: scenario.center.centerId,
      appointmentDate: bookingDate,
      appointmentTime: `${timeSlots[5]}:00`,
    },
  });

  expect(rateLimited.status()).toBe(429);
});