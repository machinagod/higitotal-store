import type { MoloniProduct } from "../../../modules/moloni"
import {
  existingStateFromRow,
  productUpdateChanges,
  sameValue,
  toUpdateProductInput,
} from "../product-update"

const moloni = (over: Partial<MoloniProduct> = {}): MoloniProduct => ({
  product_id: 42,
  category_id: 7,
  type: 1,
  name: "Luvas Nitrilo",
  reference: "LN01",
  ean: "5600000000001",
  price: 9,
  has_stock: 1,
  stock: 3,
  taxes: [{ tax_id: 1, value: 0, tax: { tax_id: 1, name: "IVA", value: 23 } }],
  price_classes: [
    {
      product_price_class_id: 1,
      price_class_id: 11,
      value: 10.5,
      price_class: { price_class_id: 11, title: "PVP1" },
    },
  ],
  suppliers: [
    { product_id: 42, supplier_id: 3, cost_price: 4, cost_price_discounted: 3.5, reference: "" },
  ],
  ...over,
})

const ref = { productId: "prod_1", variantId: "var_1", metadata: { excluded: false, note: "x" } }

/** A product row (PRODUCT_STATE_FIELDS shape) that matches `moloni()` exactly. */
const row = (over: any = {}, variantOver: any = {}) => ({
  id: "prod_1",
  external_id: "42",
  title: "Luvas Nitrilo",
  metadata: {
    excluded: false,
    note: "x",
    moloni_product_id: 42,
    moloni_category_id: 7,
    moloni_vat_percent: 23,
  },
  categories: [{ id: "pcat_7" }],
  variants: [
    {
      id: "var_1",
      sku: "LN01",
      barcode: "5600000000001",
      manage_inventory: true,
      metadata: {
        moloni_product_id: 42,
        cost_price: 4,
        cost_price_discounted: 3.5,
        supplier_id: 3,
      },
      prices: [
        // a price-list price in the same set must be ignored
        { amount: 3.5, currency_code: "eur", price_list_id: "plist_cost", rules_count: 0 },
        { amount: 10.5, currency_code: "eur", price_list_id: null, rules_count: 0 },
      ],
      inventory_items: [{ inventory: { id: "iitem_1" } }],
      ...variantOver,
    },
  ],
  ...over,
})

const changes = (p: MoloniProduct, r: any, categoryId: string | undefined = "pcat_7") =>
  productUpdateChanges(toUpdateProductInput(p, ref, categoryId), existingStateFromRow(r))

describe("toUpdateProductInput", () => {
  it("merges synced keys over existing metadata and maps the variant", () => {
    const input = toUpdateProductInput(moloni(), ref, "pcat_7")
    expect(input).toEqual({
      id: "prod_1",
      title: "Luvas Nitrilo",
      category_ids: ["pcat_7"],
      metadata: {
        excluded: false,
        note: "x",
        moloni_product_id: 42,
        moloni_category_id: 7,
        moloni_vat_percent: 23,
      },
      variants: [
        {
          id: "var_1",
          sku: "LN01",
          barcode: "5600000000001",
          manage_inventory: true,
          prices: [{ amount: 10.5, currency_code: "eur" }],
          metadata: {
            moloni_product_id: 42,
            cost_price: 4,
            cost_price_discounted: 3.5,
            supplier_id: 3,
            supplier_reference: undefined,
          },
        },
      ],
    })
  })

  it("falls back to MOLONI-<id> sku and leaves categories/barcode untouched when unknown", () => {
    const input = toUpdateProductInput(moloni({ reference: "", ean: "" }), ref)
    expect(input.variants[0].sku).toBe("MOLONI-42")
    expect(input.variants[0].barcode).toBeUndefined()
    expect(input.category_ids).toBeUndefined()
  })
})

describe("productUpdateChanges", () => {
  it("is empty when nothing the sync owns changed", () => {
    expect(changes(moloni(), row())).toEqual([])
  })

  it("treats numeric strings and missing/null as equal", () => {
    const r = row(
      { metadata: { ...row().metadata, moloni_product_id: "42", moloni_vat_percent: "23" } },
      { prices: [{ amount: "10.5", currency_code: "EUR" }] }
    )
    expect(changes(moloni(), r)).toEqual([])
    expect(changes(moloni({ taxes: [] }), row({ metadata: { ...row().metadata, moloni_vat_percent: undefined } }))).toEqual([])
  })

  it.each([
    ["title", moloni({ name: "Novo nome" }), row()],
    ["sku", moloni({ reference: "RS0030" }), row()],
    ["barcode", moloni({ ean: "999" }), row()],
    ["manage_inventory", moloni({ has_stock: 0 }), row()],
    ["metadata.moloni_category_id", moloni({ category_id: 8 }), row()],
    ["metadata.moloni_vat_percent", moloni({ taxes: [] }), row()],
    ["variant.metadata.cost_price", moloni({ suppliers: [{ product_id: 42, supplier_id: 3, cost_price: 5, cost_price_discounted: 3.5 }] }), row()],
  ])("detects %s", (field, p, r) => {
    expect(changes(p, r)).toContain(field)
  })

  it("detects a category change only when the sync maps one", () => {
    expect(changes(moloni(), row({ categories: [{ id: "other" }] }))).toEqual(["categories"])
    expect(changes(moloni(), row({ categories: [{ id: "other" }] }), "")).toEqual([])
  })

  it("detects a price change, and a missing base price", () => {
    expect(
      changes(moloni({ price_classes: [] , price: 11 }), row())
    ).toEqual(["price"])
    // only a price-list price → no base EUR price → must update
    expect(
      changes(moloni(), row({}, { prices: [{ amount: 10.5, currency_code: "eur", price_list_id: "pl" }] }))
    ).toEqual(["price"])
    // tiered / ruled prices are not the base price
    expect(
      changes(moloni(), row({}, { prices: [
        { amount: 10.5, currency_code: "eur", rules_count: 1 },
        { amount: 10.5, currency_code: "eur", min_quantity: 10 },
        { amount: 10.5, currency_code: "usd" },
      ] }))
    ).toEqual(["price"])
    expect(changes(moloni(), row({}, { prices: undefined }))).toEqual(["price"])
  })

  it("updates a managed variant that has no inventory item (Medusa creates it)", () => {
    expect(changes(moloni(), row({}, { inventory_items: [] }))).toEqual(["inventory_item"])
    expect(
      changes(moloni({ has_stock: 0 }), row({}, { inventory_items: [], manage_inventory: false }))
    ).toEqual([])
  })

  it("ignores a barcode the product lost in Moloni (the update would not clear it)", () => {
    expect(changes(moloni({ ean: "" }), row())).toEqual([])
  })

  it("always updates when the variant is missing or different", () => {
    expect(changes(moloni(), row({ variants: [] }))).toEqual(["variant"])
    expect(changes(moloni(), row({}, { id: "var_other" }))).toEqual(["variant"])
  })
})

describe("existingStateFromRow", () => {
  it("tolerates sparse rows", () => {
    expect(existingStateFromRow({})).toEqual({
      title: null,
      categoryIds: [],
      metadata: {},
      variant: null,
    })
    expect(existingStateFromRow({ variants: [{ id: "v" }] }).variant).toEqual({
      id: "v",
      sku: null,
      barcode: null,
      manageInventory: false,
      metadata: {},
      eurAmount: null,
      hasInventoryItem: false,
    })
  })
})

describe("sameValue", () => {
  it.each([
    [1, "1", true],
    [null, undefined, true],
    ["a", "a", true],
    [1.5, 1.5000000000001, true],
    ["", null, false],
    ["a", "b", false],
    [0, null, false],
    ["abc", 1, false],
    [true, "true", true],
  ])("%p vs %p → %p", (a, b, expected) => {
    expect(sameValue(a, b)).toBe(expected)
  })
})
