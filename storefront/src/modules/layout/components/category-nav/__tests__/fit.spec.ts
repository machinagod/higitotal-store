import { describe, expect, it } from "vitest"
import { DOT_W, GAP, navBreakpoints, navCss, textWidth } from "../fit"

// Live labels and their real Chromium widths (Montserrat 600, 13px), measured
// from the rendered strip — the table must never underestimate them.
const LIVE: [string, number][] = [
  ["Detergentes", 83.61],
  ["Papel", 37.91],
  ["Utensílios de Limpeza", 146.75],
  ["Máquinas de Limpeza", 146.52],
  ["Equipamento Hoteleiro", 156.44],
  ["Descartáveis", 85.5],
  ["Sacos", 38.62],
  ["Ambientadores e Inseticidas", 190.81],
  ["Suportes e Dispensadores", 174.45],
]
const labels = LIVE.map(([l]) => l)
const brands = { label: "Marcas", active: false }

describe("textWidth", () => {
  it("never underestimates, and stays within 1px", () => {
    for (const [label, real] of LIVE) {
      const w = textWidth(label)
      expect(w).toBeGreaterThanOrEqual(real)
      expect(w - real).toBeLessThan(1)
    }
  })

  it("counts unknown characters as a full em", () => {
    expect(textWidth("✓")).toBe(13)
  })
})

describe("navBreakpoints", () => {
  it("needs more room for each further item", () => {
    const { itemMin, allFit } = navBreakpoints({ labels, activeIndex: -1, brands })
    for (let i = 1; i < itemMin.length; i++) {
      expect(itemMin[i]).toBeGreaterThan(itemMin[i - 1])
    }
    expect(itemMin[itemMin.length - 1]).toBe(allFit)
  })

  it("reserves room for 'Mais' while something overflows", () => {
    const { itemMin } = navBreakpoints({ labels: ["Papel", "Equipamento Hoteleiro"], activeIndex: -1, brands: null })
    const papel = textWidth("Papel") + 32
    const mais = textWidth("Mais") + 32 + 22
    // First item alone: itself + gap + "Mais".
    expect(itemMin[0]).toBe(Math.ceil(mais + papel + GAP + 3))
  })

  it("drops 'Mais' when everything fits", () => {
    const { itemMin, allFit } = navBreakpoints({ labels: ["Papel", "Sacos"], activeIndex: -1, brands: null })
    const total = textWidth("Papel") + textWidth("Sacos") + 64 + GAP
    expect(allFit).toBe(Math.ceil(total + 3))
    expect(itemMin[1]).toBe(allFit)
  })

  it("accounts for the active dot on the item and on 'Mais'", () => {
    const idle = navBreakpoints({ labels, activeIndex: -1, brands })
    const active = navBreakpoints({ labels, activeIndex: 3, brands })
    // Before the active item: "Mais" carries the dot.
    expect(active.itemMin[0] - idle.itemMin[0]).toBe(DOT_W)
    // From the active item on: the item carries it.
    expect(active.itemMin[3] - idle.itemMin[3]).toBe(DOT_W)
    expect(active.allFit - idle.allFit).toBe(DOT_W)
  })

  it("keeps room for the 'Marcas' menu", () => {
    const without = navBreakpoints({ labels, activeIndex: -1, brands: null })
    const withB = navBreakpoints({ labels, activeIndex: -1, brands })
    const marcas = textWidth("Marcas") + 32 + 22 + 16
    expect(Math.abs(withB.itemMin[0] - without.itemMin[0] - marcas)).toBeLessThanOrEqual(1)
  })
})

describe("navCss", () => {
  it("emits one container query per item plus the 'Mais' rule", () => {
    const bp = navBreakpoints({ labels, activeIndex: -1, brands })
    const css = navCss(bp, -1)
    expect(css.match(/@container catnav/g)?.length).toBe(labels.length + 1)
    expect(css).toContain(`(min-width:${bp.itemMin[0]}px){[data-catnav] [data-cn-i="0"]{display:flex}`)
    expect(css).toContain(`(min-width:${bp.allFit}px){[data-catnav] [data-cn-more]{display:none}}`)
    expect(css).not.toContain("max-width")
  })

  it("lights 'Mais' only while the active item is in the overflow", () => {
    const bp = navBreakpoints({ labels, activeIndex: 5, brands })
    const css = navCss(bp, 5)
    expect(css).toContain(`(max-width:${bp.itemMin[5] - 0.02}px){[data-catnav] [data-cn-mdot]{display:inline-flex}`)
  })
})
