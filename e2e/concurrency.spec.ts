import { test, expect, open, log, history, data } from "./helpers";

for (const remoteAction of ["edit", "delete"] as const) {
  test(`stale save is rejected after a remote ${remoteAction} without broadcast delivery`, async ({
    page,
    context,
  }) => {
    // Exercise transactional conflict checks even when live tab notifications fail.
    await context.addInitScript(() => {
      Object.defineProperty(window, "BroadcastChannel", { value: undefined });
    });
    await open(page);
    await log(page);
    await history(page);
    await page
      .getByRole("button", { name: "Edit Genesis 1:1", exact: true })
      .click();
    await page.getByLabel("Notes").fill("stale draft");
    const other = await context.newPage();
    await other.clock.setFixedTime(new Date("2026-10-05T12:01:00Z"));
    await open(other);
    await history(other);
    if (remoteAction === "edit") {
      await other
        .getByRole("button", { name: "Edit Genesis 1:1", exact: true })
        .click();
      await other.getByLabel("Notes").fill("remote version");
      await other
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
    } else {
      await other
        .getByRole("button", { name: "Delete Genesis 1:1", exact: true })
        .click();
      await other
        .getByRole("dialog")
        .getByRole("button", { name: "Delete reading", exact: true })
        .click();
    }
    await expect(other.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: "This reading changed elsewhere" }),
    ).toBeVisible();
    await page.reload();
    await history(page);
    if (remoteAction === "edit") {
      await expect(page.locator(".history-row")).toContainText(
        "remote version",
      );
      await expect(page.locator(".history-row")).not.toContainText(
        "stale draft",
      );
    } else {
      await expect(page.locator(".history-row")).toHaveCount(0);
    }
  });
}

test("independent additions from two tabs both survive reload", async ({
  page,
  context,
}) => {
  await open(page);
  const other = await context.newPage();
  await other.clock.setFixedTime(new Date("2026-10-05T12:01:00Z"));
  await open(other);
  await Promise.all([
    log(page, "Genesis 1:1", "first tab"),
    log(other, "Psalm 23", "second tab"),
  ]);
  for (const tab of [page, other]) {
    await tab.reload();
    await history(tab);
    await expect(tab.locator(".history-row")).toHaveCount(2);
    await expect(
      tab.locator(".history-row").filter({ hasText: "first tab" }),
    ).toBeVisible();
    await expect(
      tab.locator(".history-row").filter({ hasText: "second tab" }),
    ).toBeVisible();
  }
});

test("stale edits cannot overwrite a newer edit or resurrect a deleted reading", async ({
  page,
  context,
}) => {
  await open(page);
  await log(page);
  await history(page);
  // Move beyond the app's 250ms own-write broadcast suppression window.
  await page.clock.setFixedTime(new Date("2026-10-05T12:00:01Z"));
  const other = await context.newPage();
  await other.clock.setFixedTime(new Date("2026-10-05T12:01:00Z"));
  await open(other);
  await history(other);
  for (const tab of [page, other])
    await tab
      .getByRole("button", { name: "Edit Genesis 1:1", exact: true })
      .click();
  await page.getByLabel("Notes").fill("stale draft");
  await other.getByLabel("Notes").fill("newer edit");
  await other
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(other.getByRole("dialog")).toHaveCount(0);
  const conflict = page.getByRole("dialog", {
    name: "This reading changed elsewhere",
  });
  await expect(conflict).toContainText("newer edit");
  await conflict
    .getByRole("button", { name: "Use theirs", exact: true })
    .click();
  await expect(page.getByLabel("Notes")).toHaveValue("newer edit");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(page.locator(".history-row")).toContainText("newer edit");
  await page
    .getByRole("button", { name: "Edit Genesis 1:1", exact: true })
    .click();
  await other
    .getByRole("button", { name: "Delete Genesis 1:1", exact: true })
    .click();
  await other
    .getByRole("dialog")
    .getByRole("button", { name: "Delete reading", exact: true })
    .click();
  await expect(other.locator(".history-row")).toHaveCount(0);
  await expect(
    conflict.getByRole("button", { name: "Save as new reading" }),
  ).toBeVisible();
  await conflict.getByRole("button", { name: "Discard my edit" }).click();
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(0);
});

test("a pending journal reset preserves readings added by another tab", async ({
  page,
  context,
}) => {
  await open(page);
  await log(page, "Genesis 1:1", "remove this");
  const other = await context.newPage();
  await other.clock.setFixedTime(new Date("2026-10-05T12:01:00Z"));
  await open(other);
  await data(page);
  await page
    .getByRole("button", { name: "Clear journal readings", exact: true })
    .click();
  await log(other, "Psalm 23", "keep this");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Clear journal readings", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText("keep this");
  await other.reload();
  await history(other);
  await expect(other.locator(".history-row")).toContainText("keep this");
});
