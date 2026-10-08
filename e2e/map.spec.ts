import { test, expect, open, log } from "./helpers";

test("canvas metrics, scopes, layouts, zoom and keyboard inspection", async ({
  page,
}) => {
  await open(page);
  await log(page);
  const navigator = page.getByRole("group", { name: /verse map,/ });
  const canvas = page.locator(".canvas-wrap canvas").first();
  await page
    .getByRole("button", { name: "Go to passage", exact: true })
    .click();
  await page.getByLabel("Focus on a passage").fill("Genesis 1:1–3");
  await page
    .getByRole("button", { name: "Focus passage", exact: true })
    .click();
  await expect(navigator).toHaveAttribute("aria-label", /3 verses/);
  // Compare rendered cell pixels rather than screenshots dependent on fonts/OS.
  const pixels = () =>
    canvas.evaluate((element: HTMLCanvasElement) => {
      const ctx = element.getContext("2d")!;
      const dpr = window.devicePixelRatio;
      return [1, 6].map((x) =>
        Array.from(ctx.getImageData(x * dpr, dpr, 1, 1).data),
      );
    });
  await expect.poll(pixels).not.toEqual([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const combined = await pixels();
  expect(combined[0]).not.toEqual(combined[1]);
  await page.getByRole("button", { name: /Map display/ }).click();
  for (const metric of ["Recency", "Frequency"]) {
    await page.getByRole("button", { name: metric, exact: true }).click();
    await expect(navigator).toHaveAttribute(
      "aria-label",
      new RegExp(metric.toLowerCase()),
    );
    await expect.poll(pixels).not.toEqual(combined);
    const cells = await pixels();
    expect(cells[0]).not.toEqual(cells[1]);
    expect(cells[1]).toEqual(combined[1]);
  }
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await navigator.focus();
  await navigator.press("ArrowRight");
  await navigator.press("Enter");
  await expect(
    page.getByRole("complementary", { name: "Genesis 1:2", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to map" }).click();
  await page.getByRole("button", { name: /Map display/ }).click();
  await page.getByRole("button", { name: "Fixed", exact: true }).click();
  await expect
    .poll(() => canvas.evaluate((el) => el.getBoundingClientRect().width))
    .toBe(800);
  await page
    .getByRole("button", { name: "Increase cell size", exact: true })
    .click();
  await expect
    .poll(() => canvas.evaluate((el) => el.getBoundingClientRect().width))
    .toBe(1120);
  await page
    .getByRole("button", { name: "Reset cell size", exact: true })
    .click();
  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByLabel("Book scope").selectOption({ label: "Genesis" });
  await page.getByLabel("Chapter scope").selectOption("1");
  await expect(navigator).toHaveAttribute("aria-label", /31 verses/);
});

test("capture opens its field and Escape retains draft and restores the trigger", async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole("button", {
    name: "Log a reading",
    exact: true,
  });
  await trigger.focus();
  await trigger.press("Enter");
  const field = page.getByLabel("Passage or passages");
  await expect(field).toBeFocused();
  await field.fill("John 3:16");
  await page.keyboard.press("Escape");
  await expect(page.locator(".capture-card")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(field).toHaveValue("John 3:16");
});

test("touch viewport can log and tap a verse without page overflow", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Touch input runs in the mobile projects.");
  await open(page);
  await log(page);
  const navigator = page.getByRole("group", { name: /verse map,/ });
  const canvas = page.locator(".canvas-wrap canvas").first();
  // Bring the first cell below the sticky mobile navigation before tapping it.
  await canvas.evaluate((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    const navigation = document.querySelector(".sidebar")!;
    window.scrollTo(0, top - navigation.getBoundingClientRect().height - 16);
  });
  await canvas.tap({ position: { x: 2, y: 2 } });
  await expect(
    page.getByRole("complementary", { name: "Genesis 1:1", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Inspect passage", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Genesis 1:1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Genesis 1:1", exact: true }),
  ).toContainText("1 recorded readings");
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fits).toBe(true);
});
