import { expect, test } from "@playwright/test"

/**
 * Read-only production smoke. Verifies the freshly-deployed live stack is sane:
 * the storefront renders, the dynamic top-level categories link to working
 * filtered /categories pages, a product page resolves from the backend, and the
 * admin loads. No data is ever mutated (no cart/account/checkout).
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://storeadmin.higitotal.pt"

test("home redirects to a region and renders", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/[a-z]{2}(\/|\?|$)/)
  await expect(page.locator("body")).toBeVisible()
})

test("nav shows dynamic categories linking to filtered category pages", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/[a-z]{2}(\/|\?|$)/)

  // The dynamic top-level categories render as links to /categories/<handle>.
  const categoryLink = page.locator('a[href*="/categories/"]').first()
  await expect(categoryLink).toBeVisible({ timeout: 30_000 })

  await categoryLink.click()
  await expect(page).toHaveURL(/\/categories\//)
  // The category page resolved (didn't 404): a heading renders.
  await expect(page.getByRole("heading").first()).toBeVisible({
    timeout: 30_000,
  })
})

test("store lists products and a product page loads", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/([a-z]{2})(\/|\?|$)/)
  const region = new URL(page.url()).pathname.split("/")[1] || "dk"

  await page.goto(`/${region}/store`)

  const productLink = page.locator('a[href*="/products/"]').first()
  await expect(productLink).toBeVisible({ timeout: 30_000 })

  await productLink.click()
  await expect(page).toHaveURL(/\/products\//)
  await expect(page.getByRole("heading").first()).toBeVisible({
    timeout: 30_000,
  })
})

test("admin dashboard login renders", async ({ page }) => {
  await page.goto(`${BACKEND_URL}/app/login`)
  await expect(page.getByText(/welcome to medusa/i)).toBeVisible({
    timeout: 30_000,
  })
})
