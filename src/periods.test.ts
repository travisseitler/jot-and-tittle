import test from "node:test";
import assert from "node:assert/strict";
import { periodBounds, inPeriod, nextCalendarRefresh } from "./periods";
import { type Reading } from "./domain";
const r = (startedAt: string) => ({ startedAt }) as Reading;
test("periods include calendar endpoints and retain explicit validation", () => {
  const bounds = periodBounds(
    "custom",
    "2026-10-05",
    "2026-09-01",
    "2026-09-30",
  );
  assert.ok(inPeriod(r("2026-09-01"), bounds));
  assert.ok(inPeriod(r("2026-09-30"), bounds));
  assert.ok(!inPeriod(r("2026-10-01"), bounds));
  assert.throws(
    () => periodBounds("custom", "2026-10-05", "2026-10-02", "2026-10-01"),
    /start date/,
  );
  assert.throws(
    () => periodBounds("custom", "2026-10-05", "2026-02-30", "2026-10-01"),
    /valid/,
  );
  assert.deepEqual(periodBounds("month", "2027-01-01", "", ""), {
    from: "2027-01-01",
    to: "2027-01-01",
  });
  assert.deepEqual(periodBounds("year", "2027-01-01", "", ""), {
    from: "2027-01-01",
    to: "2027-01-01",
  });
});
test("known-time filtering uses the browser timezone across daylight-saving boundaries", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    const bounds = { from: "2026-03-08", to: "2026-03-08" };
    assert.ok(inPeriod(r("2026-03-09T03:59:59Z"), bounds));
    assert.ok(!inPeriod(r("2026-03-09T04:00:00Z"), bounds));
    assert.equal(
      nextCalendarRefresh(Date.parse("2026-03-08T05:00:00Z")),
      23 * 3600000,
    );
    process.env.TZ = "UTC";
    assert.ok(!inPeriod(r("2026-03-09T03:59:59Z"), bounds));
    assert.ok(inPeriod(r("2026-03-08"), bounds));
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
