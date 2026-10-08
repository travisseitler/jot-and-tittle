import { test, expect, open, log, history } from "./helpers";

for (const width of [1440, 768, 390, 320]) {
  test(`reading flows reflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width > 700 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    const noOverflow = async () =>
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    await noOverflow();
    const firstReading = page.getByRole("button", {
      name: "Log your first reading",
    });
    await expect(firstReading).toBeInViewport();
    await page.screenshot({
      path: testInfo.outputPath(`first-reading-${width}.png`),
      fullPage: true,
    });
    await firstReading.click();
    await page.getByLabel("Passage or passages").fill("John 3:16-21; Romans 8");
    await page
      .getByLabel("Notes")
      .fill(
        "A longer reflection to check wrapping and readability. ".repeat(8),
      );
    await page
      .getByRole("button", { name: "Save reading", exact: true })
      .click();
    await expect(page.locator(".capture-card")).toHaveCount(0);
    await expect(page.getByRole("group", { name: /verse map,/ })).toBeVisible();
    await noOverflow();
    if (width <= 700) {
      const toast = await page.locator(".toast").boundingBox();
      const nav = await page
        .getByRole("navigation", { name: "Main navigation" })
        .boundingBox();
      expect(toast).not.toBeNull();
      expect(nav).not.toBeNull();
      expect(toast!.y + toast!.height).toBeLessThan(nav!.y);
    }
    await page.screenshot({
      path: testInfo.outputPath(`recorded-map-${width}.png`),
      fullPage: true,
    });
    await history(page);
    await expect(page.locator(".history-row")).toHaveCount(1);
    await noOverflow();
    await page.reload();
    await expect(page.getByRole("group", { name: /verse map,/ })).toBeVisible();
    if (width <= 700) {
      await page
        .getByRole("button", { name: "Open inspected verse details" })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("button", { name: "Reading history", exact: true }),
      ).toBeInViewport();
      await expect(
        page
          .locator("header")
          .getByRole("button", { name: "Log a reading", exact: true }),
      ).toBeInViewport();
    }
  });
}

test("passage navigation focuses the field and Escape returns to its trigger", async ({
  page,
}) => {
  await open(page);
  await log(page);
  const trigger = page.getByRole("button", {
    name: "Go to passage",
    exact: true,
  });
  await trigger.click();
  const field = page.getByLabel("Focus on a passage");
  await expect(field).toBeFocused();
  await field.fill("John 3:16");
  await field.press("Escape");
  await expect(field).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(field).toHaveValue("John 3:16");
  await field.press("Enter");
  await expect(page.locator(".scope-tag")).toContainText("John 3:16");
});
