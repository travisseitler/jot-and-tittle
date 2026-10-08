import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./pages-tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "pages-test-report", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4174/jot-and-tittle/app/",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "node scripts/serve-pages.mjs",
    url: "http://127.0.0.1:4174/jot-and-tittle/app/",
    reuseExistingServer: false,
  },
});
