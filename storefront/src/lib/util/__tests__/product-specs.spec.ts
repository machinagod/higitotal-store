import { describe, expect, it } from "vitest"

import {
  buildSpecRows,
  formatDimensions,
  formatSpecValue,
  formatWeight,
  isEquipmentProduct,
  specSheetUrl,
  withTimesSign,
} from "../product-specs"

describe("specSheetUrl", () => {
  it("accepts http(s) URLs only", () => {
    expect(specSheetUrl({ spec_pdf_url: "https://cdn.example/x.pdf" })).toBe(
      "https://cdn.example/x.pdf"
    )
    expect(specSheetUrl({ spec_pdf_url: "javascript:alert(1)" })).toBeUndefined()
    expect(specSheetUrl({ spec_pdf_url: "not a url" })).toBeUndefined()
    expect(specSheetUrl({ spec_pdf_url: 42 })).toBeUndefined()
    expect(specSheetUrl(null)).toBeUndefined()
  })
})

// Intl output uses a regular space here; normalise NBSP just in case.
const n = (s: string | null) => (s ?? "").replace(/ /g, " ")

describe("formatWeight (grams in)", () => {
  it("shows grams below 1 kg", () => {
    expect(formatWeight(750)).toBe("750 g")
  })
  it("shows kg with a pt-PT decimal comma", () => {
    expect(formatWeight(2200)).toBe("2,2 kg")
    expect(n(formatWeight(204000))).toBe("204 kg")
    expect(formatWeight("1500")).toBe("1,5 kg")
  })
  it("returns null when unset or invalid", () => {
    expect(formatWeight(null)).toBeNull()
    expect(formatWeight(0)).toBeNull()
    expect(formatWeight("abc")).toBeNull()
  })
})

describe("formatDimensions (mm in)", () => {
  it("joins with × and the mm unit", () => {
    expect(formatDimensions(600, 400, 300)).toBe("600 × 400 × 300 mm")
  })
  it("needs all three", () => {
    expect(formatDimensions(600, null, 300)).toBeNull()
  })
})

describe("formatSpecValue", () => {
  it("normalises litre casing", () => {
    expect(formatSpecValue("3,8", "l")).toBe("3,8 L")
    expect(formatSpecValue("750", "ML")).toBe("750 ml")
  })
  it("uses the multiplication sign in dimensions", () => {
    expect(formatSpecValue("59 x 39 x 49", "cm")).toBe("59 × 39 × 49 cm")
    expect(formatSpecValue("600x400", "mm")).toBe("600 × 400 mm")
    expect(withTimesSign("Dimensões (C x L x A)")).toBe("Dimensões (C × L × A)")
    expect(withTimesSign("Caixa 4 x 2 L")).toBe("Caixa 4 × 2 L")
    expect(withTimesSign("Max extra")).toBe("Max extra")
  })
  it("leaves unknown units and unit-less values alone", () => {
    expect(formatSpecValue("2", "bar")).toBe("2 bar")
    expect(formatSpecValue("Inox", null)).toBe("Inox")
  })
})

describe("buildSpecRows", () => {
  it("lists attribute specs first, then core fields", () => {
    const rows = buildSpecRows(
      { weight: 2200, length: 600, width: 400, height: 300, material: "Inox" },
      [{ label: "Depósito", value: "3,8", unit: "l" }]
    )
    expect(rows).toEqual([
      { label: "Depósito", value: "3,8 L" },
      { label: "Material", value: "Inox" },
      { label: "Peso", value: "2,2 kg" },
      { label: "Dimensões", value: "600 × 400 × 300 mm" },
    ])
  })
  it("does not duplicate a label the attributes already provide", () => {
    const rows = buildSpecRows({ weight: 2200 }, [
      { label: "Peso", value: "2", unit: "kg" },
    ])
    expect(rows).toEqual([{ label: "Peso", value: "2 kg" }])
  })
  it("skips blank attribute rows", () => {
    expect(buildSpecRows({}, [{ label: "", value: "x", unit: null }])).toEqual([])
  })
})

describe("isEquipmentProduct", () => {
  it("matches machine and kitchen-equipment categories", () => {
    expect(
      isEquipmentProduct({
        categories: [{ name: "ML_Máquinas", parent_category: { name: "Máquinas de Limpeza" } }],
      })
    ).toBe(true)
    expect(isEquipmentProduct({ categories: [{ name: "EQ_Máquinas" }] })).toBe(true)
  })
  it("matches equipment collections", () => {
    expect(isEquipmentProduct({ collection: { title: "Fornos Profissionais" } })).toBe(true)
    expect(isEquipmentProduct({ collection: { title: "Máquinas de Limpeza" } })).toBe(true)
  })
  it("ignores utensils and consumables", () => {
    expect(
      isEquipmentProduct({
        categories: [{ name: "Utensílios Hotelaria", parent_category: { name: "Equipamento Hoteleiro" } }],
      })
    ).toBe(false)
    expect(
      isEquipmentProduct({
        categories: [{ name: "Concentrados", parent_category: { name: "Detergentes" } }],
        collection: { title: "Vileda" },
      })
    ).toBe(false)
    expect(isEquipmentProduct({})).toBe(false)
  })
})
