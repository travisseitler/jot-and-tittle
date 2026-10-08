import { test, expect, open, log } from "./helpers";

test("canvas metrics, scopes, layouts, zoom and keyboard inspection", async ({
  page,
}) => {
  await open(page);
  await log(page);
  const canvas = page.getByRole("img", { name: /verse map/ });
  await page
    .getByRole("button", { name: "Go to passage", exact: true })
    .click();
  await page.getByLabel("Focus on a passage").fill("Genesis 1:1–3");
  await page
    .getByRole("button", { name: "Focus passage", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("aria-label", /3 verses/);
  // Compare rendered cell pixels rather than screenshots dependent on fonts/OS.
  const pixels = () =>
    canvas.evaluate((element: HTMLCanvasElement) => {
      const ctx = element.getContext("2d")!;
      const dpr = window.devicePixelRatio;
      return [1, 5].map((x) =>
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
    await expect(canvas).toHaveAttribute(
      "aria-label",
      new RegExp(metric.toLowerCase()),
    );
    await expect.poll(pixels).not.toEqual(combined);
    const cells = await pixels();
    expect(cells[0]).not.toEqual(cells[1]);
    expect(cells[1]).toEqual(combined[1]);
  }
  await canvas.focus();
  await canvas.press("ArrowRight");
  await canvas.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Genesis 1:2", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Fixed", exact: true }).click();
  await expect
    .poll(() => canvas.evaluate((el) => el.getBoundingClientRect().width))
    .toBe(640);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect
    .poll(() => canvas.evaluate((el) => el.getBoundingClientRect().width))
    .toBe(960);
  await page.getByRole("button", { name: "Reset zoom", exact: true }).click();
  await page.getByRole("button", { name: "Flow", exact: true }).click();
  await page.getByLabel("Book scope").selectOption({ label: "Genesis" });
  await page.getByLabel("Chapter scope").selectOption("1");
  await expect(canvas).toHaveAttribute("aria-label", /31 verses/);
});

test("dialog keyboard focus stays inside and Escape restores the trigger", async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole("button", {
    name: "Log a reading",
    exact: true,
  });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(page.getByLabel("Passage or passages")).toBeFocused();
  await page.getByRole("button", { name: "Close dialog" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("touch viewport can log and tap a verse without page overflow", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Touch input runs in the mobile projects.");
  await open(page);
  await log(page);
  const canvas = page.getByRole("img", { name: /verse map/ });
  await canvas.tap({ position: { x: 1, y: 1 } });
  await expect(
    page.getByRole("dialog", { name: "Genesis 1:1", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("1 recorded readings");
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fits).toBe(true);
});
