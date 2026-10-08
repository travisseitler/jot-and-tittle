import { test, expect, open, log, createJournal } from "./helpers";

test("view drafts cancel without changing results and applied context follows pages", async ({
  page,
}) => {
  await open(page);
  await log(page);
  await page
    .getByRole("button", { name: "Reading history", exact: true })
    .click();
  const trigger = page.getByRole("button", {
    name: "View readings",
    exact: true,
  });
  await trigger.click();
  await page
    .getByLabel("Reading period", { exact: true })
    .selectOption("custom");
  await page.getByLabel("Start date", { exact: true }).fill("2026-09-01");
  await page.getByLabel("End date", { exact: true }).fill("2026-09-30");
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.getByLabel("Reading period", { exact: true })).toHaveValue(
    "all",
  );
  await page
    .getByLabel("Reading period", { exact: true })
    .selectOption("month");
  await page.getByRole("button", { name: "Apply view", exact: true }).click();
  for (const destination of ["Verse map", "Reading patterns"]) {
    await page.getByRole("button", { name: destination, exact: true }).click();
    await expect(
      page.getByRole("region", { name: "Reading view" }),
    ).toContainText("2026-10-01 through 2026-10-05");
  }
  await page.getByRole("button", { name: "Your data", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View readings", exact: true }),
  ).toHaveCount(0);
});

test("recording into another journal preserves view and offers a way to find the saved entry", async ({
  page,
}) => {
  await open(page);
  await log(page);
  await createJournal(page, "Sermons");
  await page.getByLabel("Current journal").selectOption("journal-default");
  await page
    .getByRole("button", { name: "Reading history", exact: true })
    .click();
  await page
    .locator("header")
    .getByRole("button", { name: "Log a reading", exact: true })
    .click();
  await page.getByLabel("Recording journal").selectOption({ label: "Sermons" });
  await page.getByLabel("Passage or passages").fill("John 3:16");
  await page.getByLabel("Reading date").fill("2026-10-05");
  await page.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(page.locator(".toast")).toContainText(
    "Hidden by your current view",
  );
  await expect(page.getByLabel("Current journal")).toHaveValue(
    "journal-default",
  );
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Show this reading", exact: true })
    .click();
  await expect(page.getByRole("group", { name: /verse map,/ })).toHaveAttribute(
    "aria-label",
    /1 verses/,
  );
  await page
    .getByRole("button", { name: "Reading history", exact: true })
    .click();
  await expect(page.locator(".history-row")).toContainText("John 3:16");
});

test("sample context remains consistent and avoids personal editing controls", async ({
  page,
}, testInfo) => {
  await open(page);
  await page
    .getByRole("button", { name: "Explore sample readings", exact: true })
    .click();
  await expect(page.locator("header")).toContainText("Sample readings");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.screenshot({
    path: testInfo.outputPath("map-overview.png"),
    fullPage: false,
  });
  await page
    .getByRole("button", { name: "Reading history", exact: true })
    .click();
  await expect(page.locator(".history-row")).toHaveCount(80);
  await expect(page.locator(".reading-actions")).toHaveCount(0);
  await page.locator(".reading-title").first().click();
  await expect(page.locator(".reading-detail")).toContainText(
    "Sample readings",
  );
  await expect(
    page.getByRole("button", { name: "Edit reading", exact: true }),
  ).toHaveCount(0);
});

test("optional controls fit a 320px viewport and preserve readable filter text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await open(page);
  await log(page);
  await page
    .getByRole("button", { name: "View readings", exact: true })
    .click();
  await page
    .getByLabel("Reading period", { exact: true })
    .selectOption("custom");
  await expect(page.getByLabel("Start date", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: /Map display/ }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Go to passage", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const contrast = await page.locator(".view-summary p span").evaluate((el) => {
    function luminance(rgb: string) {
      const values = rgb
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
      return values.reduce((n, v, i) => n + v * [0.2126, 0.7152, 0.0722][i], 0);
    }
    const style = getComputedStyle(el),
      background = getComputedStyle(document.documentElement).backgroundColor;
    const fg = luminance(style.color),
      bg = luminance(background);
    return {
      ratio: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05),
      size: parseFloat(style.fontSize),
    };
  });
  expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
  expect(contrast.size).toBeGreaterThanOrEqual(14);
});
