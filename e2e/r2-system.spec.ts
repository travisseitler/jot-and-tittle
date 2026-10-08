import {
  test,
  expect,
  open,
  log,
  history,
  data,
  readingAction,
  createJournal,
  clear,
} from "./helpers";

test("a draft from a removed journal can be saved as a new reading in an active journal", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", { value: undefined }),
  );
  await open(page);
  await createJournal(page, "Temporary study");
  await log(page, "John 3:16", "Original study notes");
  await history(page);
  await readingAction(page, "Edit John 3:16");
  await page.getByLabel("Notes").fill("Draft survives removed journal");
  const other = await context.newPage();
  await other.clock.setFixedTime(new Date("2026-10-05T12:01:00Z"));
  await open(other);
  await data(other);
  await clear(other);
  await other
    .getByRole("button", { name: "Manage journals", exact: true })
    .click();
  await other
    .getByRole("button", { name: "Delete Temporary study", exact: true })
    .click();
  await other
    .getByRole("button", {
      name: "Permanently delete empty journal",
      exact: true,
    })
    .click();
  await expect(other.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const conflict = page.getByRole("dialog", {
    name: "Recording journal unavailable",
  });
  await expect(conflict).toContainText("Draft survives removed journal");
  const recovery = conflict.getByRole("button", {
    name: "Save as new reading",
    exact: true,
  });
  await expect(recovery).toBeDisabled();
  await conflict
    .getByLabel("Save new reading in")
    .selectOption({ label: "Journal" });
  await expect(recovery).toBeEnabled();
  await page.clock.setFixedTime(new Date("2026-10-05T12:02:00Z"));
  await recovery.click();
  await expect(conflict).toHaveCount(0);
  await expect(page.locator(".capture-card")).toHaveCount(0);
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText(
    "Draft survives removed journal",
  );
  await expect(
    page
      .getByLabel("Current journal")
      .locator("option")
      .filter({ hasText: "Temporary study" }),
  ).toHaveCount(0);
  await data(page);
  await expect(
    page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: "Trash" }) }),
  ).toContainText("Original study notes");
});

test("capture retains a cancelled draft and invalid submission focuses the responsible field", async ({
  page,
}) => {
  await open(page);
  const logging = page
    .locator("header")
    .getByRole("button", { name: "Log a reading", exact: true });
  await logging.click();
  const card = page.locator(".capture-card");
  await card.getByLabel("Passage or passages").fill("John 3:99");
  await card.getByLabel("Notes").fill("First paragraph\n\nKeep this draft.");
  await card.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(card.getByLabel("Passage or passages")).toBeFocused();
  await expect(card.getByLabel("Passage or passages")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await card.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(card).toHaveCount(0);
  await expect(logging).toBeFocused();
  await logging.click();
  await expect(card.getByLabel("Passage or passages")).toHaveValue("John 3:99");
  await expect(card.getByLabel("Notes")).toHaveValue(
    "First paragraph\n\nKeep this draft.",
  );
  await card.getByLabel("Passage or passages").fill("John 3:16");
  await card.getByLabel("Reading date").fill("2026-10-06");
  await card.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(card.getByLabel("Reading date")).toBeFocused();
  await expect(card.getByLabel("Reading date")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await card.getByLabel("Reading date").fill("2026-10-05");
  await card.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(card).toHaveCount(0);
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText("John 3:16");
});

test("a local write failure preserves the entire capture and retry saves once", async ({
  page,
}) => {
  await open(page);
  await page
    .locator("header")
    .getByRole("button", { name: "Log a reading", exact: true })
    .click();
  const card = page.locator(".capture-card");
  await card.getByLabel("Passage or passages").fill("Psalm 23");
  await card.getByLabel("Notes").fill("Retained after storage failure");
  // A one-shot storage failure exercises the real recovery path without damaging data.
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      ...args: Parameters<IDBObjectStore["put"]>
    ) {
      if (this.name === "readings") {
        IDBObjectStore.prototype.put = original;
        throw new DOMException("Simulated full storage", "QuotaExceededError");
      }
      return original.apply(this, args);
    };
  });
  await card.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(card.getByRole("alert")).toContainText("could not be saved");
  await expect(card.getByLabel("Passage or passages")).toHaveValue("Psalm 23");
  await expect(card.getByLabel("Notes")).toHaveValue(
    "Retained after storage failure",
  );
  await expect(
    card.getByRole("button", { name: "Save reading", exact: true }),
  ).toBeEnabled();
  await card.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(card).toHaveCount(0);
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText(
    "Retained after storage failure",
  );
});

test("malformed imports explain failure and preserve existing history", async ({
  page,
}) => {
  await open(page);
  await log(page, "Genesis 1:1", "Existing history");
  await data(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "malformed.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":'),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Review your import" }),
  ).toHaveCount(0);
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText("Existing history");
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
});

test("journal rename conflicts retain the intended name and recheck a newer revision", async ({
  page,
  context,
}) => {
  // Transactional protection must work even if live notifications are unavailable.
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", { value: undefined }),
  );
  await open(page);
  await page
    .getByRole("button", { name: "Manage journals", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rename Journal", exact: true })
    .click();
  await page
    .getByLabel("Journal name", { exact: true })
    .fill("My intended name");
  const other = await context.newPage();
  await other.clock.setFixedTime(new Date("2026-10-05T12:01:00Z"));
  await open(other);
  await other
    .getByRole("button", { name: "Manage journals", exact: true })
    .click();
  await other
    .getByRole("button", { name: "Rename Journal", exact: true })
    .click();
  await other.getByLabel("Journal name", { exact: true }).fill("Remote name");
  await other.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(other.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  const editor = page.getByRole("dialog", {
    name: "Rename journal",
    exact: true,
  });
  await expect(editor).toContainText("Journal saved in another tab");
  await expect(editor).toContainText("Remote name");
  await expect(editor.getByLabel("Journal name", { exact: true })).toHaveValue(
    "My intended name",
  );
  await expect(
    page.getByRole("dialog", { name: "This reading changed elsewhere" }),
  ).toHaveCount(0);
  // A second revision must not be overwritten through the first comparison.
  await other.clock.setFixedTime(new Date("2026-10-05T12:02:00Z"));
  await other
    .getByRole("button", { name: "Manage journals", exact: true })
    .click();
  await other
    .getByRole("button", { name: "Rename Remote name", exact: true })
    .click();
  await other
    .getByLabel("Journal name", { exact: true })
    .fill("Latest remote name");
  await other.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(other.getByRole("dialog")).toHaveCount(0);
  await editor
    .getByRole("button", { name: "Keep my intended name", exact: true })
    .click();
  await expect(editor).toContainText("The journal changed again");
  await expect(editor).toContainText("Latest remote name");
  await expect(
    editor.getByRole("button", { name: "Save name", exact: true }),
  ).toBeDisabled();
  await editor
    .getByRole("button", { name: "Keep my intended name", exact: true })
    .click();
  await expect(
    editor.getByRole("button", { name: "Save name", exact: true }),
  ).toBeEnabled();
  await editor.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByLabel("Current journal").locator("option:checked"),
  ).toHaveText("My intended name");
});

test("Keep mine after a live reading conflict saves the complete visible draft", async ({
  page,
  context,
}) => {
  await open(page);
  await log(page, "Genesis 1:1", "Original notes");
  await history(page);
  await page.clock.setFixedTime(new Date("2026-10-05T12:00:01Z"));
  await readingAction(page, "Edit Genesis 1:1");
  await page.getByLabel("Passage or passages").fill("John 3:16");
  await page.getByLabel("Reading date").fill("2026-10-04");
  await page.getByLabel("Notes").fill("My unsaved notes");
  const other = await context.newPage();
  await other.clock.setFixedTime(new Date("2026-10-05T12:01:00Z"));
  await open(other);
  await history(other);
  await readingAction(other, "Edit Genesis 1:1");
  await other.getByLabel("Notes").fill("Remote notes");
  await other
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(other.locator(".capture-card")).toHaveCount(0);
  const conflict = page.getByRole("dialog", {
    name: "This reading changed elsewhere",
  });
  await expect(conflict).toContainText("Remote notes");
  await expect(conflict).toContainText("My unsaved notes");
  await page.clock.setFixedTime(new Date("2026-10-05T12:02:00Z"));
  await conflict
    .getByRole("button", { name: "Keep mine", exact: true })
    .click();
  await expect(conflict).toHaveCount(0);
  await expect(page.locator(".capture-card")).toHaveCount(0);
  await page.reload();
  await history(page);
  const row = page.locator(".history-row");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("John 3:16");
  await expect(row).toContainText("My unsaved notes");
  await expect(row).toContainText("Oct 4");
  await expect(row).not.toContainText("Original notes");
  await expect(row).not.toContainText("Remote notes");
});

test("reopening a cancelled edit retains its original revision and detects remote changes", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    Object.defineProperty(window, "BroadcastChannel", { value: undefined }),
  );
  await open(page);
  await log(page, "Genesis 1:1", "Original notes");
  await history(page);
  await readingAction(page, "Edit Genesis 1:1");
  await page.getByLabel("Passage or passages").fill("Psalm 23");
  await page.getByLabel("Notes").fill("Retained local draft");
  await page
    .locator(".capture-card")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  const other = await context.newPage();
  await other.clock.setFixedTime(new Date("2026-10-05T12:01:00Z"));
  await open(other);
  await history(other);
  await readingAction(other, "Edit Genesis 1:1");
  await other.getByLabel("Notes").fill("Changed while draft was cancelled");
  await other
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(other.locator(".capture-card")).toHaveCount(0);
  // Switching journals reloads current history while keeping session drafts.
  await page
    .getByRole("button", { name: "Manage journals", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create a journal", exact: true })
    .click();
  await page
    .getByLabel("Journal name", { exact: true })
    .fill("Refresh journal");
  await page
    .getByRole("button", { name: "Create journal", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Current journal").selectOption({ label: "Journal" });
  await expect(page.locator(".history-row")).toContainText(
    "Changed while draft was cancelled",
  );
  await readingAction(page, "Edit Genesis 1:1");
  await expect(page.getByLabel("Passage or passages")).toHaveValue("Psalm 23");
  await expect(page.getByLabel("Notes")).toHaveValue("Retained local draft");
  await page.clock.setFixedTime(new Date("2026-10-05T12:02:00Z"));
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const conflict = page.getByRole("dialog", {
    name: "This reading changed elsewhere",
  });
  await expect(conflict).toContainText("Changed while draft was cancelled");
  await expect(conflict).toContainText("Retained local draft");
  await conflict
    .getByRole("button", { name: "Keep mine", exact: true })
    .click();
  await expect(conflict).toHaveCount(0);
  await expect(page.locator(".capture-card")).toHaveCount(0);
  await page.reload();
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText("Psalms 23");
  await expect(page.locator(".history-row")).toContainText(
    "Retained local draft",
  );
});
