import { readingAction } from "./helpers";
import { test, expect, open, log, history, createJournal } from "./helpers";
test("move preserves a reading across journals and reload", async ({
  page,
}) => {
  await open(page);
  await log(page, "John 3:16", "Keep this note");
  await createJournal(page, "Sermons");
  await page.getByLabel("Current journal").selectOption("journal-default");
  await history(page);
  await readingAction(page, "Move John 3:16");
  await page
    .getByLabel("Destination journal")
    .selectOption({ label: "Sermons" });
  await readingAction(page, "Move reading");
  await expect(
    page.getByRole("button", {
      name: "John 3:16",
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByLabel("Current journal").selectOption({ label: "Sermons" });
  await expect(
    page.getByText("1 unique verses · Keep this note", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await history(page);
  await expect(
    page.getByRole("button", {
      name: "John 3:16",
      exact: true,
    }),
  ).toHaveCount(1);
});

test("copy keeps original and survives reload", async ({ page }) => {
  await open(page);
  await log(page, "John 3:16");
  await createJournal(page, "Copies");
  await page.getByLabel("Current journal").selectOption("journal-default");
  await history(page);
  await readingAction(page, "Copy John 3:16");
  await page
    .getByLabel("Destination journal")
    .selectOption({ label: "Copies" });
  await readingAction(page, "Copy reading");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "John 3:16",
      exact: true,
    }),
  ).toHaveCount(1);
  await page.getByLabel("Current journal").selectOption({ label: "Copies" });
  await page.reload();
  await history(page);
  await expect(
    page.getByRole("button", {
      name: "John 3:16",
      exact: true,
    }),
  ).toHaveCount(1);
});
