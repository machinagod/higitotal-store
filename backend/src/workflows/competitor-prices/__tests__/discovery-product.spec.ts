jest.mock("../../../modules/competitor-prices/discovery/registry", () => ({
  getDiscoveryAgent: jest.fn(),
  isDiscoveryConfigured: jest.fn(),
}))

import { runProductDiscovery } from "../discovery-product"
import {
  getDiscoveryAgent,
  isDiscoveryConfigured,
} from "../../../modules/competitor-prices/discovery/registry"

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
const makeContainer = (svc: any) => ({
  resolve: (n: string) => (n === "logger" ? logger : svc),
})

const baseSvc = () => ({
  listDueProductWatches: jest.fn().mockResolvedValue([]),
  listProductWatches: jest.fn().mockResolvedValue([]),
  ensureCompetitor: jest.fn().mockResolvedValue({ id: "c" }),
  upsertDiscoveredMapping: jest.fn().mockResolvedValue({ id: "m" }),
  markProductDiscovered: jest.fn(),
})

describe("runProductDiscovery", () => {
  it("is inert when no agent is configured", async () => {
    ;(isDiscoveryConfigured as jest.Mock).mockReturnValue(false)
    ;(getDiscoveryAgent as jest.Mock).mockReturnValue({ key: "noop" })
    const report = await runProductDiscovery(makeContainer(baseSvc()) as any, {})
    expect(report).toMatchObject({ agent: "noop", considered: 0, newListings: 0 })
  })

  it("finds stores, ensures competitors, and creates mappings", async () => {
    ;(isDiscoveryConfigured as jest.Mock).mockReturnValue(true)
    const agent = {
      key: "anthropic",
      findStoresForProduct: jest.fn().mockResolvedValue([
        { competitorHandle: "acme", competitorName: "Acme", url: "http://acme/p", title: "P" },
        { competitorHandle: "", url: "http://x" }, // skipped (no handle)
        { competitorHandle: "z" }, // skipped (no url)
      ]),
    }
    ;(getDiscoveryAgent as jest.Mock).mockReturnValue(agent)
    const svc = baseSvc()
    svc.listDueProductWatches.mockResolvedValue([
      { id: "w", product_id: "p1", product_sku: "S", title: "T", brand: "B", ean: "E" },
    ])
    const report = await runProductDiscovery(makeContainer(svc) as any, {})
    expect(report).toMatchObject({ considered: 1, newListings: 1 })
    expect(svc.ensureCompetitor).toHaveBeenCalledTimes(1)
    expect(svc.upsertDiscoveredMapping).toHaveBeenCalledWith("c", expect.objectContaining({ url: "http://acme/p" }), "p1")
    expect(svc.markProductDiscovered).toHaveBeenCalled()
  })

  it("tolerates agent failure and uses explicit watchIds", async () => {
    ;(isDiscoveryConfigured as jest.Mock).mockReturnValue(true)
    const agent = { key: "anthropic", findStoresForProduct: jest.fn().mockRejectedValue(new Error("boom")) }
    ;(getDiscoveryAgent as jest.Mock).mockReturnValue(agent)
    const svc = baseSvc()
    svc.listProductWatches.mockResolvedValue([{ id: "w", product_id: "p1" }])
    const report = await runProductDiscovery(makeContainer(svc) as any, { watchIds: ["w"] })
    expect(svc.listProductWatches).toHaveBeenCalledWith({ id: ["w"] })
    expect(report.newListings).toBe(0)
    expect(svc.markProductDiscovered).toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalled()
  })
})
