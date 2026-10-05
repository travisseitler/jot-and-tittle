import { test, expect, open, log, history } from "./helpers";

test("production shell reloads and readings persist while offline", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Offline navigation is covered in Chromium; Firefox lacks offline emulation and WebKit offline reload errors in Playwright.",
  );
  await open(page);
  await log(page, "Psalm 23", "online reading");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        ),
      );
  });
  await context.setOffline(true);
  // A network-only file is unavailable, proving this context is really offline.
  expect(
    await page.evaluate(() =>
      fetch("/uncached-offline-probe").then(
        () => false,
        () => true,
      ),
    ),
  ).toBe(true);
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toContainText("online reading");
  await log(page, "Genesis 1:1", "offline reading");
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(2);
  await expect(
    page.locator(".history-row").filter({ hasText: "offline reading" }),
  ).toBeVisible();
});
