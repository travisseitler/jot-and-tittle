import { test as base, expect, type Page } from "@playwright/test";

export const NOW = new Date("2026-10-05T12:00:00Z");
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(NOW);
    await use(page);
  },
});
export { expect };

export async function open(page: Page) {
  await page.goto("/");
  await expect(
    page
      .locator("header")
      .getByRole("button", { name: "Log a reading", exact: true }),
  ).toBeEnabled();
}
export async function log(page: Page, passage = "Genesis 1:1", notes = "") {
  await page
    .locator("header")
    .getByRole("button", { name: "Log a reading", exact: true })
    .click();
  await page.getByLabel("Passage or passages").fill(passage);
  await page.getByLabel("Reading date").fill("2026-10-05");
  await page.getByLabel("Notes").fill(notes);
  await page.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
export async function history(page: Page) {
  await page
    .getByRole("button", { name: "Reading history", exact: true })
    .click();
}
export async function createJournal(page: Page, name: string) {
  await page
    .getByRole("button", { name: "Create a journal", exact: true })
    .click();
  await page.getByLabel("Journal name").fill(name);
  await page
    .getByRole("button", { name: "Create journal", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByLabel("Current journal").locator("option:checked"),
  ).toHaveText(name);
}
export async function data(page: Page) {
  await page.getByRole("button", { name: "Your data", exact: true }).click();
}
export async function clear(page: Page) {
  await page
    .getByRole("button", { name: "Clear journal readings", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Clear journal readings", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
