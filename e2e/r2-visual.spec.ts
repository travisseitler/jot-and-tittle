import type { Page, TestInfo } from "@playwright/test";
import { test, expect, open, log, history } from "./helpers";

// Matched, deterministic r2 evidence uses one browser; interaction coverage in
// the rest of the suite exercises the other configured engines and devices.
const viewports = [
  { width: 1440, height: 1000 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 720 },
];
const notes =
  "A reflection kept with this reading.\n\n" +
  "Long notes stay readable and preserve their context. ".repeat(9) +
  "\n" +
  "A-long-unbroken-reference-".repeat(18);

async function noPageOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport + 1);
}
async function evidence(page: Page, testInfo: TestInfo, name: string) {
  await noPageOverflow(page);
  // Capture from the document origin so fixed shell and offscreen skip links
  // retain their viewport positions in full-page evidence.
  await page.evaluate(() => window.scrollTo(0, 0));
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: "image/png" });
}
async function checkShell(page: Page, width: number) {
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav).toBeVisible();
  const shell = await page.locator(".sidebar").evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      width: el.getBoundingClientRect().width,
      position: style.position,
    };
  });
  const navPosition = await nav.evaluate((el) => getComputedStyle(el).position);
  if (width >= 1024) {
    expect(shell.width).toBe(192);
    expect(shell.position).toBe("fixed");
  } else {
    expect(shell.width).toBe(width);
    expect(shell.position).toBe("relative");
    expect(navPosition).toBe(width < 768 ? "fixed" : "static");
  }
  const title = page.locator(".page-heading h1");
  const actual = await title.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      size: parseFloat(style.fontSize),
      line: parseFloat(style.lineHeight),
    };
  });
  expect(actual.size).toBe(width >= 1024 ? 32 : width >= 768 ? 30 : 26);
  expect(actual.line).toBeCloseTo(
    width >= 1024 ? 40 : width >= 768 ? 38 : 34,
    1,
  );
}

for (const viewport of viewports) {
  test(`r2 visual states at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Matched r2 reference engine",
    );
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    await checkShell(page, viewport.width);
    await evidence(page, testInfo, `first-use-${viewport.width}`);

    await page
      .locator("header")
      .getByRole("button", { name: "Log a reading", exact: true })
      .click();
    await expect(page.locator("main:not([hidden])")).toHaveCount(1);
    await expect(page.locator(".capture-card")).toBeVisible();
    await page.getByLabel("Passage or passages").fill("John 3:16–21; Romans 8");
    await page.getByLabel("Notes").fill(notes);
    const fieldStyle = await page
      .getByLabel("Passage or passages")
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          size: style.fontSize,
          height: el.getBoundingClientRect().height,
          border: style.borderTopColor,
        };
      });
    expect(fieldStyle.size).toBe("16px");
    expect(fieldStyle.height).toBeGreaterThanOrEqual(48);
    expect(fieldStyle.border).toBe("rgb(123, 139, 119)");
    await evidence(page, testInfo, `capture-${viewport.width}`);
    await page
      .getByRole("button", { name: "Save reading", exact: true })
      .click();
    await expect(page.locator(".capture-card")).toHaveCount(0);
    await expect(page.locator(".toast")).toHaveCount(0, { timeout: 6000 });
    await evidence(page, testInfo, `map-${viewport.width}`);

    await page.getByLabel("Verse reference", { exact: true }).fill("John 3:16");
    await page
      .getByRole("button", { name: "Inspect verse", exact: true })
      .click();
    await expect(page.locator(".detail-surface")).toBeVisible();
    await expect(page.locator(".detail-surface h2")).toBeFocused();
    const detail = await page.locator(".detail-surface").boundingBox();
    if (viewport.width >= 1248) {
      expect(detail!.width).toBe(328);
      await expect(page.locator(".detail-main")).toBeVisible();
    } else await expect(page.locator(".detail-main")).toBeHidden();
    await evidence(page, testInfo, `passage-detail-${viewport.width}`);
    await page
      .locator(".detail-surface")
      .getByRole("button", { name: "Back to map", exact: true })
      .click();

    await history(page);
    await expect(page.locator(".history-row")).toHaveCount(1);
    const historyTitle = await page
      .locator(".history-row .reading-title")
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          size: style.fontSize,
          line: style.lineHeight,
          weight: style.fontWeight,
        };
      });
    expect(historyTitle).toEqual({ size: "18px", line: "27px", weight: "600" });
    await evidence(page, testInfo, `history-${viewport.width}`);
    await page.locator(".history-row .reading-title").click();
    await expect(page.locator(".reading-detail")).toBeVisible();
    await expect(page.locator(".reading-detail h2")).toBeFocused();
    const noteStyle = await page
      .locator(".reading-detail .reading-notes")
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          size: style.fontSize,
          line: parseFloat(style.lineHeight),
          whitespace: style.whiteSpace,
        };
      });
    expect(noteStyle.size).toBe("16px");
    expect(noteStyle.line).toBeCloseTo(26.4, 1);
    expect(noteStyle.whitespace).toBe("pre-wrap");
    await evidence(page, testInfo, `reading-detail-${viewport.width}`);

    await page
      .getByRole("button", { name: "Reading patterns", exact: true })
      .click();
    await expect(page.locator(".page-heading h1")).toHaveText(
      "Reading patterns",
    );
    await evidence(page, testInfo, `patterns-${viewport.width}`);
    await page.getByRole("button", { name: "Your data", exact: true }).click();
    await expect(page.locator(".page-heading h1")).toHaveText("Your data");
    await evidence(page, testInfo, `data-${viewport.width}`);
  });
}

test("r2 shell and detail breakpoint boundaries preserve usable widths", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Matched r2 reference engine",
  );
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await log(page, "John 3:16", notes);
  for (const width of [767, 768, 1023, 1024, 1247, 1248]) {
    await page.setViewportSize({ width, height: 1000 });
    await checkShell(page, width);
    await noPageOverflow(page);
    await page.getByLabel("Verse reference", { exact: true }).fill("John 3:16");
    await page
      .getByRole("button", { name: "Inspect verse", exact: true })
      .click();
    await expect(page.locator(".detail-surface")).toBeVisible();
    if (width < 1248) await expect(page.locator(".detail-main")).toBeHidden();
    else {
      await expect(page.locator(".detail-main")).toBeVisible();
      const detail = await page.locator(".detail-surface").boundingBox();
      const map = await page.locator(".detail-main").boundingBox();
      expect(detail!.width).toBe(328);
      expect(map!.width).toBeGreaterThanOrEqual(640);
      expect(detail!.x - (map!.x + map!.width)).toBe(24);
    }
    await evidence(page, testInfo, `detail-boundary-${width}`);
    await page
      .locator(".detail-surface")
      .getByRole("button", { name: "Back to map", exact: true })
      .click();
  }
});
