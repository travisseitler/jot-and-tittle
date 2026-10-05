import { test, expect, open, data, log, createJournal } from "./helpers";

test("backup status survives reload and follows changes and exports in other tabs", async ({
  page,
  context,
}) => {
  await open(page);
  await data(page);
  await expect(
    page.getByRole("status", { name: "Backup status" }),
  ).toContainText("No personal-data export initiated yet");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export all journals" }).click();
  expect((await download).suggestedFilename()).toMatch(
    /jot-and-tittle.*\.json/,
  );
  await expect(
    page.getByRole("status", { name: "Backup status" }),
  ).toContainText("All current journals and readings match");
  await page.reload();
  await data(page);
  await expect(
    page.getByRole("status", { name: "Backup status" }),
  ).toContainText("Most recent export initiated");
  await expect(
    page.getByRole("status", { name: "Backup status" }),
  ).toContainText("All current journals and readings match");
  const other = await context.newPage();
  await open(other);
  await createJournal(other, "Empty journal");
  await expect(
    page.getByRole("status", { name: "Backup status" }),
  ).toContainText("You have unexported changes");
  await data(other);
  await other.getByRole("button", { name: "Export all journals" }).click();
  await expect(
    page.getByRole("status", { name: "Backup status" }),
  ).toContainText("All current journals and readings match");
  await log(other);
  await expect(
    page.getByRole("status", { name: "Backup status" }),
  ).toContainText("You have unexported changes");
});
