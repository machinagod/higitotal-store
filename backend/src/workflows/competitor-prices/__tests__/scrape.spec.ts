jest.mock("../../../modules/competitor-prices/scrapers/engine", () => ({
  crawlTargets: jest.fn(),
}))

import { runCompetitorScrape } from "../scrape"
import { crawlTargets } from "../../../modules/competitor-prices/scrapers/engine"

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const makeContainer = (svc: any) => ({
  resolve: (n: string) => (n === "logger" ? logger : svc),
})

const baseSvc = () => ({
  getConfig: () => ({ concurrency: 4 }),
  listDueMappings: jest.fn(),
  listCompetitorProducts: jest.fn(),
  recordObservation: jest.fn(),
})

describe("runCompetitorScrape", () => {
  it("no-ops when nothing is due / no scrapeable URL", async () => {
    const svc = baseSvc()
    svc.listDueMappings.mockResolvedValue([{ id: "m", is_active: true, competitor_url: null }])
    const report = await runCompetitorScrape(makeContainer(svc) as any, {})
    expect(report).toMatchObject({ due: 1, scraped: 0 })
    expect(crawlTargets).not.toHaveBeenCalled()
  })

  it("crawls due mappings and tallies outcomes", async () => {
    const svc = baseSvc()
    svc.listDueMappings.mockResolvedValue([
      { id: "m1", is_active: true, competitor_url: "u1", scraper_key: "k", competitor: { id: "c", scraper_key: "x" }, metadata: { scraper_hints: { a: 1 } } },
      { id: "m2", is_active: true, competitor_url: "u2", competitor: { id: "c" } },
      { id: "m3", is_active: true, competitor_url: "u3", competitor: { id: "c" } },
    ])
    ;(crawlTargets as jest.Mock).mockResolvedValue(
      new Map([
        ["m1", { status: "ok" }],
        ["m2", { status: "not_found" }],
        // m3 has no result → skipped
      ])
    )
    svc.recordObservation
      .mockResolvedValueOnce("changed")
      .mockResolvedValueOnce("error")
    const report = await runCompetitorScrape(makeContainer(svc) as any, {})
    expect(report).toMatchObject({ due: 3, scraped: 2, changed: 1, failed: 1, notFound: 1, unchanged: 0 })
    // scraper key + hints resolved onto the target
    const targets = (crawlTargets as jest.Mock).mock.calls[0][0]
    expect(targets[0]).toMatchObject({ competitorProductId: "m1", scraperKey: "k", hints: { a: 1 } })
    expect(targets[1].scraperKey).toBe("generic-jsonld") // falls back to default
  })

  it("uses explicit mappingIds when provided", async () => {
    const svc = baseSvc()
    svc.listCompetitorProducts.mockResolvedValue([])
    await runCompetitorScrape(makeContainer(svc) as any, { mappingIds: ["a"] })
    expect(svc.listCompetitorProducts).toHaveBeenCalledWith({ id: ["a"] }, { relations: ["competitor"] })
    expect(svc.listDueMappings).not.toHaveBeenCalled()
  })
})
