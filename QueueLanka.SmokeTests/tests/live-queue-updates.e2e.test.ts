import { expect, test } from "@playwright/test";
import {
  bookAppointment,
  buildDateKey,
  buildTimeSlot,
  getApiBaseUrl,
  getUiBaseUrl,
  loginThroughUi,
  prepareQueueScenario,
} from "../helpers/e2e.helper";

test.describe.configure({ mode: "serial" });

let scenario: Awaited<ReturnType<typeof prepareQueueScenario>>;
let bookings: Array<{ tokenNumber: string }>;

test.beforeEach(async ({ request }) => {
  scenario = await prepareQueueScenario(request, 3);
  const bookingDate = buildDateKey(1);

  bookings = [
    await bookAppointment(request, scenario.citizens[0].token!, scenario.clientIp, scenario.center.centerId, bookingDate, `${buildTimeSlot(8, 30)}:00`),
    await bookAppointment(request, scenario.citizens[1].token!, scenario.clientIp, scenario.center.centerId, bookingDate, `${buildTimeSlot(9, 0)}:00`),
    await bookAppointment(request, scenario.citizens[2].token!, scenario.clientIp, scenario.center.centerId, bookingDate, `${buildTimeSlot(9, 30)}:00`),
  ];
});

test("keeps citizen queue views synchronized with officer actions", async ({ browser, request }) => {
  const citizenOneContext = await browser.newContext();
  const citizenTwoContext = await browser.newContext();
  const officerContext = await browser.newContext();

  const citizenOnePage = await citizenOneContext.newPage();
  const citizenTwoPage = await citizenTwoContext.newPage();
  const officerPage = await officerContext.newPage();

  try {
    await loginThroughUi(citizenOnePage, scenario.citizens[0], "/dashboard");
    await loginThroughUi(citizenTwoPage, scenario.citizens[1], "/dashboard");
    await loginThroughUi(officerPage, scenario.officer, "/officer");

    const queueUrl = `${getUiBaseUrl()}/queue/${scenario.center.centerId}`;

    const citizenOneWebSocket = new Promise<void>((resolve) => {
      citizenOnePage.on("websocket", (websocket) => {
        if (websocket.url().includes("/hubs/queue")) {
          resolve();
        }
      });
    });

    const citizenTwoWebSocket = new Promise<void>((resolve) => {
      citizenTwoPage.on("websocket", (websocket) => {
        if (websocket.url().includes("/hubs/queue")) {
          resolve();
        }
      });
    });

    await Promise.all([
      citizenOnePage.goto(queueUrl),
      citizenTwoPage.goto(queueUrl),
    ]);

    await Promise.all([citizenOneWebSocket, citizenTwoWebSocket]);

    await expect(citizenOnePage.getByTestId("live-queue-current-token")).toHaveText(bookings[0].tokenNumber);
    await expect(citizenTwoPage.getByTestId("live-queue-current-token")).toHaveText(bookings[0].tokenNumber);
    await expect(citizenOnePage.getByTestId("live-queue-waiting-count")).toHaveText("2 Waiting");
    await expect(citizenTwoPage.getByTestId("live-queue-waiting-count")).toHaveText("2 Waiting");

    await officerPage.getByTestId("officer-call-next").click();
    await officerPage.getByTestId("officer-serve").click();

    await expect(citizenOnePage.getByTestId("live-queue-station-idle")).toBeVisible();
    await expect(citizenTwoPage.getByTestId("live-queue-station-idle")).toBeVisible();
    await expect(citizenOnePage.getByTestId("live-queue-current-token")).toHaveCount(0);
    await expect(citizenTwoPage.getByTestId("live-queue-current-token")).toHaveCount(0);

    await officerPage.getByTestId("officer-call-next").click();

    await expect(citizenOnePage.getByTestId("live-queue-current-token")).toHaveText(bookings[1].tokenNumber);
    await expect(citizenTwoPage.getByTestId("live-queue-current-token")).toHaveText(bookings[1].tokenNumber);
    await expect(citizenOnePage.getByTestId("live-queue-waiting-count")).toHaveText("1 Waiting");
    await expect(citizenTwoPage.getByTestId("live-queue-waiting-count")).toHaveText("1 Waiting");

    const dashboardResponse = await request.get(`${getApiBaseUrl()}/api/counters/${scenario.counter.counterId}/dashboard`, {
      headers: { Authorization: `Bearer ${scenario.officer.token}` },
    });

    expect(dashboardResponse.ok()).toBeTruthy();
    const dashboardBody = await dashboardResponse.json();
    expect(dashboardBody.data.currentToken.tokenNumber).toBe(bookings[1].tokenNumber);
  } finally {
    await Promise.all([
      citizenOneContext.close(),
      citizenTwoContext.close(),
      officerContext.close(),
    ]);
  }
});