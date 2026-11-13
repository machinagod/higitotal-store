import { describe, expect, it } from "vitest"
import { fallbackInlineClass, fallbackMoreClass, fitCount } from "../fit"

describe("fitCount", () => {
  const widths = [116, 74, 182, 182, 192, 120, 78, 230, 210]

  it("shows everything (no 'Mais') when it all fits", () => {
    expect(fitCount([100, 100], 204, 80, 4)).toBe(2)
    expect(fitCount([100, 100], 203, 80, 4)).toBe(1)
  })

  it("reserves room for the 'Mais' trigger when something overflows", () => {
    // 116+74+182 + 3 gaps(12) + Mais(84) = 468
    expect(fitCount(widths, 468, 84, 4)).toBe(3)
    expect(fitCount(widths, 467, 84, 4)).toBe(2)
  })

  it("scales with the available width", () => {
    const at = (px: number) => fitCount(widths, px, 84, 4)
    expect(at(700)).toBeLessThan(at(1000))
    expect(at(1000)).toBeLessThan(at(1300))
    expect(at(5000)).toBe(widths.length)
  })

  it("handles empty / no room", () => {
    expect(fitCount([], 1000, 80, 4)).toBe(0)
    expect(fitCount(widths, 0, 80, 4)).toBe(0)
    expect(fitCount(widths, 50, 80, 4)).toBe(0)
  })
})

describe("fallback classes", () => {
  it("are complementary between the strip and the 'Mais' panel", () => {
    for (let i = 0; i < 9; i++) {
      const inline = fallbackInlineClass(i)
      const more = fallbackMoreClass(i)
      // Exactly one of them is visible at the base breakpoint.
      expect(inline.startsWith("hidden")).toBe(!more.startsWith("hidden"))
    }
    expect(fallbackInlineClass(0)).toBe("flex")
    expect(fallbackInlineClass(4)).toBe("hidden medium:flex")
    expect(fallbackMoreClass(4)).toBe("flex medium:hidden")
    expect(fallbackInlineClass(8)).toBe("hidden")
    expect(fallbackMoreClass(8)).toBe("flex")
  })
})
