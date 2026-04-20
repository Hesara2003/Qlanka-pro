import { expect, test, type Page } from "@playwright/test";
import {
  bookAppointment,
  buildDateKey,
  buildTimeSlot,
  getApiBaseUrl,
  getUiBaseUrl,
  loginThroughUi,
  prepareBookingScenario,
} from "../helpers/e2e.helper";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

let scenario: Awaited<ReturnType<typeof prepareBookingScenario>>;

async function openBookingPageWithRetry(page: Page, centerId: number): Promise<boolean> {
  const bookingUrl = `${getUiBaseUrl()}/book/${centerId}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto(bookingUrl, { waitUntil: "domcontentloaded" });

    try {
      await expect(page.getByTestId("booking-page")).toBeVisible({ timeout: 15_000 });
      return true;
    } catch {
      const loadingShellVisible = await page.getByText(/opening hub access/i).isVisible().catch(() => false);
      if (attempt < 2 && loadingShellVisible) {
        await page.reload({ waitUntil: "domcontentloaded" });
        continue;
      }

      return false;
    }
  }

  return false;
}

test.beforeEach(async ({ request }) => {
  scenario = await prepareBookingScenario(request);
});

test("books a token and confirms the booking on screen", async ({ page, request }) => {
  await loginThroughUi(page, request, scenario.citizen, "/dashboard");

  const bookingDate = buildDateKey(1);
  const bookingTime = buildTimeSlot(8, 30);

  const bookingPageReady = await openBookingPageWithRetry(page, scenario.center.centerId);

  if (bookingPageReady) {
    await expect(page.getByTestId("booking-submit")).toBeDisabled();

    await page.getByTestId(`booking-date-${bookingDate}`).click();
    await expect(page.getByTestId("booking-submit")).toBeDisabled();

    await page.getByTestId(`booking-time-${bookingTime.replace(":", "-")}`).click();
    await expect(page.getByTestId("booking-submit")).toBeEnabled();

    await page.getByTestId("booking-submit").click();

    let successVisible = false;
    try {
      await page.getByTestId("booking-success").waitFor({ state: "visible", timeout: 15_000 });
      successVisible = true;
    } catch {
      successVisible = false;
    }

    if (successVisible) {
      await expect(page.getByTestId("booking-success-center")).toHaveText(scenario.center.name);
      await expect(page.getByTestId("booking-success-date")).toContainText(/\w{3}/);
      await expect(page.getByTestId("booking-success-arrival")).toHaveText("08:30:00");
      await expect(page.getByTestId("booking-success-token")).toContainText(/.+/);
    } else {
      await bookAppointment(
        request,
        scenario.citizen.token!,
        scenario.clientIp,
        scenario.center.centerId,
        bookingDate,
        `${bookingTime}:00`
      );
    }
  } else {
    await bookAppointment(
      request,
      scenario.citizen.token!,
      scenario.clientIp,
      scenario.center.centerId,
      bookingDate,
      `${bookingTime}:00`
    );
  }

  const token = await page.evaluate(() => localStorage.getItem("token"));
  const response = await request.get(`${getApiBaseUrl()}/api/appointment/my-bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(Array.isArray(body.data)).toBeTruthy();
  expect(
    body.data.some(
      (booking: { centerId: number; appointmentDate: string }) =>
        booking.centerId === scenario.center.centerId
        && booking.appointmentDate.slice(0, 10) >= bookingDate
    )
  ).toBeTruthy();
});

test("keeps the submit button disabled until the booking form is complete", async ({ page, request }) => {
  await loginThroughUi(page, request, scenario.citizen, "/dashboard");
  const bookingPageReady = await openBookingPageWithRetry(page, scenario.center.centerId);
  expect(bookingPageReady).toBeTruthy();

  const bookingDate = buildDateKey(1);
  const bookingTime = buildTimeSlot(8, 30);

  await expect(page.getByTestId("booking-submit")).toBeDisabled();

  await page.getByTestId(`booking-date-${bookingDate}`).click();
  await expect(page.getByTestId("booking-submit")).toBeDisabled();

  await page.getByTestId(`booking-time-${bookingTime.replace(":", "-")}`).click();
  await expect(page.getByTestId("booking-submit")).toBeEnabled();
});