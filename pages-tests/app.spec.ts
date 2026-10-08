import { test, expect } from "@playwright/test";

const appPath = "/jot-and-tittle/app/";

test("project-path assets load and the sample map opens", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) => errors.push(request.url()));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(response.url());
  });
  await page.goto("./");
  await expect(
    page
      .locator("header")
      .getByRole("button", { name: "Log a reading", exact: true }),
  ).toBeEnabled();
  const assets = await page
    .locator('script[src], link[rel="stylesheet"]')
    .evaluateAll((elements) =>
      elements.map(
        (element) =>
          new URL(
            element.getAttribute("src") || element.getAttribute("href")!,
            document.baseURI,
          ).pathname,
      ),
    );
  expect(assets.length).toBeGreaterThan(0);
  for (const asset of assets)
    expect(asset).toMatch(/^\/jot-and-tittle\/app\/assets\//);
  await page
    .getByRole("button", { name: "Explore a sample map", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Return to my readings", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("project-path offline reload preserves saved readings", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page
    .locator("header")
    .getByRole("button", { name: "Log a reading", exact: true })
    .click();
  await page.getByLabel("Passage or passages").fill("Psalm 23");
  await page.getByLabel("Notes").fill("Pages offline regression");
  await page.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        ),
      );
    }
    return new URL(registration.scope).pathname;
  });
  expect(scope).toBe(appPath);
  await context.setOffline(true);
  expect(
    await page.evaluate(() =>
      fetch("./uncached-probe").then(
        () => false,
        () => true,
      ),
    ),
  ).toBe(true);
  await page.reload();
  await page
    .getByRole("button", { name: "Reading history", exact: true })
    .click();
  await expect(
    page
      .locator(".history-row")
      .filter({ hasText: "Pages offline regression" }),
  ).toBeVisible();
});
