import { test, expect, open } from "./helpers";
import { readFileSync } from "node:fs";
const combinedPalette: string[][] = JSON.parse(
  readFileSync("audits/palette-reference.json", "utf8"),
).colors;
test("all palette buckets render at minimum and focused scales without losing metric fills", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const q = indexedDB.open("jot-and-tittle");
      q.onsuccess = () => resolve(q.result);
      q.onerror = () => reject(q.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("readings", "readwrite"),
        store = tx.objectStore("readings");
      const counts = [1, 2, 5, 10, 25, 50],
        days = [400, 120, 45, 14, 3, 0];
      for (let f = 0; f < 6; f++)
        for (let r = 0; r < 6; r++)
          for (let n = 0; n < counts[f]; n++) {
            const now = "2026-10-05T12:00:00Z";
            store.add({
              id: `palette-${f}-${r}-${n}`,
              journalId: "journal-default",
              createdAt: now,
              updatedAt: now,
              datePrecision: "instant",
              startedAt: new Date(
                Date.parse(now) - days[r] * 86400000,
              ).toISOString(),
              originalInput: "Reference palette",
              notes: "",
              ranges: [{ start: f * 6 + r, end: f * 6 + r }],
            });
          }
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Go to passage", exact: true })
    .click();
  await page.getByRole("button", { name: /Map display/ }).click();
  const canvas = page.getByRole("img", { name: /verse map/ });
  for (const stride of [4, 8, 14]) {
    if (stride > 4)
      await page.getByLabel("Focus on a passage").fill("Genesis 1:1–2:5");
    if (stride > 4)
      await page
        .getByRole("button", { name: "Focus passage", exact: true })
        .click();
    const before = stride === 4 ? 4 : stride === 8 ? 4 : 8;
    for (let current = before; current < stride; current += 2)
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    const colors = combinedPalette.flat();
    await expect
      .poll(() =>
        canvas.evaluate(
          (el: HTMLCanvasElement, { colors, stride }) => {
            const ctx = el.getContext("2d")!,
              scratch = document.createElement("canvas").getContext("2d")!,
              dpr = window.devicePixelRatio,
              columns = Math.floor(el.getBoundingClientRect().width / stride);
            return colors.every((color, id) => {
              scratch.fillStyle = color;
              scratch.fillRect(0, 0, 1, 1);
              const expected = Array.from(
                scratch.getImageData(0, 0, 1, 1).data,
              );
              const actual = Array.from(
                ctx.getImageData(
                  ((id % columns) * stride + 1) * dpr,
                  (Math.floor(id / columns) * stride + 1) * dpr,
                  1,
                  1,
                ).data,
              );
              return expected.every((v, i) => v === actual[i]);
            });
          },
          { colors, stride },
        ),
      )
      .toBe(true);
  }
  await page.getByText("Read the colors", { exact: true }).click();
  await expect(page.locator(".legend-panel")).toContainText("365+ d");
  await expect(page.locator(".legend-panel")).toContainText("1–6 d");
  await page.getByText("Read the colors", { exact: true }).click();
  const snapshot = await canvas.evaluate((el: HTMLCanvasElement) =>
    el.toDataURL(),
  );
  await canvas.hover({ position: { x: 2, y: 2 } });
  expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(
    snapshot,
  );
});
test("render simulation reference sheet", async ({ page }) => {
  await page.setContent(readFileSync("audits/palette-reference.svg", "utf8"));
  await page.setViewportSize({ width: 1080, height: 1260 });
  await page.screenshot({
    path: "/private/tmp/jot-palette.png",
    fullPage: true,
  });
});
