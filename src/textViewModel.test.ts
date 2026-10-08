import test from "node:test";
import assert from "node:assert/strict";
import {
  passageVerseIds,
  passagesInScope,
  passagesOutsideScope,
  textPage,
  textPageDestination,
} from "./textViewModel";

const scope = { start: 100, end: 124 };

test("page anchors stay in scope and retain inclusive partial tail pages", () => {
  assert.deepEqual(textPage(scope, 99, 12), {
    total: 25,
    page: 0,
    start: 100,
    end: 111,
    lastPage: 2,
  });
  assert.equal(textPage(scope, 111, 12).page, 0);
  assert.deepEqual(textPage(scope, 112, 12), {
    total: 25,
    page: 1,
    start: 112,
    end: 123,
    lastPage: 2,
  });
  assert.deepEqual(textPage(scope, 125, 12), {
    total: 25,
    page: 2,
    start: 124,
    end: 124,
    lastPage: 2,
  });
  assert.deepEqual(passageVerseIds([{ start: 124, end: 124 }]), [124]);
});

test("responsive pages retain the anchored verse while changing page bounds", () => {
  assert.deepEqual(textPage(scope, 117, 4), {
    total: 25,
    page: 4,
    start: 116,
    end: 119,
    lastPage: 6,
  });
  assert.equal(textPage(scope, 117, 12).start, 112);
  assert.deepEqual(textPageDestination(scope, -1, 4), {
    page: 0,
    anchor: 100,
  });
  assert.deepEqual(textPageDestination(scope, 99, 4), {
    page: 6,
    anchor: 124,
  });
  assert.deepEqual(textPageDestination(scope, 1, 12), {
    page: 1,
    anchor: 112,
  });
  assert.equal(textPage({ start: 9, end: 9 }, 0, 12).lastPage, 0);
});

test("Find keeps disjoint matches and duplicates in request order", () => {
  const requested = [
    { start: 122, end: 125 },
    { start: 99, end: 101 },
    { start: 110, end: 110 },
    { start: 110, end: 110 },
  ];
  const before = structuredClone(requested);
  const matched = passagesInScope(requested, scope);
  assert.deepEqual(matched, [
    { start: 122, end: 124 },
    { start: 100, end: 101 },
    { start: 110, end: 110 },
    { start: 110, end: 110 },
  ]);
  assert.deepEqual(
    passageVerseIds(matched),
    [122, 123, 124, 100, 101, 110, 110],
  );
  assert.equal(matched[0].start, 122);
  assert.deepEqual(passagesOutsideScope(requested, scope), [
    { start: 125, end: 125 },
    { start: 99, end: 99 },
  ]);
  assert.deepEqual(requested, before);
});

test("partial and wholly outside requests preserve distinct continuous omissions", () => {
  const requested = [
    { start: 90, end: 130 },
    { start: 80, end: 85 },
    { start: 140, end: 145 },
  ];
  assert.deepEqual(passagesInScope(requested, scope), [scope]);
  assert.deepEqual(passagesOutsideScope(requested, scope), [
    { start: 90, end: 99 },
    { start: 125, end: 130 },
    { start: 80, end: 85 },
    { start: 140, end: 145 },
  ]);
  assert.deepEqual(passagesInScope(requested.slice(1), scope), []);
  assert.equal(passagesInScope(requested.slice(1), scope)[0]?.start, undefined);
});

test("scope endpoints are matches while adjacent verses are omissions", () => {
  const requested = [
    { start: 99, end: 100 },
    { start: 124, end: 125 },
  ];
  assert.deepEqual(
    passageVerseIds(passagesInScope(requested, scope)),
    [100, 124],
  );
  assert.deepEqual(passagesOutsideScope(requested, scope), [
    { start: 99, end: 99 },
    { start: 125, end: 125 },
  ]);
  assert.deepEqual(passagesInScope([], scope), []);
  assert.deepEqual(passagesOutsideScope([], scope), []);
  assert.deepEqual(passageVerseIds([]), []);
});
