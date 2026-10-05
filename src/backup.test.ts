import test from "node:test";
import assert from "node:assert/strict";
import "fake-indexeddb/auto";
import { repository } from "./storage";
import { deserializeJournals } from "./journals";
import { exportFingerprint } from "./backup";
import { parsePassage } from "./domain";

test("backup persists, tracks metadata and concurrent changes, and ignores failed exports", async () => {
  const initial = await repository.load();
  assert.equal(initial.backup, undefined);
  let json = "";
  const exported = await repository.exportAll((value) => {
    json = value;
  });
  assert.equal(exported.hasUnexportedChanges, false);
  assert.deepEqual((await repository.load()).backup, exported.backup);
  assert.equal(
    await exportFingerprint({
      ...initial,
      ...deserializeJournals(JSON.parse(json)),
    }),
    exported.backup?.fingerprint,
  );
  await assert.rejects(
    repository.exportAll(() => {
      throw new Error("Download failed");
    }),
  );
  assert.deepEqual((await repository.load()).backup, exported.backup);

  const original = initial.journals[0];
  await repository.putJournal(
    { ...original, name: "Renamed", updatedAt: new Date().toISOString() },
    original.updatedAt,
  );
  assert.equal((await repository.load()).hasUnexportedChanges, true);
  await repository.exportAll(() => {});
  let concurrent: Promise<unknown> | undefined;
  await repository.exportAll((value) => {
    assert.equal(JSON.parse(value).readings.length, 0);
    concurrent = repository.putReading(
      {
        id: "during-export",
        journalId: original.id,
        startedAt: original.createdAt,
        createdAt: original.createdAt,
        updatedAt: original.createdAt,
        originalInput: "John 1:1",
        notes: "",
        ranges: parsePassage("John 1:1"),
      },
      null,
    );
  });
  await concurrent;
  assert.equal((await repository.load()).hasUnexportedChanges, true);
  await repository.exportAll(() => {});
  const current = await repository.load();
  await repository.deleteReading(
    current.readings[0].id,
    current.readings[0].updatedAt,
  );
  assert.equal((await repository.load()).hasUnexportedChanges, true);

  // Invalid persisted data makes serialization fail before download initiation.
  await repository.putReading(
    { ...current.readings[0], ranges: [{ start: -1, end: -1 }] },
    null,
  );
  const beforeFailure = (await repository.load()).backup;
  let initiated = false;
  await assert.rejects(
    repository.exportAll(() => {
      initiated = true;
    }),
  );
  assert.equal(initiated, false);
  // Repair the malformed row and confirm the successful backup wasn't advanced.
  await repository.putReading(
    current.readings[0],
    current.readings[0].updatedAt,
  );
  assert.deepEqual((await repository.load()).backup, beforeFailure);
});

test("fingerprint includes all exportable fields but excludes selection and record order", async () => {
  const state = await repository.load();
  const fingerprint = await exportFingerprint(state);
  assert.equal(
    await exportFingerprint({
      ...state,
      activeJournalId: "different",
      journals: [...state.journals].reverse(),
      readings: [...state.readings].reverse(),
    }),
    fingerprint,
  );
  for (const patch of [
    { name: "Other" },
    { archived: true },
    { updatedAt: "2027-01-01T00:00:00.000Z" },
  ]) {
    assert.notEqual(
      await exportFingerprint({
        ...state,
        journals: state.journals.map((j) => ({ ...j, ...patch })),
      }),
      fingerprint,
    );
  }
  assert.notEqual(
    await exportFingerprint({
      ...state,
      readings: state.readings.map((r) => ({ ...r, journalId: "moved" })),
    }),
    fingerprint,
  );
});
