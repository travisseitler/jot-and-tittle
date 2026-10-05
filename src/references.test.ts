import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePassage,
  rangeCount,
  rangeLabel,
  deriveStats,
  type Reading,
} from "./domain";
const labels = (input: string) => parsePassage(input).map(rangeLabel);
test("comma shorthand switches explicitly between chapter and verse contexts", () => {
  assert.deepEqual(labels("John 3:16, 18–21"), ["John 3:16", "John 3:18–21"]);
  assert.deepEqual(labels("Psalm 23, John 10:1–18"), [
    "Psalms 23",
    "John 10:1–18",
  ]);
  assert.deepEqual(labels("John 3, 5"), ["John 3", "John 5"]);
  assert.deepEqual(labels("John 3:16, 4:1–3, 5"), [
    "John 3:16",
    "John 4:1–3",
    "John 4:5",
  ]);
  assert.deepEqual(labels("John 3:16, John 4, 5"), ["John 3:16", "John 4–5"]);
  assert.deepEqual(labels("John 3:16; 5"), ["John 3:16", "John 5"]);
});
test("ranges set comma context to their ending book and chapter", () => {
  assert.deepEqual(labels("John 3:36–4:3, 5"), ["John 3:36–4:3", "John 4:5"]);
  assert.deepEqual(labels("Genesis 50:26–Exodus 1:2, 4"), [
    "Genesis 50:26–Exodus 1:2",
    "Exodus 1:4",
  ]);
  assert.deepEqual(labels("1 John 1:1, 3, 2:1, 3"), [
    "1 John 1:1",
    "1 John 1:3",
    "1 John 2:1",
    "1 John 2:3",
  ]);
  assert.deepEqual(labels("1 John 1, 3"), ["1 John 1", "1 John 3"]);
});
test("whitespace and dash characters normalize and overlaps count once", () => {
  for (const dash of ["-", "–", "—", "−", "‑", "‒", "‐"])
    assert.equal(
      rangeCount(parsePassage(` 1 John 1 : 1 , 3 ${dash} 5 ; 1 : 4 `)),
      4,
    );
  const ranges = parsePassage("John 3:16, 16–21, 18–20; John 3:16");
  assert.equal(rangeCount(ranges), 6);
  const r = { id: "overlap", ranges, startedAt: "2026-10-05" } as Reading;
  assert.equal(deriveStats([r])[ranges[0].start].count, 1);
});
test("invalid inherited numbers and malformed or ambiguous shorthand reject the entire input", () => {
  assert.throws(
    () => parsePassage("John 3:16, 4:1–3, 99"),
    /John 4 has 54 verses/,
  );
  assert.throws(() => parsePassage("John, 3"), /ambiguous/);
  assert.throws(() => parsePassage("John 3:16, 18–"), /both sides/);
  assert.throws(() => parsePassage("John 3:16, 18,"), /comma/);
  for (const input of [
    "John 3:16,,18",
    "John 3:16,; John 4",
    "John 3,0",
    "John 3:16,0",
    "John 3:16,18-19-20",
    "3,5",
    "John 3:16,4:0",
    "John 3:16,4",
    "John 3:16;",
    "1 John 1:1, 6:1",
  ]) {
    if (input === "John 3:16,4") {
      assert.deepEqual(labels(input), ["John 3:4", "John 3:16"]);
      continue;
    }
    assert.throws(() => parsePassage(input), input);
  }
});
