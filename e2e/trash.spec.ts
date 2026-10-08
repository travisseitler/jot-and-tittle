import { test, expect, open, log, history, data } from "./helpers";
test("Trash persists through reload and restoration consumes immediate Undo", async ({
  page,
}) => {
  await open(page);
  await log(page, "John 3:16", "Recover this");
  await history(page);
  await page
    .getByRole("button", { name: "Delete John 3:16", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete reading", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await data(page);
  await expect(
    page.getByText(/John 3:16 · Oct 5, 2026 · Recover this/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restore deleted readings", exact: true })
    .click();
  await expect(
    page.getByText("Trash is empty.", { exact: true }),
  ).toBeVisible();
  await history(page);
  await expect(
    page.getByRole("button", { name: "Edit John 3:16", exact: true }),
  ).toHaveCount(1);
});
test("permanent Trash deletion requires confirmation", async ({ page }) => {
  await open(page);
  await log(page, "John 3:16");
  await history(page);
  await page
    .getByRole("button", { name: "Delete John 3:16", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete reading", exact: true })
    .click();
  await data(page);
  await page
    .getByRole("button", { name: "Permanently delete from Trash", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm permanent deletion", exact: true })
    .click();
  await expect(
    page.getByText("Trash is empty.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await data(page);
  await expect(
    page.getByText("Trash is empty.", { exact: true }),
  ).toBeVisible();
});
