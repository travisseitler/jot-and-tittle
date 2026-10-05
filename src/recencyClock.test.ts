import test from "node:test";
import assert from "node:assert/strict";
import {
  recencyRefreshDelay,
  recencySignature,
  clockContext,
} from "./recencyClock";
const stat = (last: string) => ({ last, first: last, count: 1 });
test("known-time bucket transitions schedule exact boundaries and frequency avoids recency work", () => {
  const start = Date.parse("2026-10-04T12:00:00Z"),
    now = start + 86400000 - 1000;
  assert.equal(
    recencyRefreshDelay([stat(new Date(start).toISOString())], now, "combined"),
    1000,
  );
  assert.notEqual(
    recencySignature([stat(new Date(start).toISOString())], now, "combined"),
    recencySignature(
      [stat(new Date(start).toISOString())],
      now + 1000,
      "combined",
    ),
  );
  assert.equal(
    recencyRefreshDelay(
      [stat(new Date(start).toISOString())],
      now,
      "frequency",
    ),
    3600000,
  );
  assert.equal(recencySignature([stat("invalid")], now, "frequency"), "");
});
test("date-only recency changes at local midnight and accounts for daylight saving", () => {
  const old = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    const now = Date.parse("2026-03-09T03:59:59Z");
    assert.equal(
      recencyRefreshDelay([stat("2026-03-08")], now, "recency"),
      1000,
    );
    assert.notEqual(
      recencySignature([stat("2026-03-08")], now, "recency"),
      recencySignature([stat("2026-03-08")], now + 1000, "recency"),
    );
    const context = clockContext(now);
    process.env.TZ = "UTC";
    assert.notEqual(clockContext(now), context);
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
});
