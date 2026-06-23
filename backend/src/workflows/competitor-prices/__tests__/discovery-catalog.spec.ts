jest.mock("../../../modules/competitor-prices/discovery/registry", () => ({
  getDiscoveryAgent: jest.fn(),
  isDiscoveryConfigured: jest.fn(),
}))
jest.mock("../match", () => ({ runCompetitorMatch: jest.fn() }))

import { runCatalogDiscovery } from "../discovery-catalog"
import {
  getDiscoveryAgent,
  isDiscoveryConfigured,
} from "../../../modules/competitor-prices/discovery/registry"
import { runCompetitorMatch } from "../match"

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const makeContainer = (svc: any) => ({
  resolve: (n: string) => (n === "logger" ? logger : svc),
})

const baseSvc = () => ({
  listDueCatalogDiscovery: jest.fn().mockResolvedValue([]),
  listCompetitors: jest.fn().mockResolvedValue([]),
  listCompetitorProducts: jest.fn().mockResolvedValue([]),
  upsertDiscoveredMapping: jest.fn(),
  updateCompetitors: jest.fn(),
  markCatalogDiscovered: jest.fn(),
})

describe("runCatalogDiscovery", () => {
  it("is inert when no agent is configured", async () => {
    ;(isDiscoveryConfigured as jest.Mock).mockReturnValue(false)
    ;(getDiscoveryAgent as jest.Mock).mockReturnValue({ key: "noop" })
    const report = await runCatalogDiscovery(makeContainer(baseSvc()) as any, {})
    expect(report).toMatchObject({ agent: "noop", considered: 0 })
  })

  it("discovers listings, generates a parser, and triggers matching", async () => {
    ;(isDiscoveryConfigured as jest.Mock).mockReturnValue(true)
    const agent = {
      key: "anthropic",
      discoverCatalog: jest.fn().mockResolvedValue([{ url: "http://acme/p1", title: "P" }]),
      generateParser: jest.fn().mockResolvedValue({ scraperKey: "config-selectors", hints: { price: ".p" } }),
    }
    ;(getDiscoveryAgent as jest.Mock).mockReturnValue(agent)
    const svc = baseSvc()
    svc.listDueCatalogDiscovery.mockResolvedValue([
      { id: "c", handle: "acme", base_url: "http://acme", metadata: { auto_generate_parser: true } },
    ])
    svc.upsertDiscoveredMapping.mockResolvedValue({ match_status: "unmatched" })

    const report = await runCatalogDiscovery(makeContainer(svc) as any, {})
    expect(report).toMatchObject({ considered: 1, newListings: 1, parsersGenerated: 1 })
    expect(svc.updateCompetitors).toHaveBeenCalled()
    expect(svc.markCatalogDiscovered).toHaveBeenCalled()
    expect(runCompetitorMatch).toHaveBeenCalled()
  })

  it("tolerates agent failures and still advances the schedule", async () => {
    ;(isDiscoveryConfigured as jest.Mock).mockReturnValue(true)
    const agent = {
      key: "anthropic",
      discoverCatalog: jest.fn().mockRejectedValue(new Error("net")),
      generateParser: jest.fn().mockRejectedValue(new Error("llm")),
    }
    ;(getDiscoveryAgent as jest.Mock).mockReturnValue(agent)
    const svc = baseSvc()
    svc.listCompetitors.mockResolvedValue([
      { id: "c", handle: "acme", metadata: { auto_generate_parser: true } },
    ])
    const report = await runCatalogDiscovery(makeContainer(svc) as any, { competitorIds: ["c"] })
    expect(report.newListings).toBe(0)
    expect(svc.markCatalogDiscovered).toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalled()
  })

  it("tolerates a parser-generation failure (listings still ingested)", async () => {
    ;(isDiscoveryConfigured as jest.Mock).mockReturnValue(true)
    const agent = {
      key: "anthropic",
      discoverCatalog: jest.fn().mockResolvedValue([{ url: "http://acme/p1" }]),
      generateParser: jest.fn().mockRejectedValue(new Error("llm")),
    }
    ;(getDiscoveryAgent as jest.Mock).mockReturnValue(agent)
    const svc = baseSvc()
    svc.listDueCatalogDiscovery.mockResolvedValue([
      { id: "c", handle: "acme", metadata: { auto_generate_parser: true } },
    ])
    svc.upsertDiscoveredMapping.mockResolvedValue({ match_status: "unmatched" })
    const report = await runCatalogDiscovery(makeContainer(svc) as any, {})
    expect(report).toMatchObject({ newListings: 1, parsersGenerated: 0 })
    expect(logger.warn).toHaveBeenCalled()
  })
})
