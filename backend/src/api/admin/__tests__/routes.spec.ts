jest.mock("../../../workflows/competitor-prices/scrape", () => ({ runCompetitorScrape: jest.fn().mockResolvedValue({ scraped: 1 }) }))
jest.mock("../../../workflows/competitor-prices/match", () => ({ runCompetitorMatch: jest.fn().mockResolvedValue({ confirmed: 1 }) }))
jest.mock("../../../workflows/competitor-prices/discovery-catalog", () => ({ runCatalogDiscovery: jest.fn().mockResolvedValue({ c: 1 }) }))
jest.mock("../../../workflows/competitor-prices/discovery-product", () => ({ runProductDiscovery: jest.fn().mockResolvedValue({ p: 1 }) }))

import { GET as competitorsGET, POST as competitorsPOST } from "../competitors/route"
import { GET as cpGET, POST as cpPOST } from "../competitor-products/route"
import { GET as pwGET, POST as pwPOST } from "../product-watches/route"
import { POST as scrapePOST } from "../competitor-prices/scrape/route"
import { POST as matchPOST } from "../competitor-prices/match/route"
import { POST as discoverPOST } from "../competitor-prices/discover/route"
import { runCompetitorScrape } from "../../../workflows/competitor-prices/scrape"
import { runCatalogDiscovery } from "../../../workflows/competitor-prices/discovery-catalog"
import { runProductDiscovery } from "../../../workflows/competitor-prices/discovery-product"

const makeRes = () => {
  const res: any = {}
  res.json = jest.fn().mockReturnValue(res)
  res.status = jest.fn().mockReturnValue(res)
  return res
}
const makeReq = (svc: any, body: any = {}, query: any = {}) => ({
  scope: { resolve: () => svc },
  body,
  query,
})

describe("admin routes", () => {
  it("GET/POST /admin/competitors", async () => {
    const svc = {
      listCompetitors: jest.fn().mockResolvedValue([{ id: "c" }]),
      createCompetitors: jest.fn().mockResolvedValue({ id: "new" }),
    }
    const res1 = makeRes()
    await competitorsGET(makeReq(svc) as any, res1)
    expect(res1.json).toHaveBeenCalledWith({ competitors: [{ id: "c" }] })

    const res2 = makeRes()
    await competitorsPOST(makeReq(svc, { name: "X", handle: "x" }) as any, res2)
    expect(res2.status).toHaveBeenCalledWith(201)
    expect(res2.json).toHaveBeenCalledWith({ competitor: { id: "new" } })
  })

  it("GET /admin/competitor-products attaches the latest price + applies filters", async () => {
    const svc = {
      listCompetitorProducts: jest.fn().mockResolvedValue([
        { id: "m1", competitor: {}, prices: [
          { price: 1, scraped_at: "2024-01-01" },
          { price: 2, scraped_at: "2024-02-01" },
        ] },
        { id: "m2", competitor: {}, prices: [] },
      ]),
    }
    const res = makeRes()
    await cpGET(makeReq(svc, {}, { product_id: "p", competitor_id: "c", match_status: "confirmed" }) as any, res)
    expect(svc.listCompetitorProducts).toHaveBeenCalledWith(
      { product_id: "p", competitor_id: "c", match_status: "confirmed" },
      expect.objectContaining({ relations: ["competitor", "prices"] })
    )
    const payload = res.json.mock.calls[0][0]
    expect(payload.count).toBe(2)
    expect(payload.competitor_products[0].latest_price.price).toBe(2)
    expect(payload.competitor_products[1].latest_price).toBeNull()
    expect(payload.competitor_products[0].prices).toBeUndefined()
  })

  it("POST /admin/competitor-products", async () => {
    const svc = { createCompetitorProducts: jest.fn().mockResolvedValue({ id: "m" }) }
    const res = makeRes()
    await cpPOST(makeReq(svc, { competitor_id: "c", competitor_url: "u" }) as any, res)
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it("GET/POST /admin/product-watches", async () => {
    const svc = {
      listProductWatches: jest.fn().mockResolvedValue([{ id: "w" }]),
      createProductWatches: jest.fn().mockResolvedValue({ id: "w2" }),
    }
    const res1 = makeRes()
    await pwGET(makeReq(svc) as any, res1)
    expect(res1.json).toHaveBeenCalledWith({ product_watches: [{ id: "w" }] })
    const res2 = makeRes()
    await pwPOST(makeReq(svc, { product_id: "p" }) as any, res2)
    expect(res2.status).toHaveBeenCalledWith(201)
  })

  it("POST /admin/competitor-prices/scrape + /match", async () => {
    const res1 = makeRes()
    await scrapePOST(makeReq({}, { mapping_ids: ["a"], force: true }) as any, res1)
    expect(runCompetitorScrape).toHaveBeenCalledWith(expect.anything(), { mappingIds: ["a"], limit: undefined, force: true })
    expect(res1.json).toHaveBeenCalledWith({ report: { scraped: 1 } })

    const res2 = makeRes()
    await matchPOST(makeReq({}, { rematch: true }) as any, res2)
    expect(res2.json).toHaveBeenCalledWith({ report: { confirmed: 1 } })
  })

  it("POST /admin/competitor-prices/discover honours mode", async () => {
    const resBoth = makeRes()
    await discoverPOST(makeReq({}, {}) as any, resBoth)
    expect(runCatalogDiscovery).toHaveBeenCalled()
    expect(runProductDiscovery).toHaveBeenCalled()
    expect(resBoth.json.mock.calls[0][0]).toHaveProperty("catalog")
    expect(resBoth.json.mock.calls[0][0]).toHaveProperty("product")

    ;(runCatalogDiscovery as jest.Mock).mockClear()
    ;(runProductDiscovery as jest.Mock).mockClear()
    const resCat = makeRes()
    await discoverPOST(makeReq({}, { mode: "catalog" }) as any, resCat)
    expect(runCatalogDiscovery).toHaveBeenCalled()
    expect(runProductDiscovery).not.toHaveBeenCalled()

    ;(runCatalogDiscovery as jest.Mock).mockClear()
    const resProd = makeRes()
    await discoverPOST(makeReq({}, { mode: "product" }) as any, resProd)
    expect(runCatalogDiscovery).not.toHaveBeenCalled()
    expect(runProductDiscovery).toHaveBeenCalled()
  })

  it("tolerates a missing request body (defaults to {})", async () => {
    const svc = {
      createCompetitors: jest.fn().mockResolvedValue({}),
      createCompetitorProducts: jest.fn().mockResolvedValue({}),
      createProductWatches: jest.fn().mockResolvedValue({}),
    }
    const reqNoBody = (s: any) => ({ scope: { resolve: () => s }, query: {} })
    await competitorsPOST(reqNoBody(svc) as any, makeRes())
    await cpPOST(reqNoBody(svc) as any, makeRes())
    await pwPOST(reqNoBody(svc) as any, makeRes())
    await scrapePOST(reqNoBody({}) as any, makeRes())
    await matchPOST(reqNoBody({}) as any, makeRes())
    await discoverPOST(reqNoBody({}) as any, makeRes())
    expect(svc.createCompetitors).toHaveBeenCalledWith({})
  })

  it("competitor-products GET with no filters + descending price order", async () => {
    const svc = {
      listCompetitorProducts: jest.fn().mockResolvedValue([
        { id: "m1", competitor: {}, prices: [
          { price: 2, scraped_at: "2024-02-01" },
          { price: 1, scraped_at: "2024-01-01" }, // older — reduce keeps the newer
        ] },
      ]),
    }
    const res = makeRes()
    await cpGET({ scope: { resolve: () => svc }, body: {}, query: {} } as any, res)
    expect(svc.listCompetitorProducts).toHaveBeenCalledWith({}, expect.anything())
    expect(res.json.mock.calls[0][0].competitor_products[0].latest_price.price).toBe(2)
  })
})
