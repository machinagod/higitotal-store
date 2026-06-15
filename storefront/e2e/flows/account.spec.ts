import { expect, Page, test } from "@playwright/test"
import { LoginPage } from "../fixtures/account/login-page"
import { RegisterPage } from "../fixtures/account/register-page"
import { OverviewPage } from "../fixtures/account/overview-page"

/**
 * Auth flows (v2). Self-contained: each test registers its own customer through
 * the storefront UI (no admin seeder), so they run against the ephemeral CI DB.
 * Reuses the existing data-testid page objects.
 */

// Unique per attempt so retries / reruns never collide in the shared CI DB.
function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
}
const PASSWORD = "supersecret123"

// Registers a customer and asserts the account overview is reached. If signup
// fails server-side, surfaces the register-error text instead of a vague timeout.
async function register(page: Page, email: string) {
  const login = new LoginPage(page)
  const reg = new RegisterPage(page)
  const overview = new OverviewPage(page)

  await login.goto()
  await login.registerButton.click()
  await reg.container.waitFor({ state: "visible" })
  await reg.firstNameInput.fill("Test")
  await reg.lastNameInput.fill("User")
  await reg.emailInput.fill(email)
  await reg.phoneInput.fill("+351912345678")
  await reg.passwordInput.fill(PASSWORD)
  await reg.registerButton.click()

  const outcome = await Promise.race([
    overview.welcomeMessage
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => "ok"),
    reg.registerError
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(async () => `signup error: ${await reg.registerError.textContent()}`),
  ])
  if (outcome !== "ok") throw new Error(outcome)
}

test("register a new customer lands on the account overview", async ({
  page,
}) => {
  await register(page, uniqueEmail())
  await expect(new OverviewPage(page).welcomeMessage).toBeVisible()
})

test("a registered customer can log out and log back in", async ({ page }) => {
  const email = uniqueEmail()
  const overview = new OverviewPage(page)
  await register(page, email)

  // Drop the session and sign back in with the same credentials.
  await page.context().clearCookies()
  const login = new LoginPage(page)
  await login.goto()
  await login.emailInput.fill(email)
  await login.passwordInput.fill(PASSWORD)
  await login.signInButton.click()

  const outcome = await Promise.race([
    overview.welcomeMessage
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => "ok"),
    login.errorMessage
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(async () => `login error: ${await login.errorMessage.textContent()}`),
  ])
  expect(outcome).toBe("ok")
})

test("invalid credentials show an error", async ({ page }) => {
  const login = new LoginPage(page)
  await login.goto()
  await login.emailInput.fill(uniqueEmail()) // never registered
  await login.passwordInput.fill("wrong-password")
  await login.signInButton.click()
  await expect(login.errorMessage).toBeVisible({ timeout: 30_000 })
})
