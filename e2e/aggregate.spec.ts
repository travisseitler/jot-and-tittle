import { test, expect, open, log, history, createJournal } from "./helpers";
test("aggregate scope combines records without changing logging destination", async ({
  page,
}) => {
  await open(page);
  await log(page, "John 3:16");
  await createJournal(page, "Sermons");
  await log(page, "John 3:16");
  await page.getByLabel("View journals").selectOption("all");
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(2);
  await expect(page.getByText(/New readings go to Sermons/)).toBeVisible();
  await page.getByLabel("View journals").selectOption("selected");
  await page.getByRole("checkbox", { name: "Journal", exact: true }).uncheck();
  await expect(
    page.getByText("Select at least one journal to see readings."),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "Sermons", exact: true }).check();
  await expect(page.locator(".history-row")).toHaveCount(1);
});
