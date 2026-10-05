import { test, expect, open, log, history, createJournal } from "./helpers";
test("move preserves a reading across journals and reload", async ({
  page,
}) => {
  await open(page);
  await log(page, "John 3:16", "Keep this note");
  await createJournal(page, "Sermons");
  await page.getByLabel("Current journal").selectOption("journal-default");
  await history(page);
  await page
    .getByRole("button", { name: "Move John 3:16", exact: true })
    .click();
  await page
    .getByLabel("Destination journal")
    .selectOption({ label: "Sermons" });
  await page.getByRole("button", { name: "Move reading", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit John 3:16", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Current journal").selectOption({ label: "Sermons" });
  await expect(
    page.getByText("1 unique verses · Keep this note", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await history(page);
  await expect(
    page.getByRole("button", { name: "Edit John 3:16", exact: true }),
  ).toHaveCount(1);
});
