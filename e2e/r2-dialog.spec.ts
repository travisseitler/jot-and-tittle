import { test, expect, open, log } from "./helpers";

test("filter date errors identify their field and Escape restores the trigger", async ({
  page,
}) => {
  await open(page);
  await log(page);
  const trigger = page.getByRole("button", {
    name: "View readings",
    exact: true,
  });
  await trigger.click();
  await page
    .getByLabel("Reading period", { exact: true })
    .selectOption("custom");
  const from = page.getByLabel("Start date", { exact: true });
  const to = page.getByLabel("End date", { exact: true });
  await from.fill("2026-10-08");
  await to.fill("2026-10-01");
  await page.getByRole("button", { name: "Apply view", exact: true }).click();
  await expect(from).toHaveAttribute("aria-invalid", "true");
  await expect(from).toBeFocused();
  const errorId = await page.getByRole("alert").getAttribute("id");
  expect((await from.getAttribute("aria-describedby"))?.split(" ")).toContain(
    errorId,
  );
  await expect(to).toHaveValue("2026-10-01");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("region", { name: "Reading view" }),
  ).toContainText("Applied period: All time");
});

test("modal focus stays within the top dialog and returns to management trigger", async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole("button", {
    name: "Manage journals",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Manage journals",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  const heading = dialog.getByRole("heading", {
    name: "Manage journals",
    exact: true,
  });
  await heading.focus();
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
    .toBe(true);
  for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
  await expect
    .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
});
