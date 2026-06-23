import { parsePriceToMinor } from "../scrapers/price"

describe("parsePriceToMinor", () => {
  it("returns null for null/undefined", () => {
    expect(parsePriceToMinor(null)).toBeNull()
    expect(parsePriceToMinor(undefined)).toBeNull()
  })

  it("handles numbers (to minor units)", () => {
    expect(parsePriceToMinor(12.34)).toBe(1234)
    expect(parsePriceToMinor(0)).toBe(0)
    expect(parsePriceToMinor(Infinity)).toBeNull()
    expect(parsePriceToMinor(NaN)).toBeNull()
  })

  it("returns null when no digits remain", () => {
    expect(parsePriceToMinor("abc")).toBeNull()
    expect(parsePriceToMinor("")).toBeNull()
  })

  it("parses EU comma-decimal with currency symbols", () => {
    expect(parsePriceToMinor("12,34 €")).toBe(1234)
    expect(parsePriceToMinor("€ 0,99")).toBe(99)
    expect(parsePriceToMinor("-5,00")).toBe(-500)
  })

  it("parses EU thousands + decimal", () => {
    expect(parsePriceToMinor("1.234,56")).toBe(123456)
  })

  it("parses US thousands + decimal", () => {
    expect(parsePriceToMinor("1,234.56")).toBe(123456)
  })

  it("treats comma with 3+ trailing digits as thousands", () => {
    expect(parsePriceToMinor("1,500")).toBe(150000)
  })

  it("parses plain integers and dot-decimals", () => {
    expect(parsePriceToMinor("1234")).toBe(123400)
    expect(parsePriceToMinor("37.17")).toBe(3717)
  })
})
