import { readingAction } from "./helpers";
import {
  test,
  expect,
  open,
  log,
  history,
  data,
  clear,
  createJournal,
} from "./helpers";

async function remove(
  page: import("@playwright/test").Page,
  passage = "Genesis 1:1",
) {
  await history(page);
  await readingAction(page, `Delete ${passage}`);
  await page
    .getByRole("dialog")
    .getByRole("button", {
      name: "Delete reading",
      exact: true,
      includeHidden: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("Undo is keyboard accessible, survives navigation, and ends on reload", async ({
  page,
}) => {
  await open(page);
  await log(page, "Genesis 1:1", "recover me");
  await remove(page);
  const recovery = page.getByRole("complementary", {
    name: "Reading recovery",
  });
  await expect(recovery).toContainText("Undo available for");
  await data(page);
  const undo = recovery.getByRole("button", { name: "Undo", exact: true });
  await undo.focus();
  await page.keyboard.press("Enter");
  await history(page);
  await expect(page.locator(".history-row")).toContainText("recover me");
  await remove(page);
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(0);
  await expect(recovery).toHaveCount(0);
});

test("consecutive actions remain distinct and expiry is visible", async ({
  page,
}) => {
  await open(page);
  await log(page, "Genesis 1:1");
  await log(page, "Psalm 23");
  await remove(page);
  await remove(page, "Psalm 23");
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Undo", exact: true }).first().click();
  await expect(page.locator(".history-row")).toHaveCount(1);
  await page.clock.setFixedTime(new Date("2026-10-05T12:00:31Z"));
  await expect(
    page.getByRole("complementary", { name: "Reading recovery" }),
  ).toContainText("Undo expired.");
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toHaveCount(0);
});

test("clear Undo restores the set while preserving another tab's additions", async ({
  page,
  context,
}) => {
  await open(page);
  await log(page, "Genesis 1:1", "first");
  await log(page, "Psalm 23", "second");
  await data(page);
  await clear(page);
  const other = await context.newPage();
  await open(other);
  await log(other, "John 1:1", "later");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(3);
  await other.reload();
  await history(other);
  await expect(other.locator(".history-row")).toHaveCount(3);
});

test("Undo explains a journal removed by another tab", async ({
  page,
  context,
}) => {
  await open(page);
  await createJournal(page, "Temporary");
  await log(page);
  await remove(page);
  const other = await context.newPage();
  await open(other);
  // A journal can be removed externally even though the app has no delete-journal UI.
  await other.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("jot-and-tittle");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("journals", "readwrite");
      const store = tx.objectStore("journals");
      const request = store.getAll();
      request.onsuccess = () =>
        store.delete(request.result.find((j) => j.name === "Temporary").id);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  });
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "original journal no longer exists",
  );
});

test("Undo cannot overwrite a record restored and changed in another tab", async ({
  page,
  context,
}) => {
  await open(page);
  await log(page, "Genesis 1:1", "original");
  const original = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("jot-and-tittle");
      request.onsuccess = () => resolve(request.result);
    });
    const rows = await new Promise<any[]>((resolve) => {
      const request = db
        .transaction("readings")
        .objectStore("readings")
        .getAll();
      request.onsuccess = () => resolve(request.result);
    });
    db.close();
    return rows[0];
  });
  await remove(page);
  const other = await context.newPage();
  await open(other);
  await other.evaluate(async (record) => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open("jot-and-tittle");
      request.onsuccess = () => resolve(request.result);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction("readings", "readwrite");
      tx.objectStore("readings").put({
        ...record,
        notes: "concurrent winner",
        updatedAt: "2026-10-05T12:01:00.000Z",
      });
      tx.oncomplete = () => resolve();
    });
    db.close();
  }, original);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("same ID");
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toContainText("concurrent winner");
});
