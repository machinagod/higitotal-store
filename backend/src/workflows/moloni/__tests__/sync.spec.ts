/**
 * runMoloniSync orchestration against an in-memory fake of Medusa (query.graph
 * + core-flows workflows) and of the Moloni module. Exercises the incident: a
 * Moloni reference moving between products (RS0010), failure isolation, the
 * retry list, change detection and the missing-price-set heal.
 */
import type { MoloniProduct } from "../../../modules/moloni"

type Calls = { name: string; input: any }[]
const mockCalls: Calls = []
const mockFailWhen: Record<string, (input: any) => string | undefined> = {}
const mockResults: Record<string, (input: any) => any> = {}

const mockWf = (name: string) =>
  jest.fn(() => ({
    run: async ({ input }: { input: any }) => {
      mockCalls.push({ name, input })
      const err = mockFailWhen[name]?.(input)
      if (err) throw new Error(err)
      return { result: mockResults[name]?.(input) ?? [] }
    },
  }))

jest.mock("@medusajs/medusa/core-flows", () => {
  const names = [
    "createCustomerAddressesWorkflow",
    "createCustomersWorkflow",
    "createInventoryLevelsWorkflow",
    "createPriceListPricesWorkflow",
    "createPriceListsWorkflow",
    "createProductCategoriesWorkflow",
    "createProductsWorkflow",
    "deleteProductsWorkflow",
    "updateCustomersWorkflow",
    "updateInventoryLevelsWorkflow",
    "updatePriceListPricesWorkflow",
    "updateProductCategoriesWorkflow",
    "updateProductsWorkflow",
    "updateInventoryItemsWorkflow",
    "updateProductVariantsWorkflow",
  ]
  return Object.fromEntries(names.map((n) => [n, mockWf(n)]))
})
jest.mock("../ensure-variant-price-sets", () => ({
  ensureVariantPriceSetsWorkflow: mockWf("ensureVariantPriceSetsWorkflow"),
}))

// Loaded after the mocks above are defined (static imports would be hoisted).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { runMoloniSync } = require("../sync") as typeof import("../sync")

// ── fake Medusa state ──────────────────────────────────────────────────────
interface FakeVariant {
  id: string
  sku: string | null
  barcode?: string | null
  manage_inventory: boolean
  metadata: Record<string, any>
  price?: number | null // base EUR price; null/undefined → no price set
  items: { id: string; sku: string }[]
}
interface FakeProduct {
  id: string
  external_id: string
  title: string
  metadata: Record<string, any>
  categories: { id: string }[]
  variant: FakeVariant
}

let products: FakeProduct[] = []
let orphanItems: { id: string; sku: string }[] = []
let categories: any[] = []
let priceLists: any[] = []

const productRow = (p: FakeProduct) => ({
  id: p.id,
  external_id: p.external_id,
  title: p.title,
  metadata: p.metadata,
  categories: p.categories,
  variants: [
    {
      id: p.variant.id,
      sku: p.variant.sku,
      barcode: p.variant.barcode ?? null,
      manage_inventory: p.variant.manage_inventory,
      metadata: p.variant.metadata,
      prices:
        p.variant.price != null
          ? [{ amount: p.variant.price, currency_code: "eur", price_list_id: null, rules_count: 0 }]
          : [],
      inventory_items: p.variant.items.map((i) => ({ inventory: { id: i.id, sku: i.sku } })),
    },
  ],
})

const graph = jest.fn(async ({ entity, filters }: any) => {
  let data: any[] = []
  switch (entity) {
    case "product_category":
      data = categories
      break
    case "stock_location":
      data = [{ id: "sloc_1", name: "WH" }]
      break
    case "product":
      data = products
        .filter((p) => !filters?.external_id || filters.external_id.includes(p.external_id))
        .map(productRow)
      break
    case "product_variant":
      data = products
        .filter((p) => !filters?.id || filters.id.includes(p.variant.id))
        .map((p) => ({
          id: p.variant.id,
          sku: p.variant.sku,
          product: { external_id: p.external_id },
          inventory_items: p.variant.items.map((i) => ({ inventory: { id: i.id, sku: i.sku } })),
        }))
      break
    case "inventory_item":
      data = [
        ...products.flatMap((p) => p.variant.items),
        ...orphanItems,
      ].filter((i) => filters.sku.includes(i.sku))
      break
    case "product_variant_price_set":
      data = products
        .filter((p) => filters.variant_id.includes(p.variant.id) && p.variant.price != null)
        .map((p) => ({ variant_id: p.variant.id, price_set_id: `pset_${p.variant.id}` }))
      break
    case "price_list":
      data = priceLists
      break
    default:
      data = [] // inventory_level, …
  }
  return { data, metadata: { count: data.length } }
})

// ── fake Moloni module ─────────────────────────────────────────────────────
let moloniProducts: MoloniProduct[] = []
let moloniCategories: any[] = []
let byId: Record<number, MoloniProduct> = {}
const syncState: Record<string, string> = {}
const moloni = {
  getSyncCursor: jest.fn(async (k: string) => syncState[k] ?? "1970-01-01T00:00:00.000Z"),
  setSyncCursor: jest.fn(async (k: string, v: string) => {
    syncState[k] = v
  }),
  getSyncState: jest.fn(async (k: string) => syncState[k] ?? null),
  setSyncState: jest.fn(async (k: string, v: string) => {
    syncState[k] = v
  }),
  listProducts: jest.fn(async () => [...moloniProducts]),
  getProductsByIds: jest.fn(async (ids: number[]) => ({
    found: ids.filter((id) => byId[id]).map((id) => byId[id]),
    notFound: ids.filter((id) => !byId[id]),
    errors: [],
  })),
  listAllCategories: jest.fn(async () => [...moloniCategories]),
  listCustomers: jest.fn(async () => []),
}

const logs: { level: string; msg: string }[] = []
const logger = Object.fromEntries(
  ["info", "warn", "error", "debug"].map((level) => [
    level,
    (msg: string) => logs.push({ level, msg }),
  ])
)

const container: any = {
  resolve: (key: string) => {
    switch (key) {
      case "logger":
        return logger
      case "query":
        return { graph }
      case "moloni":
        return moloni
      case "sales_channel":
        return { listSalesChannels: async () => [{ id: "sc_1" }] }
      case "fulfillment":
        return { listShippingProfiles: async () => [{ id: "sp_1" }] }
      default:
        throw new Error(`unexpected resolve ${key}`)
    }
  },
}

const mp = (over: Partial<MoloniProduct> & { product_id: number; reference: string }): MoloniProduct => ({
  category_id: 0,
  type: 1,
  name: `Produto ${over.product_id}`,
  price: 2,
  has_stock: 1,
  stock: 5,
  ...over,
})

/** Medusa product that is exactly in sync with `m` (change detection → no-op). */
const synced = (m: MoloniProduct, variant: Partial<FakeVariant> = {}): FakeProduct => ({
  id: `prod_${m.product_id}`,
  external_id: String(m.product_id),
  title: m.name,
  metadata: { moloni_product_id: m.product_id, moloni_category_id: m.category_id, moloni_vat_percent: null },
  categories: [],
  variant: {
    id: `var_${m.product_id}`,
    sku: m.reference,
    manage_inventory: m.has_stock === 1,
    metadata: { moloni_product_id: m.product_id },
    price: m.price,
    items: [{ id: `iitem_${m.product_id}`, sku: m.reference }],
    ...variant,
  },
})

const named = (name: string) => mockCalls.filter((c) => c.name === name)
const run = () => runMoloniSync(container, { entities: ["products", "prices", "stock"] })

beforeEach(() => {
  mockCalls.length = 0
  logs.length = 0
  for (const k of Object.keys(mockFailWhen)) delete mockFailWhen[k]
  for (const k of Object.keys(mockResults)) delete mockResults[k]
  for (const k of Object.keys(syncState)) delete syncState[k]
  products = []
  orphanItems = []
  categories = []
  priceLists = []
  moloniCategories = []
  moloniProducts = []
  byId = {}
  mockResults.createPriceListsWorkflow = (input) => [{ id: `plist_${input.price_lists_data[0].title}` }]
  // Like Medusa: apply the variant sku and create the missing default item.
  mockResults.updateProductsWorkflow = (input) => {
    for (const u of input.products) {
      const p = products.find((x) => x.id === u.id)!
      const v = u.variants[0]
      p.variant.sku = v.sku
      p.variant.manage_inventory = v.manage_inventory
      if (v.manage_inventory && !p.variant.items.length) {
        p.variant.items.push({ id: `iitem_new_${p.variant.id}`, sku: v.sku })
      }
    }
    return []
  }
})

describe("runMoloniSync — sku moves (incident)", () => {
  const A = mp({ product_id: 234226552, reference: "RS0030", name: "Sacos 5L" })
  const B = mp({ product_id: 234226942, reference: "RS0010", name: "Sacos 1L" })
  const C = mp({ product_id: 300, reference: "C1" })

  it("frees RS0010 (variant + stale item) before B takes it; skips unchanged C", async () => {
    products = [
      // A still on RS0010 in Medusa (variant + item)
      synced({ ...A, reference: "RS0010" }),
      // B: draft, manage_inventory, no inventory item yet
      synced(B, { sku: "OLD-B", items: [] }),
      synced(C),
    ]
    moloniProducts = [A, B, C]

    const report = await run()

    const order = mockCalls.map((c) => c.name)
    expect(named("updateProductVariantsWorkflow")[0].input).toEqual({
      product_variants: [{ id: "var_234226552", sku: "RS0010__tmp_var_234226552" }],
    })
    const itemCalls = named("updateInventoryItemsWorkflow").map((c) => c.input.updates)
    expect(itemCalls).toEqual([
      [{ id: "iitem_234226552", sku: "RS0010__tmp_iitem_234226552" }],
      [{ id: "iitem_234226552", sku: "RS0030", title: "Sacos 5L" }],
    ])
    // renames happen before the product update that creates B's item
    expect(order.indexOf("updateInventoryItemsWorkflow")).toBeLessThan(
      order.indexOf("updateProductsWorkflow")
    )
    const updated = named("updateProductsWorkflow").flatMap((c) => c.input.products)
    expect(updated.map((p: any) => [p.id, p.variants[0].sku])).toEqual([
      ["prod_234226552", "RS0030"],
      ["prod_234226942", "RS0010"],
    ])
    expect(report.products).toMatchObject({ updated: 2, unchanged: 1, failed: 0 })
    expect(report.inventoryItems).toEqual({ renamed: 1, failed: 0 })
    expect(syncState["products:retry"]).toBe("{}")
    expect(syncState.products).toBeDefined()
  })

  it("true duplicate reference: skips the product with both Moloni ids, run continues", async () => {
    const D = mp({ product_id: 400, reference: "C1" }) // same reference as C
    products = [synced(C), synced(D, { sku: "D-OLD", items: [] })]
    moloniProducts = [D]

    const report = await run()

    expect(named("updateProductsWorkflow")).toHaveLength(0)
    const err = logs.find((l) => l.level === "error" && l.msg.includes("product 400"))!
    expect(err.msg).toContain("(C1) failed: skipped")
    expect(err.msg).toContain("Moloni products 400 & 300")
    expect(report.products.failed).toBe(1)
    expect(JSON.parse(syncState["products:retry"])).toHaveProperty("400")
    expect(syncState.products).toBeDefined() // cursor still advanced
  })
})

describe("runMoloniSync — failure isolation + retry list", () => {
  it("a failing product in an update batch does not abort the run", async () => {
    const ok = mp({ product_id: 1, reference: "OK1", name: "new name" })
    const bad = mp({ product_id: 2, reference: "BAD", name: "new name" })
    products = [synced({ ...ok, name: "old" }), synced({ ...bad, name: "old" })]
    moloniProducts = [ok, bad]
    mockFailWhen.updateProductsWorkflow = (input) =>
      input.products.some((p: any) => p.id === "prod_2") ? "Inventory item with sku: BAD, already exists." : undefined

    const report = await run()

    expect(report.products).toMatchObject({ updated: 1, failed: 1 })
    expect(logs).toContainEqual({
      level: "error",
      msg: "[moloni-sync] product 2 (BAD) failed: Inventory item with sku: BAD, already exists.",
    })
    const retry = JSON.parse(syncState["products:retry"])
    expect(Object.keys(retry)).toEqual(["2"])
    expect(retry["2"].attempts).toBe(1)
    expect(syncState.products).toBeDefined()
  })

  it("isolates create failures the same way", async () => {
    moloniProducts = [mp({ product_id: 7, reference: "N7" }), mp({ product_id: 8, reference: "N8" })]
    mockFailWhen.createProductsWorkflow = (input) =>
      input.products.some((p: any) => p.external_id === "8") ? "boom" : undefined
    mockResults.createProductsWorkflow = (input) =>
      input.products.map((p: any) => {
        const m = moloniProducts.find((x) => String(x.product_id) === p.external_id)!
        products.push(synced(m))
        return { id: `prod_${p.external_id}`, external_id: p.external_id, variants: [{ id: `var_${p.external_id}` }] }
      })

    const report = await run()

    expect(report.products).toMatchObject({ created: 1, failed: 1 })
    expect(Object.keys(JSON.parse(syncState["products:retry"]))).toEqual(["8"])
  })

  it("fetches retry-list products by id and clears them once they succeed", async () => {
    const R = mp({ product_id: 99, reference: "R99", name: "changed" })
    byId = { 99: R }
    products = [synced({ ...R, name: "stale" })]
    syncState["products:retry"] = JSON.stringify({
      "99": { attempts: 4, firstFailedAt: "2026-11-14T01:05:00Z", lastError: "x" },
      "98": { attempts: 1, firstFailedAt: "2026-11-14T01:05:00Z", lastError: "x" },
    })

    const report = await run()

    expect(moloni.getProductsByIds).toHaveBeenCalledWith([98, 99])
    expect(report.products).toMatchObject({ retried: 2, updated: 1, failed: 0 })
    // 99 succeeded → gone; 98 not found once → kept with a miss counter
    const retry = JSON.parse(syncState["products:retry"])
    expect(Object.keys(retry)).toEqual(["98"])
    expect(retry["98"].notFound).toBe(1)
    expect(logs.some((l) => l.msg.includes("retry list: 2 product(s)"))).toBe(true)
  })
})

describe("runMoloniSync — missing price sets / inventory items", () => {
  it("creates a price set for a variant without one, then prices it", async () => {
    const P = mp({
      product_id: 5,
      reference: "HR1010",
      price_classes: [
        { product_price_class_id: 1, price_class_id: 11, value: 2.5, price_class: { price_class_id: 11, title: "PVP1" } },
      ],
    })
    products = [synced(P, { price: null })]
    moloniProducts = [P]
    mockResults.ensureVariantPriceSetsWorkflow = (input) => {
      for (const v of input.variants) {
        const p = products.find((x) => x.variant.id === v.variant_id)!
        p.variant.price = v.prices[0].amount
      }
      return {}
    }

    const report = await run()

    expect(named("ensureVariantPriceSetsWorkflow")[0].input).toEqual({
      variants: [{ variant_id: "var_5", prices: [{ amount: 2.5, currency_code: "eur" }] }],
    })
    expect(report.products.priceSetsCreated).toBe(1)
    expect(report.priceListPrices.failed).toBe(0)
    expect(named("createPriceListPricesWorkflow")).toHaveLength(1)
    expect(syncState["products:retry"]).toBe("{}")
  })

  it("skips-and-retries price-list prices + stock for variants that still lack them", async () => {
    const P = mp({
      product_id: 6,
      reference: "BH1117",
      price_classes: [
        { product_price_class_id: 1, price_class_id: 11, value: 2.5, price_class: { price_class_id: 11, title: "PVP2" } },
      ],
    })
    const Q = mp({
      product_id: 7,
      reference: "Q7",
      stock: 9,
      price_classes: [
        { product_price_class_id: 2, price_class_id: 11, value: 1, price_class: { price_class_id: 11, title: "PVP2" } },
      ],
    })
    products = [synced(P, { price: null, items: [] }), synced(Q)]
    moloniProducts = [P, Q]
    mockFailWhen.ensureVariantPriceSetsWorkflow = () => "pricing down"
    mockFailWhen.updateProductsWorkflow = () => "inventory create failed"

    const report = await run()

    expect(report.priceListPrices.failed).toBe(1)
    expect(report.stock.failed).toBe(1)
    // Q is still priced/stocked: no batch-wide abort
    expect(named("createPriceListPricesWorkflow")[0].input.data[0].prices).toEqual([
      { amount: 1, currency_code: "eur", variant_id: "var_7" },
    ])
    expect(named("createInventoryLevelsWorkflow")[0].input.inventory_levels).toEqual([
      { inventory_item_id: "iitem_7", location_id: "sloc_1", stocked_quantity: 9 },
    ])
    expect(Object.keys(JSON.parse(syncState["products:retry"]))).toEqual(["6"])
    expect(syncState.products).toBeDefined()
  })

  it("a price-list section crash puts the run's products on the retry list, cursor still advances", async () => {
    const P = mp({ product_id: 9, reference: "P9" })
    products = [synced(P)]
    moloniProducts = [P]
    mockFailWhen.createPriceListsWorkflow = () => "db gone"

    await run()

    const retry = JSON.parse(syncState["products:retry"])
    expect(retry["9"].lastError).toContain("price lists step failed: db gone")
    expect(syncState.products).toBeDefined()
  })

  it("records the product for retry when creating its price set fails", async () => {
    const P = mp({ product_id: 13, reference: "P13" })
    products = [synced(P, { price: null })]
    moloniProducts = [P]
    mockFailWhen.ensureVariantPriceSetsWorkflow = () => "pricing down"

    const report = await run()

    expect(report.products).toMatchObject({ updated: 1, failed: 1, priceSetsCreated: 0 })
    const retry = JSON.parse(syncState["products:retry"])
    expect(retry["13"].lastError).toContain("creating missing price set: pricing down")
  })
})

describe("runMoloniSync — degraded lookups", () => {
  it("updates everything when the change-detection lookup fails", async () => {
    const P = mp({ product_id: 11, reference: "P11" })
    products = [synced(P)]
    moloniProducts = [P]
    const real = graph.getMockImplementation()!
    graph.mockImplementation(async (args: any) => {
      if (args.entity === "product" && args.fields.includes("variants.prices.amount")) {
        throw new Error("unknown field")
      }
      return real(args)
    })
    try {
      const report = await run()
      expect(report.products).toMatchObject({ updated: 1, unchanged: 0 })
    } finally {
      graph.mockImplementation(real)
    }
  })

  it("continues without sku planning when the snapshot query fails", async () => {
    const P = mp({ product_id: 12, reference: "P12", name: "renamed" })
    products = [synced({ ...P, name: "old" })]
    moloniProducts = [P]
    const real = graph.getMockImplementation()!
    graph.mockImplementation(async (args: any) => {
      if (args.entity === "product_variant" && !args.filters) throw new Error("timeout")
      return real(args)
    })
    try {
      const report = await run()
      expect(report.products.updated).toBe(1)
      expect(logs.some((l) => l.level === "error" && l.msg.includes("sku planning failed (timeout)"))).toBe(true)
    } finally {
      graph.mockImplementation(real)
    }
  })

  it("dry-run plans but writes nothing and keeps cursor/retry state", async () => {
    const A = mp({ product_id: 1, reference: "NEW" })
    products = [synced({ ...A, reference: "OLD" })]
    moloniProducts = [A]
    await runMoloniSync(container, { entities: ["products", "stock"], dryRun: true })
    expect(mockCalls).toEqual([])
    expect(syncState).toEqual({})
    expect(logs.some((l) => l.msg.includes("(dry) sku plan: 0 variant temp move(s), 0 item temp move(s), 1 item rename(s)"))).toBe(true)
  })
})

describe("runMoloniSync — categories", () => {
  it("only updates categories whose name / parent / visibility changed", async () => {
    moloniCategories = [
      { category_id: 1, parent_id: 0, name: "Sacos", description: "" },
      { category_id: 2, parent_id: 1, name: "Sacos Lixo (novo)", description: "" },
      { category_id: 7584765, parent_id: 0, name: "Diversey Unilever", description: "" },
      { category_id: 3, parent_id: 7584765, name: "Unilever", description: "" },
      { category_id: 4, parent_id: 0, name: "Nova", description: "" },
    ]
    categories = [
      { id: "pcat_1", name: "Sacos", parent_category_id: null, is_active: true, is_internal: false, metadata: { moloni_category_id: 1 } },
      { id: "pcat_2", name: "Sacos Lixo", parent_category_id: "pcat_1", is_active: true, is_internal: false, metadata: { moloni_category_id: 2 } },
      { id: "pcat_h", name: "Diversey Unilever", parent_category_id: null, is_active: false, is_internal: true, metadata: { moloni_category_id: 7584765 } },
      { id: "pcat_3", name: "Unilever", parent_category_id: null, is_active: true, is_internal: false, metadata: { moloni_category_id: 3 } },
    ]
    mockResults.createProductCategoriesWorkflow = () => [{ id: "pcat_4" }]

    const report = await runMoloniSync(container, { entities: ["categories"] })

    expect(named("updateProductCategoriesWorkflow").map((c) => c.input)).toEqual([
      { selector: { id: "pcat_2" }, update: { name: "Sacos Lixo (novo)", parent_category_id: "pcat_1" } },
    ])
    expect(named("createProductCategoriesWorkflow")).toHaveLength(1)
    expect(report.categories).toEqual({ created: 1, updated: 1, unchanged: 3 })
  })
})

describe("runMoloniSync — price-list prices", () => {
  const pvp2 = (value: number) => [
    { product_price_class_id: 1, price_class_id: 12, value, price_class: { price_class_id: 12, title: "PVP2" } },
  ]

  it("updates changed prices, isolates a failing one, prices cost; excluded products only warn", async () => {
    const P21 = mp({ product_id: 21, reference: "P21", price_classes: pvp2(2) }) // 1 → 2
    const P22 = mp({ product_id: 22, reference: "P22", price_classes: pvp2(6) }) // 5 → 6, fails
    const P23 = mp({
      product_id: 23,
      reference: "P23",
      suppliers: [{ product_id: 23, supplier_id: 1, cost_price: 0.99, cost_price_discounted: 0.9 }],
    })
    const P24 = mp({ product_id: 24, reference: "P24", price_classes: pvp2(1) })
    products = [
      synced(P21),
      synced(P22),
      synced(P23),
      { ...synced(P24, { price: null }), metadata: { excluded: true } },
    ]
    moloniProducts = [P21, P22, P23, P24]
    priceLists = [
      {
        id: "plist_pvp2",
        title: "Moloni PVP2",
        prices: [
          { id: "price_21", amount: 1, currency_code: "eur", price_set: { variant: { id: "var_21" } } },
          { id: "price_22", amount: 5, currency_code: "eur", price_set: { variant: { id: "var_22" } } },
          { id: "price_x", amount: 5, currency_code: "eur", price_set: null },
        ],
      },
      { id: "plist_cost", title: "Moloni Cost", prices: [] },
      { id: "plist_untitled" },
    ]
    mockFailWhen.updatePriceListPricesWorkflow = (input) =>
      input.data[0].prices.some((p: any) => p.variant_id === "var_22") ? "price locked" : undefined

    const report = await run()

    expect(report.priceListPrices).toMatchObject({ created: 1, updated: 1, failed: 1, priceLists: 0 })
    expect(named("createPriceListPricesWorkflow")[0].input).toEqual({
      data: [{ id: "plist_cost", prices: [{ amount: 0.9, currency_code: "eur", variant_id: "var_23" }] }],
    })
    expect(Object.keys(JSON.parse(syncState["products:retry"]))).toEqual(["22"])
    expect(logs.some((l) => l.level === "warn" && l.msg.includes("excluded product 24"))).toBe(true)
    expect(logs.some((l) => l.msg.includes("price-list update batch of 2 failed (price locked)"))).toBe(true)
  })

  it("falls back to create-only when existing price-list prices cannot be read", async () => {
    const P = mp({ product_id: 25, reference: "P25", price_classes: pvp2(3) })
    products = [synced(P)]
    moloniProducts = [P]
    priceLists = [{ id: "plist_pvp2", title: "Moloni PVP2" }]
    const real = graph.getMockImplementation()!
    graph.mockImplementation(async (args: any) => {
      if (args.entity === "price_list" && args.fields.includes("prices.id")) throw new Error("slow")
      return real(args)
    })
    try {
      const report = await run()
      expect(report.priceListPrices.created).toBe(1)
      expect(logs.some((l) => l.msg.includes("could not read existing price-list prices (slow)"))).toBe(true)
    } finally {
      graph.mockImplementation(real)
    }
  })

  it("dry-run only reports what it would price", async () => {
    moloniProducts = [mp({ product_id: 26, reference: "P26", price_classes: pvp2(3) })]
    await runMoloniSync(container, { entities: ["prices"], dryRun: true })
    expect(mockCalls).toEqual([])
    expect(logs.some((l) => l.msg.includes("(dry) would ensure 2 price lists"))).toBe(true)
  })
})

describe("runMoloniSync — more failure paths", () => {
  it("logs sku-rename failures and still updates the products", async () => {
    const A = mp({ product_id: 31, reference: "Y" })
    const B = mp({ product_id: 32, reference: "X" })
    products = [synced({ ...A, reference: "X" }), synced(B, { sku: "B0", items: [] })]
    moloniProducts = [A, B]
    mockFailWhen.updateProductVariantsWorkflow = () => "variant locked"
    mockFailWhen.updateInventoryItemsWorkflow = () => "item locked"

    const report = await run()

    expect(report.inventoryItems).toEqual({ renamed: 0, failed: 2 })
    const errors = logs.filter((l) => l.level === "error").map((l) => l.msg)
    expect(errors).toEqual(
      expect.arrayContaining([
        "[moloni-sync] variant var_31 temp sku X__tmp_var_31 failed: variant locked",
        "[moloni-sync] inventory item iitem_31 temp sku X__tmp_iitem_31 failed: item locked",
        "[moloni-sync] inventory item iitem_31 sku X → Y failed: item locked",
      ])
    )
    expect(report.products.updated).toBe(2)
  })

  it("keeps retry entries whose fetch errored, and survives a stock crash", async () => {
    const P = mp({ product_id: 41, reference: "P41" })
    products = [synced(P)]
    moloniProducts = [P]
    syncState["products:retry"] = JSON.stringify({
      "77": { attempts: 1, firstFailedAt: "2026-11-14T01:00:00Z", lastError: "x" },
    })
    moloni.getProductsByIds.mockImplementationOnce(async () => ({
      found: [],
      notFound: [],
      errors: [{ id: 77, message: "ECONNRESET" }],
    }))
    const real = graph.getMockImplementation()!
    graph.mockImplementation(async (args: any) => {
      if (args.entity === "inventory_level") throw new Error("stock table locked")
      return real(args)
    })
    try {
      await run()
    } finally {
      graph.mockImplementation(real)
    }
    const retry = JSON.parse(syncState["products:retry"])
    expect(retry["77"]).toEqual({ attempts: 1, firstFailedAt: "2026-11-14T01:00:00Z", lastError: "x" })
    expect(retry["41"].lastError).toContain("stock step failed: stock table locked")
    expect(logs.some((l) => l.msg.includes("could not fetch retry product 77: ECONNRESET"))).toBe(true)
  })

  it("isolates a failing stock write per item", async () => {
    const P = mp({ product_id: 51, reference: "P51", stock: 4 })
    products = [synced(P)]
    moloniProducts = [P]
    mockFailWhen.createInventoryLevelsWorkflow = () => "level exists"

    const report = await run()

    expect(report.stock).toEqual({ created: 0, updated: 0, failed: 1 })
    expect(JSON.parse(syncState["products:retry"])["51"].lastError).toContain("stock create failed: level exists")
  })
})
