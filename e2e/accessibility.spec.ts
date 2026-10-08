import { openClear } from "./helpers";
import {
  test,
  expect,
  open,
  log,
  history,
  createJournal,
  data,
} from "./helpers";
test("text inspection exposes exact metrics and returns focus", async ({
  page,
}) => {
  await open(page);
  await log(page, "John 3:16");
  await page.getByLabel("Verse reference", { exact: true }).fill("John 3:16");
  const trigger = page.getByRole("button", {
    name: "Inspect verse",
    exact: true,
  });
  await trigger.focus();
  await trigger.press("Enter");
  const dialog = page.getByRole("complementary", {
    name: "John 3:16",
    exact: true,
  });
  await expect(dialog).toContainText("1 recorded readings");
  await expect(dialog).toContainText("Oct 5, 2026");
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
});
test("keyboard map navigation keeps the last verse visible", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Explore my empty map", exact: true })
    .click();
  await page.getByRole("button", { name: /Map display/ }).click();
  await page
    .getByRole("button", { name: "Increase cell size", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Increase cell size", exact: true })
    .click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const canvas = page.getByRole("group", { name: /verse map,/ });
  await canvas.focus();
  await canvas.press("Control+End");
  await expect(page.locator(".r2-map-preview")).toContainText(
    "Revelation 22:21",
  );
  await expect
    .poll(() => page.locator(".map-scroll").evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await canvas.press("Enter");
  await expect(
    page.getByRole("complementary", { name: "Revelation 22:21", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(canvas).toBeFocused();
});
test("new transfer and management dialogs close with Escape and restore their trigger", async ({
  page,
}) => {
  await open(page);
  await log(page);
  await createJournal(page, "Sermons");
  await page.getByLabel("Current journal").selectOption("journal-default");
  await history(page);
  const trigger = page.getByRole("button", {
    name: "Move Genesis 1:1",
    exact: true,
  });
  await page.locator(".reading-actions summary").click();
  await trigger.focus();
  await trigger.press("Enter");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await data(page);
  const manage = page.getByRole("button", {
    name: "Manage journals",
    exact: true,
  });
  await manage.focus();
  await manage.press("Enter");
  await page.keyboard.press("Escape");
  await expect(manage).toBeFocused();
});

test("clear confirmation names and empties the destination when another journal is viewed", async ({
  page,
}) => {
  await open(page);
  await log(page, "Genesis 1:1");
  await createJournal(page, "Sermons");
  await log(page, "John 3:16");
  await page
    .getByRole("button", { name: "View readings", exact: true })
    .click();
  await page.getByLabel("View journals").selectOption("selected");
  await page.getByRole("button", { name: "Apply view", exact: true }).click();
  await data(page);
  await openClear(page);
  const dialog = page.getByRole("dialog", {
    name: "Clear “Sermons”?",
    exact: true,
  });
  await expect(dialog).toContainText("The 1 readings present");
  await dialog
    .getByRole("button", { name: "Clear journal readings", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await history(page);
  await expect(page.locator(".history-row")).toHaveCount(1);
  await expect(page.locator(".history-row")).toContainText("Genesis 1:1");
  await page
    .getByRole("button", { name: "View readings", exact: true })
    .click();
  await page.getByLabel("View journals").selectOption("single");
  await page.getByRole("button", { name: "Apply view", exact: true }).click();
  await expect(page.locator(".history-row")).toHaveCount(0);
});
