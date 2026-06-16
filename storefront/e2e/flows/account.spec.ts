import { expect, Page, test } from "@playwright/test"
import { LoginPage } from "../fixtures/account/login-page"
import { RegisterPage } from "../fixtures/account/register-page"
import { OverviewPage } from "../fixtures/account/overview-page"

/**
 * Auth flows (v2). Self-contained: each test registers its own customer through
 * the storefront UI (no admin seeder), so they run against the ephemeral CI DB.
 *
 * The storefront's signup/login are server actions that set the auth cookie +
 * revalidate but don't switch the view in place, so after submitting we load
 * /account (retrying to absorb the async action) to assert the session.
 */

const REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "dk"
const PASSWORD = "supersecret123"

// Unique per attempt so retries / reruns never collide in the shared CI DB.
function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
}

async function expectLoggedIn(page: Page) {
  const overview = new OverviewPage(page)
  await expect(async () => {
    await page.goto(`/${REGION}/account`)
    await expect(overview.welcomeMessage).toBeVisible({ timeout: 5_000 })
  }).toPass({ timeout: 45_000 })
}

async function register(page: Page, email: string) {
  const login = new LoginPage(page)
  const reg = new RegisterPage(page)

  await login.goto()
  await login.registerButton.click()
  await reg.container.waitFor({ state: "visible" })
  await reg.firstNameInput.fill("Test")
  await reg.lastNameInput.fill("User")
  await reg.emailInput.fill(email)
  await reg.phoneInput.fill("+351912345678")
  await reg.passwordInput.fill(PASSWORD)
  await reg.registerButton.click()

  const errored = await reg.registerError
    .waitFor({ state: "visible", timeout: 8_000 })
    .then(() => true)
    .catch(() => false)
  if (errored) {
    throw new Error(`signup error: ${await reg.registerError.textContent()}`)
  }
  await expectLoggedIn(page)
}

test("register a new customer reaches the account overview", async ({
  page,
}) => {
  await register(page, uniqueEmail())
})

test("a registered customer can log out and log back in", async ({ page }) => {
  const email = uniqueEmail()
  await register(page, email)

  await page.context().clearCookies()
  const login = new LoginPage(page)
  await login.goto()
  await login.emailInput.fill(email)
  await login.passwordInput.fill(PASSWORD)
  await login.signInButton.click()

  const errored = await login.errorMessage
    .waitFor({ state: "visible", timeout: 8_000 })
    .then(() => true)
    .catch(() => false)
  if (errored) {
    throw new Error(`login error: ${await login.errorMessage.textContent()}`)
  }
  await expectLoggedIn(page)
})

test("invalid credentials show an error", async ({ page }) => {
  const login = new LoginPage(page)
  await login.goto()
  await login.emailInput.fill(uniqueEmail()) // never registered
  await login.passwordInput.fill("wrong-password")
  await login.signInButton.click()
  await expect(login.errorMessage).toBeVisible({ timeout: 30_000 })
})
