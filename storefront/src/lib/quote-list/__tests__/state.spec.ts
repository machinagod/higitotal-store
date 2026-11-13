import { describe, expect, it } from "vitest"

import {
  EMPTY_QUOTE,
  MAX_NOTE_LENGTH,
  MAX_QUANTITY,
  MAX_QUOTE_LINES,
  QUOTE_STORAGE_KEY,
  QuoteItem,
  addItem,
  buildQuoteRequestItems,
  clampQuantity,
  cleanNote,
  clearItems,
  findLine,
  lineCount,
  normaliseItem,
  parseQuantityInput,
  parseStored,
  productCountLabel,
  quoteControlLabel,
  removeItem,
  sameLine,
  serialize,
  setNote,
  setQuantity,
  unitCount,
} from "../state"

const drip = {
  productId: "prod_1",
  handle: "drip-floor-2l",
  title: "Drip Floor (2L)",
  sku: "DX1002",
  thumbnail: "https://cdn.example/drip.png",
}
const suma = { productId: "prod_2", handle: "suma-bac", title: "Suma Bac D10" }

describe("clampQuantity / parseQuantityInput", () => {
  it("keeps integers 1–9999", () => {
    expect(clampQuantity(1)).toBe(1)
    expect(clampQuantity(42)).toBe(42)
    expect(clampQuantity(9999)).toBe(9999)
  })

  it("floors, clamps and defaults to 1", () => {
    expect(clampQuantity(2.7)).toBe(2)
    expect(clampQuantity(0)).toBe(1)
    expect(clampQuantity(-3)).toBe(1)
    expect(clampQuantity(10000)).toBe(MAX_QUANTITY)
    expect(clampQuantity("12")).toBe(12)
    expect(clampQuantity("abc")).toBe(1)
    expect(clampQuantity(NaN)).toBe(1)
    expect(clampQuantity(Infinity)).toBe(1)
    expect(clampQuantity(undefined)).toBe(1)
  })

  it("reads typed input as digits, null while empty", () => {
    expect(parseQuantityInput("")).toBeNull()
    expect(parseQuantityInput("abc")).toBeNull()
    expect(parseQuantityInput("12")).toBe(12)
    expect(parseQuantityInput(" 1 2 ")).toBe(12)
    expect(parseQuantityInput("0")).toBe(1)
    expect(parseQuantityInput("123456")).toBe(MAX_QUANTITY)
  })
})

describe("cleanNote", () => {
  it("caps at 300 characters and drops blanks", () => {
    expect(cleanNote("x".repeat(400))).toHaveLength(MAX_NOTE_LENGTH)
    expect(cleanNote("   ")).toBeUndefined()
    expect(cleanNote(3)).toBeUndefined()
    expect(cleanNote("caixas de 6 ")).toBe("caixas de 6 ")
  })
})

describe("line identity", () => {
  it("matches product and variant, treating a missing variant as its own key", () => {
    expect(sameLine({ productId: "a" }, { productId: "a" })).toBe(true)
    expect(sameLine({ productId: "a", variantId: "v1" }, { productId: "a", variantId: "v1" })).toBe(true)
    expect(sameLine({ productId: "a", variantId: "v1" }, { productId: "a", variantId: "v2" })).toBe(false)
    expect(sameLine({ productId: "a", variantId: "v1" }, { productId: "a" })).toBe(false)
    expect(sameLine({ productId: "a" }, { productId: "b" })).toBe(false)
  })
})

describe("addItem", () => {
  it("adds a new line at the end", () => {
    const r = addItem(EMPTY_QUOTE, drip, 3)
    expect(r.status).toBe("added")
    expect(r.items).toEqual([{ ...drip, quantity: 3 }])
    const r2 = addItem(r.items, suma)
    expect(r2.items.map((i) => i.productId)).toEqual(["prod_1", "prod_2"])
    expect(r2.line).toEqual({ ...suma, quantity: 1 })
  })

  it("increases the quantity of an existing product, keeping its position", () => {
    let items = addItem(EMPTY_QUOTE, drip, 2).items
    items = addItem(items, suma).items
    const r = addItem(items, drip, 5)
    expect(r.status).toBe("increased")
    expect(r.items).toHaveLength(2)
    expect(r.items[0].quantity).toBe(7)
    expect(r.line?.quantity).toBe(7)
  })

  it("caps the merged quantity at 9999", () => {
    const items = addItem(EMPTY_QUOTE, drip, 9990).items
    expect(addItem(items, drip, 50).items[0].quantity).toBe(MAX_QUANTITY)
  })

  it("keeps different variants of a product apart", () => {
    let items = addItem(EMPTY_QUOTE, { ...drip, variantId: "v1" }).items
    items = addItem(items, { ...drip, variantId: "v2" }).items
    expect(items).toHaveLength(2)
  })

  it("refuses a new product once the list has 100 lines, but still merges", () => {
    let items: readonly QuoteItem[] = EMPTY_QUOTE
    for (let i = 0; i < MAX_QUOTE_LINES; i++) {
      items = addItem(items, { productId: `p${i}`, handle: `h${i}`, title: `T${i}` }).items
    }
    expect(items).toHaveLength(MAX_QUOTE_LINES)
    const full = addItem(items, drip)
    expect(full.status).toBe("full")
    expect(full.items).toBe(items)
    expect(addItem(items, { productId: "p0", handle: "h0", title: "T0" }).status).toBe("increased")
  })

  it("does not mutate the input list", () => {
    const items = addItem(EMPTY_QUOTE, drip).items
    const snapshot = JSON.stringify(items)
    addItem(items, drip, 4)
    expect(JSON.stringify(items)).toBe(snapshot)
  })
})

describe("setQuantity / setNote / removeItem / clearItems", () => {
  const base = addItem(addItem(EMPTY_QUOTE, drip, 2).items, suma, 1).items

  it("sets a clamped quantity and returns the same list when nothing changes", () => {
    expect(setQuantity(base, drip, 12)[0].quantity).toBe(12)
    expect(setQuantity(base, drip, 0)[0].quantity).toBe(1)
    expect(setQuantity(base, drip, 2)).toBe(base)
    expect(setQuantity(base, { productId: "nope" }, 3)).toBe(base)
  })

  it("sets, caps and clears a note", () => {
    const withNote = setNote(base, suma, "Entrega em março")
    expect(withNote[1].note).toBe("Entrega em março")
    expect(setNote(base, suma, "n".repeat(500))[1].note).toHaveLength(MAX_NOTE_LENGTH)
    const cleared = setNote(withNote, suma, "  ")
    expect(cleared[1]).not.toHaveProperty("note")
    expect(setNote(base, suma, "")).toBe(base)
  })

  it("removes a line and clears the list", () => {
    expect(removeItem(base, drip).map((i) => i.productId)).toEqual(["prod_2"])
    expect(removeItem(base, { productId: "nope" })).toBe(base)
    expect(clearItems()).toEqual([])
  })

  it("counts lines and units, finds a line", () => {
    expect(lineCount(base)).toBe(2)
    expect(unitCount(base)).toBe(3)
    expect(findLine(base, suma)?.title).toBe("Suma Bac D10")
    expect(findLine(base, { productId: "nope" })).toBeUndefined()
  })
})

describe("storage format", () => {
  it("uses a versioned key and round-trips", () => {
    expect(QUOTE_STORAGE_KEY).toBe("ht_quote_v1")
    const items = setNote(addItem(EMPTY_QUOTE, drip, 4).items, drip, "urgente")
    const raw = serialize(items)
    expect(JSON.parse(raw)).toEqual({ v: 1, items: [{ ...drip, quantity: 4, note: "urgente" }] })
    expect(parseStored(raw)).toEqual(items)
  })

  it("returns an empty list for missing, corrupt or foreign data", () => {
    expect(parseStored(null)).toEqual([])
    expect(parseStored("")).toEqual([])
    expect(parseStored("{not json")).toEqual([])
    expect(parseStored("[]")).toEqual([])
    expect(parseStored(JSON.stringify({ v: 2, items: [drip] }))).toEqual([])
    expect(parseStored(JSON.stringify({ v: 1, items: "x" }))).toEqual([])
  })

  it("drops invalid lines, merges duplicates and cuts at 100 lines", () => {
    const lines = [
      { ...drip, quantity: 2 },
      { ...drip, quantity: 3 },
      { productId: "x" }, // no handle/title
      "junk",
      { ...suma, quantity: "7", note: 12, price: 9 },
      ...Array.from({ length: 120 }, (_, i) => ({
        productId: `p${i}`,
        handle: `h${i}`,
        title: `T${i}`,
        quantity: 1,
      })),
    ]
    const parsed = parseStored(JSON.stringify({ v: 1, items: lines }))
    expect(parsed).toHaveLength(MAX_QUOTE_LINES)
    expect(parsed[0]).toEqual({ ...drip, quantity: 5 })
    expect(parsed[1]).toEqual({ ...suma, quantity: 7 })
  })

  it("normalises a single line", () => {
    expect(normaliseItem({ ...drip, quantity: 0, variantId: " " })).toEqual({ ...drip, quantity: 1 })
    expect(normaliseItem({ ...drip, thumbnail: "javascript:alert(1)" })).not.toHaveProperty("thumbnail")
    expect(normaliseItem(null)).toBeNull()
    expect(normaliseItem([])).toBeNull()
  })
})

describe("buildQuoteRequestItems", () => {
  it("builds the request lines with the public product URL", () => {
    const items = setNote(
      addItem(addItem(EMPTY_QUOTE, drip, 3).items, suma, 12).items,
      suma,
      "  caixas de 6 "
    )
    expect(
      buildQuoteRequestItems(items, { baseUrl: "https://store.higitotal.pt/", countryCode: "pt" })
    ).toEqual([
      {
        sku: "DX1002",
        title: "Drip Floor (2L)",
        quantity: 3,
        url: "https://store.higitotal.pt/pt/products/drip-floor-2l",
      },
      {
        title: "Suma Bac D10",
        quantity: 12,
        note: "caixas de 6",
        url: "https://store.higitotal.pt/pt/products/suma-bac",
      },
    ])
  })
})

describe("labels", () => {
  it("pluralises and names the header control", () => {
    expect(productCountLabel(1)).toBe("1 produto")
    expect(productCountLabel(5)).toBe("5 produtos")
    expect(quoteControlLabel(0)).toBe("Pedir orçamento (lista vazia)")
    expect(quoteControlLabel(3)).toBe("Orçamento: 3 produtos")
  })
})
