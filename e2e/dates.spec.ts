import { readingAction } from "./helpers";
import { readFile } from "node:fs/promises";
import { test, expect, open, log, history, data, NOW } from "./helpers";

test("calendar date survives export into a different timezone and editing", async ({
  browser,
  page,
}) => {
  await open(page);
  await log(page);
  await data(page);
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export all journals" }).click();
  const backup = await readFile((await (await downloading).path())!, "utf8");
  expect(JSON.parse(backup).readings[0]).toMatchObject({
    datePrecision: "date",
    startedAt: "2026-10-05",
  });
  const context = await browser.newContext({
    timezoneId: "Pacific/Honolulu",
    locale: "en-US",
  });
  try {
    const other = await context.newPage();
    await other.clock.setFixedTime(NOW);
    await open(other);
    await data(other);
    await other.locator('input[type="file"]').setInputFiles({
      name: "dates.json",
      mimeType: "application/json",
      buffer: Buffer.from(backup),
    });
    await other
      .getByRole("button", { name: "Merge journals & readings" })
      .click();
    await history(other);
    await expect(other.locator(".history-date")).toContainText("Oct 5, 2026");
    await readingAction(other, "Edit Genesis 1:1");
    await expect(other.getByLabel("Reading date")).toHaveValue("2026-10-05");
    await other.getByLabel("Notes").fill("same calendar day");
    await other
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(other.locator(".capture-card")).toHaveCount(0);
    await other.reload();
    await history(other);
    await expect(other.locator(".history-date")).toContainText("Oct 5, 2026");
    await other.getByLabel("Search reading history").fill("2026-10-05");
    await expect(other.locator(".history-row")).toHaveCount(1);
    await other.getByLabel("Search reading history").fill("2026-10-04");
    await expect(other.locator(".history-row")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("v2 database migration retains original timestamp and allows date correction", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("dates-seeded")) return;
    sessionStorage.setItem("dates-seeded", "yes");
    const request = indexedDB.open("jot-and-tittle", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("readings", { keyPath: "id" }).put({
        id: "legacy",
        journalId: "journal-default",
        startedAt: "2026-10-02T00:30:00+14:00",
        createdAt: "2026-10-01T10:30:00Z",
        updatedAt: "2026-10-01T10:30:00Z",
        originalInput: "Genesis 1:1",
        notes: "",
        ranges: [{ start: 0, end: 0 }],
      });
      db.createObjectStore("journals", { keyPath: "id" }).put({
        id: "journal-default",
        name: "Journal",
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-01T00:00:00Z",
      });
      db.createObjectStore("settings", { keyPath: "id" });
    };
    request.onsuccess = () => request.result.close();
  });
  await open(page);
  await history(page);
  await expect(page.locator(".history-date")).toContainText("Oct 1, 2026");
  await readingAction(page, "Edit Genesis 1:1");
  await expect(page.getByText(/Legacy date estimated from UTC/)).toContainText(
    "2026-10-02T00:30:00+14:00",
  );
  await page.getByLabel("Reading date").fill("2026-10-02");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.locator(".capture-card")).toHaveCount(0);
  await expect(page.locator(".history-date")).toContainText("Oct 2, 2026");
  await data(page);
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export all journals" }).click();
  const backup = JSON.parse(
    await readFile((await (await downloading).path())!, "utf8"),
  );
  expect(backup.readings[0]).toMatchObject({
    startedAt: "2026-10-02",
    datePrecision: "date",
    legacyStartedAt: "2026-10-02T00:30:00+14:00",
  });
});
