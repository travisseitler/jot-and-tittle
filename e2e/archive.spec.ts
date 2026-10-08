import {
  test,
  expect,
  open,
  log,
  createJournal,
  data,
  history,
} from "./helpers";
test("archive hides the destination and preserves read-only history through restart", async ({
  page,
}) => {
  await open(page);
  await createJournal(page, "Sermons");
  await log(page, "John 3:16");
  await data(page);
  await page
    .getByRole("button", { name: "Manage journals", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Archive Sermons", exact: true })
    .click();
  await expect(
    page.getByLabel("Current journal").locator("option:checked"),
  ).toHaveText("Journal");
  await expect(
    page.getByLabel("Current journal").locator("option"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Inspect Sermons", exact: true })
    .click();
  await page.locator(".reading-title").click();
  await expect(
    page.getByRole("button", { name: "Edit reading", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.reload();
  await data(page);
  await page
    .getByRole("button", { name: "Manage journals", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore Sermons", exact: true })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Current journal").selectOption({ label: "Sermons" });
  await history(page);
  await expect(
    page.getByRole("button", {
      name: "John 3:16",
      exact: true,
    }),
  ).toBeEnabled();
});
