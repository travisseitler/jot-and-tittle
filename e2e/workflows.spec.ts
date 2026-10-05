import { readFile } from "node:fs/promises";
import {
  test,
  expect,
  open,
  log,
  history,
  createJournal,
  data,
  clear,
} from "./helpers";

test("readings can be logged, edited, reloaded and deleted", async ({
  page,
}) => {
  await open(page);
  await log(page, "Romans 8:1–3", "original note");
  await history(page);
  await expect(page.locator(".history-row")).toContainText(
    "3 unique verses · original note",
  );
  await page
    .getByRole("button", { name: "Edit Romans 8:1–3", exact: true })
    .click();
  await page.getByLabel("Passage or passages").fill("Psalm 23");
  await page.getByLabel("Notes").fill("updated note");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toContainText(
    "6 unique verses · updated note",
  );
  await page
    .getByRole("button", { name: "Delete Psalm 23", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete reading", exact: true })
    .click();
  await expect(page.locator(".history-row")).toHaveCount(0);
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(0);
});

test("journals track the same verse independently and persist names and selection", async ({
  page,
}) => {
  await open(page);
  await log(page, "Genesis 1:1", "default journal");
  await createJournal(page, "Sermons");
  const canvas = page.getByRole("img", { name: /verse map/ });
  await canvas.focus();
  await canvas.press("Enter");
  await expect(page.getByRole("dialog")).toContainText("0 recorded readings");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(0);
  await log(page, "Genesis 1:1", "sermon journal");
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page.getByLabel("Journal name").fill("Sunday sermons");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByLabel("Current journal").locator("option:checked"),
  ).toHaveText("Sunday sermons");
  await history(page);
  await expect(page.locator(".history-row")).toContainText("sermon journal");
  await page.getByLabel("Current journal").selectOption("journal-default");
  await expect(page.locator(".history-row")).toContainText("default journal");
  await expect(page.locator(".history-row")).toHaveCount(1);
});

test("export, previewed merge, duplicates and journal-local reset preserve unrelated data", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => localStorage.setItem("unrelated-app", "keep me"));
  await log(page, "Genesis 1:1", "default journal");
  await createJournal(page, "Sermons");
  await log(page, "Psalm 23", "sermon journal");
  await data(page);
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export all journals" }).click();
  const download = await downloading;
  const backup = await readFile((await download.path())!, "utf8");
  const parsed = JSON.parse(backup);
  expect(parsed.version).toBe(3);
  expect(parsed.journals).toHaveLength(2);
  expect(parsed.readings).toHaveLength(2);
  await clear(page);
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(0);
  await page.getByLabel("Current journal").selectOption("journal-default");
  await expect(page.locator(".history-row")).toContainText("default journal");
  expect(await page.evaluate(() => localStorage.getItem("unrelated-app"))).toBe(
    "keep me",
  );
  await data(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await expect(
    page.getByRole("dialog", { name: "Review your import" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Merge journals & readings" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Current journal").selectOption({ label: "Sermons" });
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText("sermon journal");
  await data(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup-again.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await page.getByRole("button", { name: "Merge journals & readings" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
});

test("real v1 IndexedDB readings migrate into Journal", async ({ page }) => {
  // Seed before React loads; the sessionStorage guard prevents reseeding on reload.
  await page.addInitScript(async () => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "yes");
    const request = indexedDB.open("jot-and-tittle", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("readings", { keyPath: "id" }).put({
        id: "legacy-reading",
        originalInput: "Genesis 1:1",
        notes: "legacy note",
        startedAt: "2026-10-01T12:00:00Z",
        createdAt: "2026-10-01T12:00:00Z",
        updatedAt: "2026-10-01T12:00:00Z",
        ranges: [{ start: 0, end: 0 }],
      });
    };
    request.onsuccess = () => request.result.close();
  });
  await open(page);
  await history(page);
  await expect(page.locator(".history-row")).toContainText("legacy note");
  await expect(
    page.getByLabel("Current journal").locator("option:checked"),
  ).toHaveText("Journal");
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
});
