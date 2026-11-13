import { test as setup } from "@playwright/test"
import { seedData } from "../../data/seed"
import { OverviewPage as AccountOverviewPage } from "../../fixtures/account/overview-page"
import { LoginPage } from "../../fixtures/account/login-page"
import { STORAGE_STATE } from "../../../playwright.config"
import { consentCookie } from "../../consent"

setup(
  "Seed data and create session for authenticated user",
  async ({ page, baseURL }) => {
    // Stored cookie choice, saved into STORAGE_STATE with the session.
    if (baseURL) await page.context().addCookies([consentCookie(baseURL)])
    const seed = await seedData()
    const user = seed.user

    const loginPage = new LoginPage(page)
    const accountPage = new AccountOverviewPage(page)
    await loginPage.goto()
    await loginPage.emailInput.fill(user?.email!)
    await loginPage.passwordInput.fill(user?.password!)
    await loginPage.signInButton.click()
    await accountPage.welcomeMessage.waitFor({ state: "visible" })

    await page.context().storageState({
      path: STORAGE_STATE,
    })
  }
)
