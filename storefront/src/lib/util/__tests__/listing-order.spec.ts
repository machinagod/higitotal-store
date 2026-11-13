import { describe, expect, it } from "vitest"
import {
  chunkCount,
  hasThumbnail,
  imagesFirst,
  inIdOrder,
  orderListing,
  pageIds,
} from "../listing-order"
import { isPriceSort, resolveSort, sortProducts } from "../sort-products"

const p = (
  id: string,
  opts: {
    thumbnail?: string | null
    title?: string
    created_at?: string
    prices?: number[]
  } = {}
) => ({
  id,
  thumbnail: opts.thumbnail ?? null,
  title: opts.title ?? id,
  created_at: opts.created_at ?? "2026-01-01T00:00:00Z",
  variants: (opts.prices ?? []).map((amount) => ({
    calculated_price: { calculated_amount: amount },
  })),
})

const ids = (xs: { id: string }[]) => xs.map((x) => x.id)

describe("imagesFirst", () => {
  it("puts products with a thumbnail first, keeping order inside each group", () => {
    const list = [
      p("a"),
      p("b", { thumbnail: "https://x/b.png" }),
      p("c"),
      p("d", { thumbnail: "https://x/d.png" }),
      p("e", { thumbnail: "  " }),
    ]
    expect(ids(imagesFirst(list))).toEqual(["b", "d", "a", "c", "e"])
  })

  it("does not mutate the input and handles empty lists", () => {
    const list = [p("a"), p("b", { thumbnail: "x" })]
    imagesFirst(list)
    expect(ids(list)).toEqual(["a", "b"])
    expect(imagesFirst([])).toEqual([])
  })

  it("treats blank/null thumbnails as missing", () => {
    expect(hasThumbnail({ thumbnail: null })).toBe(false)
    expect(hasThumbnail({ thumbnail: "" })).toBe(false)
    expect(hasThumbnail({})).toBe(false)
    expect(hasThumbnail({ thumbnail: "https://x/y.png" })).toBe(true)
  })
})

describe("sortProducts", () => {
  const list = [
    p("old", { created_at: "2025-01-01T00:00:00Z", title: "Zeta", prices: [30] }),
    p("new", { created_at: "2026-06-01T00:00:00Z", title: "álcool gel", prices: [10] }),
    p("mid", { created_at: "2025-06-01T00:00:00Z", title: "Balde 10 L", prices: [20] }),
    p("free", { created_at: "2024-01-01T00:00:00Z", title: "Balde 2 L" }),
  ]

  it("sorts newest first", () => {
    expect(ids(sortProducts(list, "created_at"))).toEqual(["new", "mid", "old", "free"])
  })

  it("sorts by name with pt-PT collation (accents, numbers)", () => {
    expect(ids(sortProducts(list, "name_asc"))).toEqual(["new", "free", "mid", "old"])
  })

  it("sorts by price with unpriced products last in both directions", () => {
    expect(ids(sortProducts(list, "price_asc"))).toEqual(["new", "mid", "old", "free"])
    expect(ids(sortProducts(list, "price_desc"))).toEqual(["old", "mid", "new", "free"])
  })

  it("follows the given id order for relevance", () => {
    expect(ids(sortProducts(list, "relevance", ["mid", "free", "old"]))).toEqual([
      "mid",
      "free",
      "old",
      "new",
    ])
  })

  it("returns a copy", () => {
    const copy = [...list]
    sortProducts(list, "name_asc")
    expect(list).toEqual(copy)
  })
})

describe("resolveSort", () => {
  it("defaults to newest, or relevance for an id list", () => {
    expect(resolveSort(undefined, { catalogMode: false, hasIds: false })).toBe("created_at")
    expect(resolveSort(undefined, { catalogMode: true, hasIds: true })).toBe("relevance")
    expect(resolveSort("bogus", { catalogMode: false, hasIds: false })).toBe("created_at")
  })

  it("drops price sorts in catalog mode", () => {
    expect(resolveSort("price_asc", { catalogMode: true, hasIds: false })).toBe("created_at")
    expect(resolveSort("price_desc", { catalogMode: false, hasIds: false })).toBe("price_desc")
    expect(resolveSort("name_asc", { catalogMode: true, hasIds: false })).toBe("name_asc")
  })

  it("only allows relevance with an id list", () => {
    expect(resolveSort("relevance", { catalogMode: false, hasIds: false })).toBe("created_at")
    expect(resolveSort("relevance", { catalogMode: false, hasIds: true })).toBe("relevance")
  })

  it("knows which sorts need prices", () => {
    expect(isPriceSort("price_asc")).toBe(true)
    expect(isPriceSort("name_asc")).toBe(false)
  })
})

describe("orderListing + pageIds", () => {
  // 30 products, every third one has an image; created_at descending by index.
  const list = Array.from({ length: 30 }, (_, i) =>
    p(`p${i}`, {
      thumbnail: i % 3 === 0 ? `https://x/${i}.png` : null,
      created_at: new Date(Date.UTC(2026, 0, 30 - i)).toISOString(),
    })
  )

  it("orders the whole set images-first on top of the sort", () => {
    const ordered = orderListing(list, "created_at")
    expect(ids(ordered.slice(0, 10))).toEqual(
      [0, 3, 6, 9, 12, 15, 18, 21, 24, 27].map((i) => `p${i}`)
    )
    expect(ordered[10].id).toBe("p1")
    expect(ordered).toHaveLength(30)
  })

  it("pages are slices of one global order (no duplicates, no gaps)", () => {
    const ordered = orderListing(list, "created_at")
    const seen = [1, 2, 3].flatMap((page) => pageIds(ordered, page, 12))
    expect(seen).toEqual(ids(ordered))
    expect(pageIds(ordered, 4, 12)).toEqual([])
  })

  it("clamps bad page numbers to the first page", () => {
    const ordered = orderListing(list, "created_at")
    expect(pageIds(ordered, 0, 2)).toEqual(["p0", "p3"])
    expect(pageIds(ordered, NaN, 2)).toEqual(["p0", "p3"])
  })
})

describe("inIdOrder", () => {
  it("restores the requested order and drops missing ids", () => {
    const rows = [p("b"), p("a"), p("c")]
    expect(ids(inIdOrder(rows, ["a", "x", "c", "b"]))).toEqual(["a", "c", "b"])
  })
})

describe("chunkCount", () => {
  it("computes how many index requests a filter set needs, capped", () => {
    expect(chunkCount(0, 1000, 5000)).toBe(1)
    expect(chunkCount(1000, 1000, 5000)).toBe(1)
    expect(chunkCount(1048, 1000, 5000)).toBe(2)
    expect(chunkCount(99999, 1000, 5000)).toBe(5)
  })
})
