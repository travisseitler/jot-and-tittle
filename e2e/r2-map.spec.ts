import { test, expect, open, log } from "./helpers";

async function scopeGenesis(
  page: import("@playwright/test").Page,
  passage = "Genesis 1",
) {
  await page
    .getByRole("button", { name: "Go to passage", exact: true })
    .click();
  await page.getByLabel("Focus on a passage").fill(passage);
  await page
    .getByRole("button", { name: "Focus passage", exact: true })
    .click();
}

test("Text view includes zeros, paginates without missing verses and retains boundary focus", async ({
  page,
  isMobile,
}) => {
  await open(page);
  await log(page, "Genesis 1:2", "First paragraph.\n\nSecond paragraph.");
  await scopeGenesis(page);
  await page.getByRole("button", { name: "Text view", exact: true }).click();
  const entries = () =>
    isMobile
      ? page.locator(".r2-text-list li h4")
      : page.locator(".r2-text-table tbody th");
  const seen: string[] = [];
  const next = page.getByRole("button", { name: "Next verses", exact: true });
  while (true) {
    seen.push(...(await entries().allTextContents()));
    if ((await next.getAttribute("aria-disabled")) === "true") break;
    await next.click();
  }
  expect(seen).toEqual(
    Array.from({ length: 31 }, (_, i) => `Genesis 1:${i + 1}`),
  );
  await expect(next).toBeFocused();
  await next.press("Enter");
  await expect(entries().last()).toHaveText("Genesis 1:31");
  await page.getByLabel("Find passage").fill("Genesis 1:1; Genesis 1:2");
  await page.getByRole("button", { name: "Find passage", exact: true }).click();
  await expect(page.locator(".r2-find-results")).toContainText(
    "2 matching verses",
  );
  const first = isMobile
    ? page.locator(".r2-text-list li").first()
    : page.locator(".r2-text-table tbody tr").first();
  await expect(first).toContainText(isMobile ? "0 reading records" : "0");
  await expect(first).toContainText("No readings in this view");
  await page.getByRole("button", { name: "Next match", exact: true }).click();
  await expect(page.locator(".r2-find-results")).toContainText(
    "Match 2: Genesis 1:2",
  );
  await page
    .getByRole("button", { name: "Inspect Genesis 1:2", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Genesis 1:2", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to Text view", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Inspect Genesis 1:2", exact: true }),
  ).toBeFocused();
});

test("Text find preserves geography and requires an explicit outside scope change", async ({
  page,
}) => {
  await open(page);
  await log(page);
  await scopeGenesis(page, "Genesis 1:1–3");
  await page.getByRole("button", { name: "Text view", exact: true }).click();
  await page.getByLabel("Find passage").fill("Genesis 1:2–5");
  await page.getByRole("button", { name: "Find passage", exact: true }).click();
  await expect(page.locator(".r2-find-results")).toContainText(
    "Outside this scope: Genesis 1:4–5",
  );
  await page.getByLabel("Find passage").fill("Genesis 1:2; John 3:16");
  await page.getByRole("button", { name: "Find passage", exact: true }).click();
  await expect(page.locator(".scope-tag")).toContainText("Genesis 1:1–3");
  await expect(page.locator(".r2-find-results")).toContainText(
    "1 matching verses",
  );
  const change = page.getByRole("button", {
    name: "Change passage scope to John 3:16",
    exact: true,
  });
  await expect(change).toBeVisible();
  await change.click();
  await expect(page.locator(".scope-tag")).toContainText("John 3:16");
  await page.getByLabel("Find passage").fill("not a reference");
  await page.getByRole("button", { name: "Find passage", exact: true }).click();
  await expect(page.getByLabel("Find passage")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator(".scope-tag")).toContainText("John 3:16");
});

test("Fixed keyboard rows differ from scope endpoints and canvas previews do not open detail", async ({
  page,
  isMobile,
}) => {
  await open(page);
  await log(page);
  await scopeGenesis(page, "Genesis 1:1–7:10");
  await page.getByRole("button", { name: /Map display/ }).click();
  await page.getByRole("button", { name: "Fixed", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const navigator = page.getByRole("group", { name: /verse map,/ });
  await navigator.focus();
  await navigator.press("End");
  await expect(page.locator(".r2-map-preview")).toContainText("Genesis 6:22");
  await navigator.press("Control+End");
  await expect(page.locator(".r2-map-preview")).toContainText("Genesis 7:10");
  await navigator.press("Control+Home");
  await expect(page.locator(".r2-map-preview")).toContainText("Genesis 1:1");
  await expect(page.locator(".canvas-wrap canvas").first()).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  const canvas = page.locator(".canvas-wrap canvas").first();
  await canvas.scrollIntoViewIfNeeded();
  await canvas.evaluate((el) => {
    const scroll = el.closest(".map-scroll")!;
    scroll.scrollLeft = 0;
    scroll.scrollTop = 0;
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 160);
  });
  const point = (await canvas.boundingBox())!;
  expect(point.x + 2).toBeGreaterThan(0);
  expect(point.x + 2).toBeLessThan(page.viewportSize()!.width);
  expect(point.y + 2).toBeGreaterThan(100);
  expect(point.y + 2).toBeLessThan(page.viewportSize()!.height - 100);
  if (isMobile) await page.touchscreen.tap(point.x + 2, point.y + 2);
  else await page.mouse.click(point.x + 2, point.y + 2);
  await expect(
    page.getByRole("complementary", { name: "Genesis 1:1", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Inspect passage", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Genesis 1:1", exact: true }),
  ).toBeVisible();
});

test("dragged and cancelled pointer gestures do not commit a verse preview", async ({
  page,
}) => {
  await open(page);
  await log(page);
  await scopeGenesis(page, "Genesis 1:1–3");
  const canvas = page.locator(".canvas-wrap canvas").first(),
    box = (await canvas.boundingBox())!;
  const point = {
    pointerId: 7,
    pointerType: "touch",
    clientX: box.x + 2,
    clientY: box.y + 2,
    bubbles: true,
  };
  await canvas.dispatchEvent("pointerdown", point);
  await canvas.dispatchEvent("pointermove", { ...point, clientX: box.x + 32 });
  await canvas.dispatchEvent("pointerup", { ...point, clientX: box.x + 32 });
  await expect(
    page.getByRole("button", { name: "Inspect passage", exact: true }),
  ).toBeDisabled();
  await canvas.dispatchEvent("pointerdown", point);
  await canvas.dispatchEvent("pointercancel", point);
  await canvas.dispatchEvent("pointerup", point);
  await expect(
    page.getByRole("button", { name: "Inspect passage", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("complementary", { name: /Genesis/ }),
  ).toHaveCount(0);
});
