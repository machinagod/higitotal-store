import { test as setup } from "@playwright/test"
import fs from "fs"
import path from "path"

import { consentCookie } from "../consent"

const PROD_STATE = path.join(process.cwd(), "playwright/.auth/prod.json")

/**
 * Exchange the access token for the gate cookie and persist storage state.
 * Hitting any path with `?token=` makes the middleware set the httpOnly
 * `ht_access` cookie and redirect; storageState captures it. If no token is
 * configured (gate disabled), this still writes an empty state so the test
 * project can run.
 */
setup("authenticate via access token", async ({ page, context, baseURL }) => {
  fs.mkdirSync(path.dirname(PROD_STATE), { recursive: true })

  // Stored cookie choice (statistics refused): no banner over what the tests
  // click, and CI traffic never sets GA cookies.
  if (baseURL) {
    await context.addCookies([consentCookie(baseURL)])
  }

  const token = process.env.STOREFRONT_ACCESS_TOKEN
  if (token) {
    await page.goto(`/?token=${encodeURIComponent(token)}`)
    await page.waitForLoadState("domcontentloaded")
  }

  await context.storageState({ path: PROD_STATE })
})
