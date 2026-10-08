import { test, expect, open, log } from "./helpers";
for (const instant of [false, true])
  test(`${instant ? "known-time" : "calendar"} recency redraws at a boundary without changing scope`, async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-10-05T23:59:50Z") });
    await open(page);
    await log(page);
    if (instant) {
      await page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const q = indexedDB.open("jot-and-tittle");
          q.onsuccess = () => resolve(q.result);
          q.onerror = () => reject(q.error);
        });
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction("readings", "readwrite"),
            store = tx.objectStore("readings"),
            q = store.getAll();
          q.onsuccess = () => {
            const r = q.result[0];
            store.put({
              ...r,
              startedAt: "2026-10-04T23:59:59Z",
              datePrecision: "instant",
            });
          };
          tx.oncomplete = () => resolve();
          tx.onabort = () => reject(tx.error);
        });
        db.close();
      });
      await page.reload();
    }
    await page
      .getByRole("button", { name: "Go to passage", exact: true })
      .click();
    await page.getByLabel("Focus on a passage").fill("Genesis 1:1–3");
    await page
      .getByRole("button", { name: "Focus passage", exact: true })
      .click();
    await page.clock.pauseAt(new Date("2026-10-05T23:59:58Z"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    const canvas = page.locator(".canvas-wrap canvas").first();
    const navigator = page.getByRole("group", { name: /verse map,/ });
    const pixel = () =>
      canvas.evaluate((el: HTMLCanvasElement) =>
        Array.from(
          el
            .getContext("2d")!
            .getImageData(
              window.devicePixelRatio,
              window.devicePixelRatio,
              1,
              1,
            ).data,
        ),
      );
    const before = await pixel();
    await page.clock.runFor(instant ? 1000 : 2000);
    await expect.poll(pixel).not.toEqual(before);
    await expect(navigator).toHaveAttribute("aria-label", /3 verses/);
    const after = await pixel();
    await page.clock.setSystemTime(new Date("2026-10-13T00:00:00Z"));
    await page.evaluate(() =>
      document.dispatchEvent(new Event("visibilitychange")),
    );
    await expect.poll(pixel).not.toEqual(after);
    await expect(page.getByLabel("Current journal")).toHaveValue(
      "journal-default",
    );
  });
