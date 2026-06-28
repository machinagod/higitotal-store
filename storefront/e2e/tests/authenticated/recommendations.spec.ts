import { test, expect } from "../../index"

// Read-only: verifies the "Recommended for you" reorder block integrates into the
// account overview without breaking it. The seeded test customer has no Moloni /
// Twenty link, so the store endpoint returns no recommendations and the section
// hides itself — assert the overview still renders and the block degrades cleanly.
// No data is mutated.
test.describe("Account reorder recommendations", () => {
  test("overview renders; recommendations block hides when there are none", async ({
    accountOverviewPage: overviewPage,
  }) => {
    await overviewPage.goto()
    await expect(overviewPage.overviewWrapper).toBeVisible()

    // Empty state: the section is absent and renders zero items (never errors).
    await expect(overviewPage.recommendedForYou).toHaveCount(0)
    await expect(overviewPage.recommendationItems).toHaveCount(0)

    // If recommendations ever ARE present, each item must link to a product.
    const items = await overviewPage.recommendationItems.all()
    for (const item of items) {
      await expect(item).toHaveAttribute("href", /\/products\//)
    }
  })
})
