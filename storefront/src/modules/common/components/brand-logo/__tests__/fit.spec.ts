import { describe, expect, it } from "vitest"

import { fitLogo } from "../index"

describe("fitLogo", () => {
  it("caps wide marks by width and compact marks by height", () => {
    expect(fitLogo({ src: "/w.svg", width: 400, height: 50 }, 112, 30)).toEqual({ width: 112, height: 14 })
    expect(fitLogo({ src: "/c.svg", width: 100, height: 100 }, 112, 30)).toEqual({ width: 30, height: 30 })
  })

  it("lets a compact mark grow by its scale", () => {
    expect(fitLogo({ src: "/c.svg", width: 100, height: 100, scale: 1.3 }, 112, 30)).toEqual({ width: 39, height: 39 })
  })
})
