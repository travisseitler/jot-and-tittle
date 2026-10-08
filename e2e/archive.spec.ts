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

test("empty archive preserves read-only recovery across views without entering onboarding", async ({
  page,
}) => {
  await open(page);
  await createJournal(page, "Empty archive");
  await page
    .getByRole("button", { name: "Manage journals", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Archive Empty archive", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Inspect Empty archive", exact: true })
    .click();
  const recovery =
    "No readings from this archived journal appear in this view. Return to active journal to view your current readings.";
  await expect(page.locator(".large-empty")).toContainText(recovery);
  await expect(
    page
      .locator(".large-empty")
      .getByRole("button", { name: "Log a reading", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Verse map", exact: true }).click();
  await expect(page.locator(".welcome")).toHaveCount(0);
  await expect(page.locator(".empty-recent")).toContainText(recovery);
  await expect(
    page
      .locator(".empty-recent")
      .getByRole("button", { name: "Log a reading", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Reading patterns", exact: true })
    .click();
  await expect(page.locator(".pattern-overview")).toContainText(recovery);
  await page
    .getByRole("button", { name: "Return to active journal", exact: true })
    .click();
  await page.getByRole("button", { name: "Verse map", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Log your first reading", exact: true }),
  ).toBeEnabled();
});
