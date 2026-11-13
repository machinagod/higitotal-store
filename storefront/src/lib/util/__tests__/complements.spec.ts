import { describe, expect, it } from "vitest"
import {
  categoryIdsForKeys,
  categoryNames,
  complementNameKeys,
  rankSuggestions,
  relationTier,
} from "../complements"

const papel = { id: "c-papel", name: "Papel" }
const suportes = { id: "c-sup", name: "Suportes e Dispensadores" }
const detergentes = { id: "c-det", name: "Detergentes" }

const cat = (id: string, name: string, parent?: { id: string; name: string }) => ({
  id,
  name,
  parent_category: parent ?? null,
})

const jumbo = {
  id: "jumbo",
  title: "Papel Higiénico Jumbo Amoos 2F 180m (12 rolos)",
  thumbnail: "https://x/j.png",
  categories: [cat("c-ph", "Papel Higiénico", papel)],
}

const product = (
  id: string,
  title: string,
  categories: ReturnType<typeof cat>[],
  thumbnail: string | null = "https://x/i.png"
) => ({ id, title, thumbnail, categories })

const dispJumbo = product("disp-jumbo", "Dispensador Jumbo ABS Negro", [
  cat("c-dph", "Dispensador Papel Higiénico", suportes),
])
const dispOther = product("disp-other", "Dispensador Rolo Doméstico Inox", [
  cat("c-dph", "Dispensador Papel Higiénico", suportes),
])
const towels = product("towels", "Toalha de Mãos Zig-Zag 2F", [
  cat("c-tm", "Toalhas de Mãos", papel),
])
const otherRoll = product("roll", "Papel Higiénico Jumbo Renova Eco", [
  cat("c-ph", "Papel Higiénico", papel),
])
const bleach = product("bleach", "Lixívia Tradicional (4x5L)", [
  cat("c-out", "Outros", detergentes),
])

describe("complementNameKeys", () => {
  it("maps both ways", () => {
    expect(Array.from(complementNameKeys(["Papel Higiénico"]))).toEqual([
      "dispensadorpapelhigienico",
    ])
    expect(Array.from(complementNameKeys(["Toalheiros"])).sort()).toEqual([
      "papelautocorte",
      "papelextracaocentral",
      "toalhasdemaos",
    ])
    expect(complementNameKeys(["Sacos", null]).size).toBe(0)
  })
})

describe("categoryNames / categoryIdsForKeys", () => {
  it("collects names with parents, resolves ids by name", () => {
    expect(categoryNames(jumbo)).toEqual(["Papel Higiénico", "Papel"])
    expect(
      categoryIdsForKeys(
        [
          { id: "a", name: "Dispensador Papel Higiénico" },
          { id: "b", name: "Toalheiros" },
          { id: null, name: "Dispensador Papel Higiénico" },
        ],
        complementNameKeys(["Papel Higiénico"])
      )
    ).toEqual(["a"])
  })
})

describe("relationTier", () => {
  it("ranks complement < family < same category < unrelated", () => {
    expect(relationTier(jumbo, dispJumbo)).toBe(0)
    expect(relationTier(jumbo, towels)).toBe(1)
    expect(relationTier(jumbo, otherRoll)).toBe(2)
    expect(relationTier(jumbo, bleach)).toBe(3)
  })

  it("treats the same range filed twice as the same category, but not 'Outros'", () => {
    const a = product("a", "A", [cat("l1", "Lavandaria", detergentes)])
    const b = product("b", "B", [cat("l2", "Lavandaria", { id: "div", name: "Diversey" })])
    expect(relationTier(a, b)).toBe(2)
    const o1 = product("o1", "O1", [cat("o-p", "Outros", papel)])
    const o2 = product("o2", "O2", [cat("o-d", "Outros", detergentes)])
    expect(relationTier(o1, o2)).toBe(3)
  })

  it("detergents ↔ doseadores", () => {
    const conc = product("c", "Detergente Concentrado", [cat("cc", "Concentrados", detergentes)])
    const dos = product("d", "Doseador Detergente", [cat("dd", "Doseadores", detergentes)])
    expect(relationTier(conc, dos)).toBe(0)
    expect(relationTier(dos, conc)).toBe(0)
  })

  it("copes with products without categories", () => {
    expect(relationTier({ id: "x" }, { id: "y", categories: null })).toBe(3)
  })
})

describe("rankSuggestions", () => {
  it("puts the matching dispenser first for a jumbo roll", () => {
    const freq = new Map([
      ["bleach", 40],
      ["roll", 10],
      ["towels", 5],
    ])
    const ranked = rankSuggestions(
      jumbo,
      [bleach, otherRoll, towels, dispOther, dispJumbo, jumbo, bleach],
      { frequency: freq }
    )
    expect(ranked.map((p) => p.id)).toEqual([
      "disp-jumbo", // complement + shares "jumbo"
      "disp-other",
      "towels",
      "roll",
      "bleach",
    ])
  })

  it("keeps images first within a tier, then frequency, then input order", () => {
    const noImg = { ...dispJumbo, id: "noimg", thumbnail: null }
    const ranked = rankSuggestions(jumbo, [noImg, dispOther])
    expect(ranked.map((p) => p.id)).toEqual(["disp-other", "noimg"])

    const a = { ...bleach, id: "a" }
    const b = { ...bleach, id: "b" }
    expect(
      rankSuggestions(jumbo, [a, b], { frequency: new Map([["b", 2]]) }).map((p) => p.id)
    ).toEqual(["b", "a"])
    expect(rankSuggestions(jumbo, [a, b]).map((p) => p.id)).toEqual(["a", "b"])
  })
})
