import { test, expect, open, log, history } from "./helpers";
test("inclusive custom dates apply atomically and preserve invalid drafts", async ({
  page,
}) => {
  await open(page);
  await log(page, "John 3:16");
  await history(page);
  const edit = () =>
    page.getByRole("button", { name: "View readings", exact: true }).click();
  const apply = () =>
    page.getByRole("button", { name: "Apply view", exact: true }).click();
  await edit();
  await page
    .getByLabel("Reading period", { exact: true })
    .selectOption("custom");
  await page.getByLabel("Start date", { exact: true }).fill("2026-10-05");
  await page.getByLabel("End date", { exact: true }).fill("2026-10-05");
  await apply();
  await expect(page.locator(".history-row")).toHaveCount(1);
  await edit();
  await page.getByLabel("Start date", { exact: true }).fill("2026-10-06");
  await apply();
  await expect(page.getByRole("alert")).toContainText("start date");
  await expect(page.getByLabel("Start date", { exact: true })).toHaveValue(
    "2026-10-06",
  );
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page.getByLabel("Start date", { exact: true }).fill("2026-09-01");
  await page.getByLabel("End date", { exact: true }).fill("2026-09-30");
  await apply();
  await expect(page.locator(".history-row")).toHaveCount(0);
  await expect(
    page.getByText("No readings in this view.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect(page.locator(".history-row")).toHaveCount(1);
});
test("month preset advances on foreground refresh", async ({ page }) => {
  await open(page);
  await log(page, "John 3:16");
  await history(page);
  await page
    .getByRole("button", { name: "View readings", exact: true })
    .click();
  await page
    .getByLabel("Reading period", { exact: true })
    .selectOption("month");
  await page.getByRole("button", { name: "Apply view", exact: true }).click();
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page.clock.setFixedTime(new Date("2026-11-01T00:00:00Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".history-row")).toHaveCount(0);
  await expect(
    page.getByText(/Applied period: 2026-11-01 through 2026-11-01/),
  ).toBeVisible();
});
