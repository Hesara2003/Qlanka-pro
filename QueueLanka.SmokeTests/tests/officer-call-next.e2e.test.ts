import { expect, test } from "@playwright/test";
import {
  apiRequest,
  bookAppointment,
  buildDateKey,
  buildTimeSlot,
  getApiBaseUrl,
  loginThroughUi,
  prepareQueueScenario,
} from "../helpers/e2e.helper";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

let scenario: Awaited<ReturnType<typeof prepareQueueScenario>>;
let bookings: Array<{ tokenNumber: string }>;

test.beforeEach(async ({ request }) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      scenario = await prepareQueueScenario(request, 2);
      const bookingDate = buildDateKey(1);

      bookings = [
        await bookAppointment(request, scenario.citizens[0].token!, scenario.clientIp, scenario.center.centerId, bookingDate, `${buildTimeSlot(8, 30)}:00`),
        await bookAppointment(request, scenario.citizens[1].token!, scenario.clientIp, scenario.center.centerId, bookingDate, `${buildTimeSlot(9, 0)}:00`),
      ];
      return;
    } catch {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      throw new Error("Failed to prepare scenario and bookings after 3 attempts");
    }
  }
});

test("calls next, serves, and skips while updating the officer dashboard", async ({ page, request }) => {
  await loginThroughUi(page, request, scenario.officer, "/officer");

  await expect(page.getByTestId("officer-waiting-count")).toHaveText("2");

  await page.getByTestId("officer-call-next").click();
  await expect(page.getByTestId("officer-current-token")).toContainText(bookings[0].tokenNumber);

  await page.getByTestId("officer-serve").click();
  await expect(page.getByTestId("officer-served-count")).toHaveText("1");
  await expect(page.getByTestId("officer-current-token")).toHaveCount(0);

  await page.getByTestId("officer-call-next").click();
  await expect(page.getByTestId("officer-current-token")).toContainText(bookings[1].tokenNumber);

  await page.getByTestId("officer-skip").click();
  await expect(page.getByTestId("officer-skipped-count")).toHaveText("1");
  await expect(page.getByTestId("officer-current-token")).toHaveCount(0);

  const response = await request.get(`${getApiBaseUrl()}/api/counters/${scenario.counter.counterId}/dashboard`, {
    headers: { Authorization: `Bearer ${scenario.officer.token}` },
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body.data.servedCount).toBe(1);
  expect(body.data.skippedCount).toBe(1);
});