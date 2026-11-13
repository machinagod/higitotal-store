import { describe, expect, it } from "vitest"
import { matchByName, moveActive, normalize, toProductHit } from "../suggestions"

describe("search suggestions", () => {
  it("matches accent-insensitively, from 2 characters, with a limit", () => {
    const items = [
      { name: "Assistência Técnica", keywords: ["reparacao"] },
      { name: "SC Johnson (Deb)" },
      { name: "Papel Higiénico" },
    ]
    expect(normalize("Assistência")).toBe("assistencia")
    expect(matchByName(items, "assist", 5).map((i) => i.name)).toEqual([
      "Assistência Técnica",
    ])
    expect(matchByName(items, "reparação", 5)).toHaveLength(1)
    expect(matchByName(items, "johnson", 5)[0].name).toBe("SC Johnson (Deb)")
    expect(matchByName(items, "p", 5)).toEqual([])
    expect(matchByName(items, "  ", 5)).toEqual([])
    expect(matchByName(items, "e", 5)).toEqual([])
    expect(matchByName(items, "ic", 1)).toHaveLength(1)
  })

  it("reads the reference from variants[].sku (Search Module hits)", () => {
    const hit = toProductHit({
      id: "prod_1",
      title: "Dispensador Jumbo ABS Negro",
      handle: "ae57602",
      thumbnail: "https://x/y.png",
      categories: [{ name: "Dispensador Papel Higiénico", handle: "d" }],
      variants: [{ sku: null }, { sku: "AE57602" }],
    })
    expect(hit).toEqual({
      id: "prod_1",
      title: "Dispensador Jumbo ABS Negro",
      handle: "ae57602",
      thumbnail: "https://x/y.png",
      sku: "AE57602",
      category: "Dispensadores de Papel Higiénico",
    })
  })

  it("falls back to legacy variant_sku / objectID and tolerates gaps", () => {
    expect(toProductHit({ objectID: "p2", variant_sku: ["X1"] }).sku).toBe("X1")
    expect(toProductHit({ objectID: "p2", variant_sku: "X2" }).id).toBe("p2")
    const bare = toProductHit({ id: "p3", title: "T", handle: "h", thumbnail: "" })
    expect(bare.sku).toBeUndefined()
    expect(bare.category).toBeUndefined()
    expect(bare.thumbnail).toBeUndefined()
  })

  it("moves the active option with wrap-around", () => {
    expect(moveActive(-1, 1, 3)).toBe(0)
    expect(moveActive(-1, -1, 3)).toBe(2)
    expect(moveActive(0, 1, 3)).toBe(1)
    expect(moveActive(2, 1, 3)).toBe(0)
    expect(moveActive(0, -1, 3)).toBe(2)
    expect(moveActive(0, 1, 0)).toBe(-1)
  })
})
