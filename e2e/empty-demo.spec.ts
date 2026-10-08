import { test, expect, open, log } from "./helpers";

test("demo pans on both axes as different passages gain color", async ({
  page,
}, testInfo) => {
  await open(page);
  const demo = page.getByRole("img", { name: /Illustration of a zoomed-in/ });
  await page.getByRole("button", { name: "Pause map demo" }).click();
  const frame = async (time: number) =>
    demo.evaluate((el, currentTime) => {
      for (const animation of el.getAnimations({ subtree: true }))
        animation.currentTime = currentTime;
      const camera = new DOMMatrix(
        getComputedStyle(el.querySelector(".demo-camera")!).transform,
      );
      return {
        x: camera.e,
        y: camera.f,
        secondPassage: getComputedStyle(el.querySelector(".demo-passage-2")!)
          .fill,
      };
    }, time);
  const start = await frame(3000);
  const next = await frame(8000);
  expect(next.x).toBeLessThan(start.x);
  expect(next.y).toBeLessThan(start.y);
  expect(next.secondPassage).not.toBe(start.secondPassage);
  await page
    .locator(".welcome")
    .screenshot({ path: testInfo.outputPath("demo-preview.png") });
});

test("empty map demo can pause and gives way to a real reading", async ({
  page,
}) => {
  await open(page);
  const demo = page.getByRole("img", { name: /Illustration of a zoomed-in/ });
  await expect(demo).toBeVisible();
  await page.getByRole("button", { name: "Pause map demo" }).click();
  const animations = await demo.evaluate((el) =>
    el.getAnimations({ subtree: true }).map((animation) => animation.playState),
  );
  expect(animations.length).toBeGreaterThan(0);
  expect(animations.every((state) => state === "paused")).toBe(true);
  await page.getByRole("button", { name: "Play map demo" }).click();
  await expect(
    page.getByRole("button", { name: "Pause map demo" }),
  ).toBeVisible();
  await page.reload();
  await expect(demo).toBeVisible();
  await log(page);
  await expect(demo).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: /Combined recency and frequency verse map/ }),
  ).toBeVisible();
  await page.reload();
  await expect(demo).toHaveCount(0);
});

test("reduced motion shows a static colored preview without a pause control", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const demo = page.getByRole("img", { name: /Illustration of a zoomed-in/ });
  await expect(demo).toBeVisible();
  expect(
    await demo.evaluate((el) => el.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await expect(
    page.getByRole("button", { name: "Pause map demo" }),
  ).toBeHidden();
  const colors = await demo.evaluate((el) => ({
    read: getComputedStyle(el.querySelector(".demo-passage")!).fill,
    empty: getComputedStyle(el.querySelector("rect:not(.demo-passage)")!).fill,
  }));
  expect(colors.read).not.toBe(colors.empty);
});
