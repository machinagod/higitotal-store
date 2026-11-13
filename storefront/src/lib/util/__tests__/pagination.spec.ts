import { describe, expect, it } from "vitest"
import { pageWindow, parsePage } from "../pagination"

describe("parsePage", () => {
  it("parses ?page= into a page number ≥ 1", () => {
    expect(parsePage("3")).toBe(3)
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage("abc")).toBe(1)
    expect(parsePage("0")).toBe(1)
    expect(parsePage("-2")).toBe(1)
  })
})

describe("pageWindow", () => {
  it("shows every page for short ranges", () => {
    expect(pageWindow(1, 0)).toEqual([])
    expect(pageWindow(1, 1)).toEqual([1])
    expect(pageWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it("windows long ranges around the current page", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, 4, "gap", 20])
    expect(pageWindow(9, 20)).toEqual([1, "gap", 8, 9, 10, "gap", 20])
    expect(pageWindow(20, 20)).toEqual([1, "gap", 17, 18, 19, 20])
  })

  it("fills a one-page gap instead of an ellipsis", () => {
    expect(pageWindow(4, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20])
    expect(pageWindow(5, 9)).toEqual([1, "gap", 4, 5, 6, "gap", 9])
    expect(pageWindow(3, 8)).toEqual([1, 2, 3, 4, "gap", 8])
    expect(pageWindow(6, 9)).toEqual([1, "gap", 5, 6, 7, 8, 9])
  })

  it("clamps out-of-range pages", () => {
    expect(pageWindow(99, 10)).toEqual([1, "gap", 7, 8, 9, 10])
    expect(pageWindow(-3, 10)).toEqual([1, 2, 3, 4, "gap", 10])
  })
})
