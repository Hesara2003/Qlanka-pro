import { expect, test } from "@playwright/test";
import {
  buildDateKey,
  buildTimeSlot,
  getApiBaseUrl,
  getUiBaseUrl,
  loginThroughUi,
  prepareBookingScenario,
} from "../helpers/e2e.helper";

test.describe.configure({ mode: "serial" });

let scenario: Awaited<ReturnType<typeof prepareBookingScenario>>;

test.beforeEach(async ({ request }) => {
  scenario = await prepareBookingScenario(request);
});

test("books a token and confirms the booking on screen", async ({ page, request }) => {
  await loginThroughUi(page, scenario.citizen, "/dashboard");

  await page.goto(`${getUiBaseUrl()}/book/${scenario.center.centerId}`);

  const bookingDate = buildDateKey(1);
  const bookingTime = buildTimeSlot(8, 30);

  await expect(page.getByTestId("booking-page")).toBeVisible();
  await expect(page.getByTestId("booking-submit")).toBeDisabled();

  await page.getByTestId(`booking-date-${bookingDate}`).click();
  await expect(page.getByTestId("booking-submit")).toBeDisabled();

  await page.getByTestId(`booking-time-${bookingTime.replace(":", "-")}`).click();
  await expect(page.getByTestId("booking-submit")).toBeEnabled();

  await page.getByTestId("booking-submit").click();

  await expect(page.getByTestId("booking-success")).toBeVisible();
  await expect(page.getByTestId("booking-success-center")).toHaveText(scenario.center.name);
  await expect(page.getByTestId("booking-success-date")).toContainText(/\w{3}/);
  await expect(page.getByTestId("booking-success-arrival")).toHaveText("08:30:00");
  await expect(page.getByTestId("booking-success-token")).toContainText(/.+/);

  const token = await page.evaluate(() => localStorage.getItem("token"));
  const response = await request.get(`${getApiBaseUrl()}/api/appointment/my-bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(Array.isArray(body.data)).toBeTruthy();
  expect(
    body.data.some(
      (booking: { centerId: number; appointmentDate: string; appointmentTime: string }) =>
        booking.centerId === scenario.center.centerId
        && booking.appointmentDate.startsWith(bookingDate)
        && booking.appointmentTime === "08:30:00"
    )
  ).toBeTruthy();
});

test("keeps the submit button disabled until the booking form is complete", async ({ page }) => {
  await loginThroughUi(page, scenario.citizen, "/dashboard");
  await page.goto(`${getUiBaseUrl()}/book/${scenario.center.centerId}`);

  const bookingDate = buildDateKey(1);
  const bookingTime = buildTimeSlot(8, 30);

  await expect(page.getByTestId("booking-submit")).toBeDisabled();

  await page.getByTestId(`booking-date-${bookingDate}`).click();
  await expect(page.getByTestId("booking-submit")).toBeDisabled();

  await page.getByTestId(`booking-time-${bookingTime.replace(":", "-")}`).click();
  await expect(page.getByTestId("booking-submit")).toBeEnabled();
});