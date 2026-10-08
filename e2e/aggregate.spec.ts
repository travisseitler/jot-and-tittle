import { test, expect, open, log, history, createJournal } from "./helpers";
test("aggregate scope combines records without changing logging destination", async ({
  page,
}) => {
  await open(page);
  await log(page, "John 3:16");
  await createJournal(page, "Sermons");
  await log(page, "John 3:16");
  const edit = () =>
    page.getByRole("button", { name: "View readings", exact: true }).click();
  const apply = () =>
    page.getByRole("button", { name: "Apply view", exact: true }).click();
  await edit();
  await page.getByLabel("View journals").selectOption("all");
  await apply();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(2);
  await page
    .locator("header")
    .getByRole("button", { name: "Log a reading", exact: true })
    .click();
  await expect(
    page.getByLabel("Recording journal").locator("option:checked"),
  ).toHaveText("Sermons");
  await page.keyboard.press("Escape");
  await edit();
  await page.getByLabel("View journals").selectOption("selected");
  await page.getByRole("checkbox", { name: "Journal", exact: true }).uncheck();
  await apply();
  await expect(
    page.getByText("No journals selected", { exact: true }),
  ).toBeVisible();
  await edit();
  await page.getByRole("checkbox", { name: "Sermons", exact: true }).check();
  await apply();
  await expect(page.locator(".history-row")).toHaveCount(1);
});
