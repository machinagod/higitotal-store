import { defineConfig, devices } from "@playwright/test"
import path from "path"
import "dotenv/config.js"

/**
 * Production e2e — runs AFTER a deploy, against the live Railway storefront. It
 * is strictly read-only (navigation + render assertions only; never creates
 * carts, accounts or orders) so it is safe against real production data.
 *
 * The site sits behind the pre-launch access-token gate, so a setup project
 * exchanges STOREFRONT_ACCESS_TOKEN for the `ht_access` cookie and saves the
 * storage state the test project reuses. There is no webServer — the target is
 * remote (NEXT_PUBLIC_BASE_URL).
 */
const PROD_STATE = path.join(__dirname, "playwright/.auth/prod.json")

export default defineConfig({
  testDir: "./e2e/prod",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
    trace: "retain-on-failure",
    userAgent:
      "Mozilla/5.0 (Higitotal-CI prod-e2e) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  },
  projects: [
    { name: "auth", testMatch: /global-setup\.ts/ },
    {
      name: "chromium",
      dependencies: ["auth"],
      testMatch: /.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: PROD_STATE },
    },
  ],
})
