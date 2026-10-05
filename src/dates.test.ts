import test from "node:test";
import assert from "node:assert/strict";
import {
  bucket,
  compareReadingDates,
  deriveStats,
  formatReadingDate,
  metricColor,
  palette,
  parsePassage,
  readingDate,
  validCalendarDate,
  type Reading,
} from "./domain";
import {
  defaultJournal,
  deserializeJournals,
  serializeJournals,
  DEFAULT_JOURNAL_ID,
} from "./journals";
const row = (startedAt: string, datePrecision?: Reading["datePrecision"]) => ({
  id: "date",
  startedAt,
  datePrecision,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  originalInput: "Genesis 1:1",
  notes: "",
  ranges: parsePassage("Genesis 1:1"),
  journalId: DEFAULT_JOURNAL_ID,
});
test("date-only round trips and calendar boundaries are timezone independent", () => {
  const previous = process.env.TZ;
  try {
    for (const tz of [
      "UTC",
      "America/New_York",
      "Pacific/Kiritimati",
      "Pacific/Honolulu",
      "Pacific/Apia",
    ]) {
      process.env.TZ = tz;
      const r = row("2026-03-08", "date");
      assert.equal(readingDate(r.startedAt), "2026-03-08");
      assert.match(formatReadingDate(r.startedAt), /Mar 8, 2026/);
      assert.match(formatReadingDate("2011-12-30"), /Dec 30, 2011/);
      assert.deepEqual(
        deserializeJournals(
          JSON.parse(
            JSON.stringify(serializeJournals([defaultJournal()], [r])),
          ),
        ).readings,
        [r],
      );
      const now = new Date(2026, 2, 9, 0, 1).getTime();
      assert.equal(
        bucket({ count: 1, first: null, last: r.startedAt }, "recency", now),
        5,
      );
      assert.equal(
        bucket({ count: 1, first: null, last: "2026-03-09" }, "recency", now),
        6,
      );
      assert.equal(
        bucket({ count: 1, first: null, last: "2026-03-02" }, "recency", now),
        4,
      );
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
  assert.equal(validCalendarDate("2026-02-29"), false);
  assert.equal(validCalendarDate("2024-02-29"), true);
});
test("known instants and mixed ordering use current timezone and real elapsed time", () => {
  const previous = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    assert.equal(readingDate("2026-03-09T01:00:00Z"), "2026-03-08");
    assert.ok(compareReadingDates("2026-03-08", "2026-03-09T01:00:00Z") < 0);
    assert.ok(compareReadingDates("2026-03-09", "2026-03-09T01:00:00Z") > 0);
    const stats = deriveStats([
      row("2026-03-08", "date"),
      row("2026-03-09T01:00:00Z", "instant"),
    ])[0];
    assert.equal(stats.first, "2026-03-08");
    assert.equal(stats.last, "2026-03-09T01:00:00Z");
    assert.equal(
      bucket(stats, "recency", Date.parse("2026-03-10T01:00:00Z")),
      5,
    );
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
test("v1 and v2 migrate deterministically with exact recovery metadata; v3 validates precision", () => {
  const original = row("2026-01-02T00:30:00+14:00");
  const exported = serializeJournals([defaultJournal()], [original]);
  for (const version of [1, 2]) {
    const data = {
      ...exported,
      version,
      readings: [
        {
          ...exported.readings[0],
          startedAt: original.startedAt,
          datePrecision: undefined,
          legacyStartedAt: undefined,
        },
      ],
    };
    const migrated = deserializeJournals(data).readings[0];
    assert.equal(migrated.startedAt, "2026-01-01");
    // Import normalization must not erase the original offset representation.
    assert.equal(migrated.legacyStartedAt, original.startedAt);
    assert.equal(migrated.datePrecision, "date");
  }
  assert.throws(() =>
    deserializeJournals({
      ...exported,
      readings: [{ ...exported.readings[0], datePrecision: undefined }],
    }),
  );
  assert.throws(() =>
    deserializeJournals({
      ...exported,
      readings: [
        {
          ...exported.readings[0],
          datePrecision: "instant",
          startedAt: "2026-01-01T12:00:00",
        },
      ],
    }),
  );
});
test("future imports are retained and never colored fresh", () => {
  const r = row("2099-01-01", "date");
  const result = deserializeJournals(
    serializeJournals([defaultJournal()], [r]),
  );
  const stats = deriveStats(result.readings)[0];
  assert.equal(bucket(stats, "recency", Date.parse("2026-01-01T00:00:00Z")), 0);
  assert.equal(
    metricColor(stats, "combined", Date.parse("2026-01-01T00:00:00Z")),
    palette[0],
  );
  assert.equal(bucket(stats, "frequency"), 1);
});
