// Crawlee fails to load → crawlTargets must degrade to error results, not throw.
jest.mock("crawlee", () => {
  throw new Error("module load fail")
})

import { crawlTargets } from "../scrapers/engine"

describe("crawlTargets when the engine can't be imported", () => {
  it("records an error for every target instead of throwing", async () => {
    const res = await crawlTargets([
      { url: "http://x", competitorId: "c", competitorProductId: "x" },
    ])
    expect(res.get("x")).toMatchObject({ status: "error" })
    expect(res.get("x")?.errorMessage).toMatch(/engine unavailable/)
  })
})
