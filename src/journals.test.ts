import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { parsePassage, deriveStats, serialize } from "./domain";
import {
  DEFAULT_JOURNAL_ID,
  defaultJournal,
  journalReadings,
  validateJournalName,
  serializeJournals,
  deserializeJournals,
  mergeJournalImport,
  describeConflict,
  readingChanged,
  type Journal,
  type JournalReading,
  type JournalState,
} from "./journals";
import { ConflictError, repository } from "./storage";
const timestamp = "2026-10-04T12:00:00.000Z";
const reading = (
  id = "one",
  overrides: Partial<JournalReading> = {},
): JournalReading => ({
  id,
  startedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  originalInput: "Romans 8:1-17",
  notes: "Original notes",
  ranges: parsePassage("Romans 8:1-17"),
  journalId: DEFAULT_JOURNAL_ID,
  ...overrides,
});
const journal = (id: string, name: string): Journal => ({
  id,
  name,
  createdAt: timestamp,
  updatedAt: timestamp,
});
const basic = (): JournalState => ({
  journals: [defaultJournal(timestamp), journal("sermons", "Sermons")],
  readings: [reading(), reading("two", { journalId: "sermons" })],
  activeJournalId: "sermons",
});

test("journal names are trimmed, case-insensitively unique, and bounded", () => {
  assert.equal(
    validateJournalName("  Small Group  ", basic().journals),
    "Small Group",
  );
  assert.throws(() => validateJournalName("sermons", basic().journals));
  assert.throws(() => validateJournalName(" ", []));
  assert.throws(() => validateJournalName("a".repeat(61), []));
  assert.equal(
    validateJournalName("Sermons", basic().journals, "sermons"),
    "Sermons",
  );
});
test("verse statistics are isolated per journal even for identical passages", () => {
  const state = basic();
  const verse = state.readings[0].ranges[0].start;
  assert.equal(
    deriveStats(journalReadings(state.readings, DEFAULT_JOURNAL_ID))[verse]
      .count,
    1,
  );
  assert.equal(
    deriveStats(journalReadings(state.readings, "sermons"))[verse].count,
    1,
  );
  assert.equal(
    deriveStats(journalReadings(state.readings, "empty"))[verse].count,
    0,
  );
  assert.equal(deriveStats(state.readings)[verse].count, 2);
});
test("journal exports round-trip all readings and empty journals", () => {
  const state = basic();
  state.journals.push(journal("empty", "Memorization"));
  const restored = deserializeJournals(
    JSON.parse(
      JSON.stringify(serializeJournals(state.journals, state.readings)),
    ),
  );
  assert.deepEqual(restored.journals, state.journals);
  assert.deepEqual(restored.readings, state.readings);
  assert.equal(restored.legacy, false);
});
test("legacy backups import into the default journal", () => {
  const legacy = deserializeJournals(serialize([reading()]));
  assert.equal(legacy.legacy, true);
  assert.equal(legacy.journals[0].name, "Journal");
  assert.equal(legacy.readings[0].journalId, DEFAULT_JOURNAL_ID);
  assert.deepEqual(
    { ...legacy.readings[0], journalId: undefined },
    { ...reading(), journalId: undefined },
  );
});
test("imports preserve existing IDs and keep differently identified same-name journals separate", () => {
  const state = basic();
  const incoming = {
    legacy: false,
    journals: [journal("incoming", "Sermons"), defaultJournal(timestamp)],
    readings: [
      { ...reading("three"), journalId: "incoming" },
      { ...reading("one"), journalId: DEFAULT_JOURNAL_ID },
    ],
  };
  const merged = mergeJournalImport(state, incoming);
  assert.equal(merged.addedReadings, 1);
  assert.equal(merged.duplicates, 1);
  assert.equal(merged.addedJournals, 1);
  assert.equal(merged.state.journals.at(-1)?.name, "Sermons (imported)");
  assert.equal(merged.state.readings.at(-1)?.journalId, "incoming");
  assert.equal(merged.state.activeJournalId, "sermons");
  assert.deepEqual(merged.state.readings[0], state.readings[0]);
  const again = mergeJournalImport(merged.state, incoming);
  assert.equal(again.addedReadings, 0);
  assert.equal(again.addedJournals, 0);
});
test("imports reject orphan readings, duplicate journal IDs, and malformed journals", () => {
  const x = serializeJournals(basic().journals, basic().readings);
  assert.throws(() =>
    deserializeJournals({
      ...x,
      readings: x.readings.map((r) => ({ ...r, journalId: "missing" })),
    }),
  );
  assert.throws(() =>
    deserializeJournals({ ...x, journals: [x.journals[0], x.journals[0]] }),
  );
  assert.throws(() =>
    deserializeJournals({
      ...x,
      journals: x.journals.map((j) => ({ ...j, createdAt: "bad" })),
    }),
  );
  assert.throws(() => deserializeJournals({ ...x, journals: [] }));
});
test("describeConflict and readingChanged explain concurrent edits", () => {
  assert.match(describeConflict("reading-updated"), /updated/);
  assert.match(describeConflict("reading-deleted"), /deleted/);
  assert.match(describeConflict("journal-missing"), /journal/);
  assert.equal(readingChanged(reading(), reading()), false);
  assert.equal(
    readingChanged(
      reading(),
      reading("one", { updatedAt: "2026-10-05T00:00:00.000Z" }),
    ),
    true,
  );
  assert.equal(readingChanged(reading(), null), true);
});

test("IndexedDB v1 upgrade preserves history; journals, selection, edits, and reset persist independently", async () => {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open("jot-and-tittle", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("readings", { keyPath: "id" });
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("readings", "readwrite");
      tx.objectStore("readings").put({ ...reading(), journalId: undefined });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    };
    req.onerror = () => reject(req.error);
  });
  const migrated = await repository.load();
  assert.equal(migrated.journals[0].name, "Journal");
  assert.equal(migrated.activeJournalId, DEFAULT_JOURNAL_ID);
  assert.deepEqual(migrated.readings, [
    { ...reading(), journalId: DEFAULT_JOURNAL_ID },
  ]);
  await repository.putJournal(journal("sermons", "Sermons"), null);
  await repository.putJournal(journal("empty", "Small Group"), null);
  await repository.putReading(reading("two", { journalId: "sermons" }), null);
  await repository.selectJournal("sermons");
  let restored = await repository.load();
  assert.equal(restored.activeJournalId, "sermons");
  assert.equal(restored.journals.length, 3);
  assert.equal(restored.readings.length, 2);
  await repository.selectJournal("empty");
  restored = await repository.load();
  assert.equal(restored.activeJournalId, "empty");
  assert.equal(restored.readings.length, 2);
  await assert.rejects(repository.selectJournal("missing"));
  assert.equal((await repository.load()).activeJournalId, "empty");
  const edited = reading("two", {
    journalId: "sermons",
    notes: "Edited sermon",
    updatedAt: "2026-10-04T13:00:00.000Z",
  });
  await repository.putReading(edited, timestamp);
  assert.equal(
    (await repository.load()).readings.find((r) => r.id === "one")?.notes,
    "Original notes",
  );
  assert.equal(
    (await repository.load()).readings.find((r) => r.id === "two")?.notes,
    "Edited sermon",
  );
  restored = await repository.resetJournal("sermons", ["two"]);
  assert.equal(restored.readings.length, 1);
  assert.equal(restored.readings[0].journalId, DEFAULT_JOURNAL_ID);
  assert.equal(restored.journals.length, 3);
  await assert.rejects(
    repository.putReading(reading("bad", { journalId: "missing" }), null),
    (e) => e instanceof ConflictError && e.kind === "journal-missing",
  );
  assert.deepEqual((await repository.load()).readings, restored.readings);
});

test("concurrent additions keep both readings", async () => {
  const a = reading("concurrent-a", {
    originalInput: "John 1:1",
    ranges: parsePassage("John 1:1"),
  });
  const b = reading("concurrent-b", {
    originalInput: "John 1:2",
    ranges: parsePassage("John 1:2"),
  });
  await Promise.all([
    repository.putReading(a, null),
    repository.putReading(b, null),
  ]);
  const ids = (await repository.load()).readings.map((r) => r.id);
  assert.ok(ids.includes("concurrent-a"));
  assert.ok(ids.includes("concurrent-b"));
});

test("journal create and delete remove only that journal’s readings", async () => {
  const created = await repository.putJournal(
    journal("temp", "Temporary"),
    null,
  );
  assert.ok(created.journals.some((j) => j.id === "temp"));
  await repository.putReading(
    reading("temp-reading", { journalId: "temp" }),
    null,
  );
  const afterDelete = await repository.deleteJournal("temp");
  assert.equal(
    afterDelete.journals.some((j) => j.id === "temp"),
    false,
  );
  assert.equal(
    afterDelete.readings.some((r) => r.id === "temp-reading"),
    false,
  );
  assert.ok(afterDelete.readings.some((r) => r.id === "one"));
});

test("conflicting edits reject the stale write", async () => {
  const first = reading("conflict-edit", {
    notes: "first",
    updatedAt: timestamp,
  });
  await repository.putReading(first, null);
  const winner = {
    ...first,
    notes: "winner",
    updatedAt: "2026-10-04T14:00:00.000Z",
  };
  await repository.putReading(winner, timestamp);
  await assert.rejects(
    repository.putReading(
      { ...first, notes: "stale", updatedAt: "2026-10-04T15:00:00.000Z" },
      timestamp,
    ),
    (e) => e instanceof ConflictError && e.kind === "reading-updated",
  );
  assert.equal(
    (await repository.load()).readings.find((r) => r.id === "conflict-edit")
      ?.notes,
    "winner",
  );
});

test("edit-versus-delete conflicts never recreate or silently drop drafts", async () => {
  const target = reading("edit-delete", { notes: "alive" });
  await repository.putReading(target, null);
  await repository.deleteReading("edit-delete", timestamp);
  await assert.rejects(
    repository.putReading(
      { ...target, notes: "zombie", updatedAt: "2026-10-04T16:00:00.000Z" },
      timestamp,
    ),
    (e) => e instanceof ConflictError && e.kind === "reading-deleted",
  );
  assert.equal(
    (await repository.load()).readings.some((r) => r.id === "edit-delete"),
    false,
  );
  await repository.putReading(
    reading("edit-delete-2", { notes: "alive" }),
    null,
  );
  await repository.putReading(
    {
      ...reading("edit-delete-2"),
      notes: "updated",
      updatedAt: "2026-10-04T17:00:00.000Z",
    },
    timestamp,
  );
  await assert.rejects(
    repository.deleteReading("edit-delete-2", timestamp),
    (e) => e instanceof ConflictError && e.kind === "reading-updated",
  );
  assert.equal(
    (await repository.load()).readings.find((r) => r.id === "edit-delete-2")
      ?.notes,
    "updated",
  );
});

test("concurrent reset preserves readings added after confirmation snapshot", async () => {
  await repository.putReading(reading("reset-old", { notes: "old" }), null);
  const newer = reading("reset-new", {
    notes: "new",
    updatedAt: "2026-10-04T18:00:00.000Z",
  });
  await repository.putReading(newer, null);
  const state = await repository.resetJournal(DEFAULT_JOURNAL_ID, [
    "reset-old",
  ]);
  assert.equal(
    state.readings.some((r) => r.id === "reset-old"),
    false,
  );
  assert.ok(state.readings.some((r) => r.id === "reset-new"));
});

test("import merge preserves unrelated concurrent readings", async () => {
  await repository.putReading(
    reading("live-reading", {
      originalInput: "Psalm 1",
      ranges: parsePassage("Psalm 1"),
    }),
    null,
  );
  const incoming = {
    legacy: false as const,
    journals: [journal("imported-j", "Imported")],
    readings: [
      reading("imported-reading", {
        journalId: "imported-j",
        originalInput: "Psalm 23",
        ranges: parsePassage("Psalm 23"),
      }),
    ],
  };
  const result = await repository.mergeImport(incoming);
  assert.equal(result.addedReadings, 1);
  assert.equal(result.addedJournals, 1);
  assert.ok(result.state.readings.some((r) => r.id === "live-reading"));
  assert.ok(result.state.readings.some((r) => r.id === "imported-reading"));
});

test("creating a reading for a missing journal is rejected", async () => {
  await assert.rejects(
    repository.putReading(reading("orphan", { journalId: "gone" }), null),
    (e) => e instanceof ConflictError && e.kind === "journal-missing",
  );
  assert.equal(
    (await repository.load()).readings.some((r) => r.id === "orphan"),
    false,
  );
});

test("Undo restores exact deleted records and timestamps, with distinct consecutive opportunities", async () => {
  const a = {
    ...reading("undo-a"),
    provenance: { source: "import", originalId: "source-record" },
  };
  const b = reading("undo-b");
  await repository.putReading(a, null);
  await repository.putReading(b, null);
  const first = await repository.deleteReading(a.id, a.updatedAt);
  const second = await repository.deleteReading(b.id, b.updatedAt);
  assert.notEqual(first.undo.id, second.undo.id);
  await repository.putReading(reading("undo-new"), null);
  await repository.undo(first.undo.id);
  const restored = await repository.undo(second.undo.id);
  assert.deepEqual(
    restored.readings.find((r) => r.id === a.id),
    a,
  );
  assert.deepEqual(
    restored.readings.find((r) => r.id === b.id),
    b,
  );
  assert.ok(restored.readings.some((r) => r.id === "undo-new"));
  assert.equal(
    deriveStats(restored.readings.filter((r) => [a.id, b.id].includes(r.id)))[
      a.ranges[0].start
    ].count,
    2,
  );
  await assert.rejects(repository.undo(first.undo.id), /expired/);
});

test("clear Undo captures the latest stored complete set and preserves later additions", async () => {
  await repository.putJournal(journal("undo-clear", "Undo clear"), null);
  const a = reading("undo-clear-a", { journalId: "undo-clear" });
  const b = reading("undo-clear-b", { journalId: "undo-clear" });
  await repository.putReading(a, null);
  await repository.putReading(b, null);
  const changed = {
    ...a,
    notes: "concurrent edit",
    updatedAt: "2026-10-05T12:00:00.000Z",
  };
  await repository.putReading(changed, a.updatedAt);
  const cleared = await repository.resetJournal("undo-clear", [a.id, b.id]);
  assert.equal(cleared.undo.count, 2);
  await repository.putReading(
    reading("undo-clear-new", { journalId: "undo-clear" }),
    null,
  );
  const restored = await repository.undo(cleared.undo.id);
  assert.deepEqual(
    restored.readings.find((r) => r.id === a.id),
    changed,
  );
  assert.deepEqual(
    restored.readings.find((r) => r.id === b.id),
    b,
  );
  assert.ok(restored.readings.some((r) => r.id === "undo-clear-new"));
});

test("Undo expiry is enforced by storage, even without UI timer delivery", async (t) => {
  await repository.putReading(reading("undo-expiry"), null);
  const deleted = await repository.deleteReading("undo-expiry", timestamp);
  t.mock.method(Date, "now", () => deleted.undo.expiresAt);
  await assert.rejects(repository.undo(deleted.undo.id), /expired/);
  assert.equal(
    (await repository.load()).readings.some((r) => r.id === "undo-expiry"),
    false,
  );
});

test("Undo fails atomically for a missing journal or concurrently reused ID", async () => {
  await repository.putJournal(journal("undo-gone", "Undo gone"), null);
  await repository.putReading(
    reading("undo-orphan", { journalId: "undo-gone" }),
    null,
  );
  const deleted = await repository.deleteReading("undo-orphan", timestamp);
  await repository.deleteJournal("undo-gone");
  await assert.rejects(
    repository.undo(deleted.undo.id),
    /original journal no longer exists/,
  );
  await repository.putReading(reading("undo-collision-a"), null);
  await repository.putReading(reading("undo-collision-b"), null);
  const cleared = await repository.resetJournal(DEFAULT_JOURNAL_ID, [
    "undo-collision-a",
    "undo-collision-b",
  ]);
  const winner = reading("undo-collision-b", {
    notes: "another tab's new record",
  });
  await repository.putReading(winner, null);
  await assert.rejects(repository.undo(cleared.undo.id), /same ID/);
  const state = await repository.load();
  assert.equal(
    state.readings.some((r) => r.id === "undo-collision-a"),
    false,
  );
  assert.deepEqual(
    state.readings.find((r) => r.id === winner.id),
    winner,
  );
});
