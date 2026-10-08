import { test, expect, open, history } from "./helpers";
test("comma preview counts unique verses and invalid shorthand cannot partially save", async ({
  page,
}) => {
  await open(page);
  await page
    .locator("header")
    .getByRole("button", { name: "Log a reading", exact: true })
    .click();
  await page.getByLabel("Passage or passages").fill("John 3:16, 18–21, 19");
  await expect(page.locator(".parse-preview")).toContainText(
    "5 unique verses recognized",
  );
  await expect(page.locator(".parse-preview")).toContainText("John 3:18–21");
  await page.getByLabel("Notes").fill("Keep this draft");
  await page.getByLabel("Passage or passages").fill("John 3:16, 4:1–3, 99");
  await expect(
    page.getByRole("button", { name: "Save reading", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(page.getByLabel("Passage or passages")).toBeFocused();
  await expect(page.getByLabel("Passage or passages")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator(".capture-card")).toBeVisible();
  await expect(page.locator(".parse-preview")).toContainText(
    "John 4 has 54 verses",
  );
  await expect(page.getByLabel("Notes")).toHaveValue("Keep this draft");
  await page.getByLabel("Passage or passages").fill("John 3:16, 4:1–3, 5");
  await expect(page.locator(".parse-preview")).toContainText("John 4:5");
  await expect(page.locator(".parse-preview")).toContainText(
    "5 unique verses recognized",
  );
  await page.getByRole("button", { name: "Save reading", exact: true }).click();
  await expect(page.locator(".capture-card")).toHaveCount(0);
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText("Keep this draft");
});
