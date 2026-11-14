/**
 * Category strip fitting without measuring the DOM.
 *
 * The strip shows as many leading categories inline as the bar has room for;
 * the rest go under "Mais". It used to measure the labels after hydration
 * (getBoundingClientRect / getComputedStyle in a layout effect), which forced
 * a synchronous layout on every page load and moved "Mais" once the measured
 * count replaced the server's breakpoint guess (a small layout shift).
 *
 * Instead, the label widths are computed from the font's advance widths, and
 * every "item i fits" decision becomes a container query on the strip's row
 * (`navCss`). The server renders the final layout, nothing is measured, and
 * nothing moves at hydration. Pure, so it can be unit-tested.
 */

/**
 * Advance widths (px) of the strip's font — Montserrat (app/fonts, variable)
 * at weight 600, 13px — as `[width, characters]` groups. Measured with canvas
 * measureText in Chromium; summing them overestimates a real label by < 1px
 * (kerning only ever tightens pairs), so estimates err on the safe side.
 * Re-measure if the nav font, size or weight changes.
 */
const ADVANCES: [number, string][] = [
  [2.86, "'"],
  [3.17, ",.:;‘’"],
  [3.59, " "],
  [3.61, "!"],
  [3.69, "·"],
  [3.76, "ilìíîï"],
  [3.83, "j"],
  [3.94, "|"],
  [4.15, "IÌÍÎÏ"],
  [4.52, "()"],
  [4.55, "[]"],
  [4.8, "f"],
  [4.82, "{}/\\"],
  [4.95, "1"],
  [5.0, "-"],
  [5.3, "ª"],
  [5.37, '"'],
  [5.41, "*"],
  [5.46, "r"],
  [5.49, "º"],
  [5.51, "t"],
  [5.93, "“”"],
  [6.5, "_–"],
  [6.7, "s"],
  [6.85, "J"],
  [6.92, "z"],
  [7.45, "x"],
  [7.51, "vy"],
  [7.55, "?cç"],
  [7.59, "235"],
  [7.68, "+<=>~^"],
  [7.79, "L"],
  [7.8, "`"],
  [7.83, "T"],
  [7.89, "aàáâãä"],
  [7.9, "7"],
  [8.09, "eèéêë"],
  [8.15, "69"],
  [8.18, "$S"],
  [8.26, "k"],
  [8.28, "F"],
  [8.38, "oòóôõö"],
  [8.48, "8"],
  [8.59, "Y"],
  [8.62, "Z"],
  [8.71, "EÈÉÊË"],
  [8.75, "0"],
  [8.83, "4"],
  [8.85, "uùúûü"],
  [8.9, "hnñ"],
  [8.92, "bpq"],
  [8.93, "d"],
  [9.01, "X"],
  [9.02, "g"],
  [9.18, "&"],
  [9.24, "#"],
  [9.33, "CÇ"],
  [9.44, "P"],
  [9.48, "KV"],
  [9.5, "R"],
  [9.66, "…"],
  [9.74, "AÀÁÂÃÄ"],
  [9.89, "B"],
  [10.04, "G"],
  [10.26, "UÙÚÛÜ"],
  [10.45, "€"],
  [10.53, "HNÑ"],
  [10.74, "D"],
  [10.95, "OQÒÓÔÕÖ"],
  [11.18, "%"],
  [11.95, "w"],
  [12.41, "M"],
  [13, "—"],
  [13.44, "@"],
  [13.69, "m"],
  [14.87, "W"],
]

const ADVANCE = new Map<string, number>()
for (const [w, chars] of ADVANCES) for (const ch of chars) ADVANCE.set(ch, w)
/** Characters outside the table count as a full em: never underestimated. */
const UNKNOWN = 13

/** Inline item / trigger horizontal padding (px-4 on both sides). */
const ITEM_PAD = 32
/** Gap between strip items (gap-x-1) — keep in sync with the markup. */
export const GAP = 4
/** Room the active-page dot adds to an item (7px dot + 8px gap). */
export const DOT_W = 15
/** Dropdown trigger extras: gap-x-1.5 + the 16px chevron. */
const CHEVRON_W = 22
/** Slack kept before the right-aligned "Marcas" menu. */
const BRANDS_SLACK = 16
/**
 * Extra room each threshold asks for, on top of the (already slightly high)
 * advance sums, for engines that shape a hair wider than Chromium. Kept small:
 * every px here can push the last category into "Mais" at the max row width.
 */
const SAFETY = 3

/** Rendered width (px) of `text` in the strip's font (never below the real one). */
export function textWidth(text: string): number {
  let w = 0
  for (const ch of text) w += ADVANCE.get(ch) ?? UNKNOWN
  return w
}

/**
 * Smallest strip width (content box of the row, px) at which each item shows
 * inline, and the width from which everything fits without "Mais".
 *
 * Items are laid out as: [items…] gap ["Mais"] … ["Marcas"]. With `k` items
 * inline and some overflowing, "Mais" must follow them; it carries the active
 * dot when the active category is among the overflow. Mirrors the old
 * measured fit, only from computed widths.
 */
export function navBreakpoints({
  labels,
  activeIndex,
  brands,
}: {
  labels: string[]
  /** Index of the current page's category, or -1. */
  activeIndex: number
  /** The "Marcas" trigger, when there are brands. */
  brands?: { label: string; active: boolean } | null
}): { itemMin: number[]; allFit: number } {
  const n = labels.length
  const widths = labels.map(
    (l, i) => textWidth(l) + ITEM_PAD + (i === activeIndex ? DOT_W : 0)
  )
  const brandsW = brands
    ? textWidth(brands.label) + ITEM_PAD + CHEVRON_W + (brands.active ? DOT_W : 0) + BRANDS_SLACK
    : 0
  const moreW = textWidth("Mais") + ITEM_PAD + CHEVRON_W

  const allFit =
    n === 0
      ? 0
      : Math.ceil(brandsW + widths.reduce((s, w) => s + w, 0) + GAP * (n - 1) + SAFETY)

  const itemMin: number[] = []
  let used = brandsW + moreW
  for (let i = 0; i < n; i++) {
    used += widths[i] + GAP
    // While item i is the last inline one, the active item (if later) sits
    // in "Mais", which then shows the dot too.
    const moreDot = activeIndex > i ? DOT_W : 0
    itemMin.push(Math.min(Math.ceil(used + moreDot + SAFETY), allFit))
  }
  return { itemMin, allFit }
}

/** Attribute that scopes the generated rules to the strip. */
export const NAV_SCOPE = "data-catnav"
/** Container name of the strip's row (see the row's className). */
export const NAV_CONTAINER = "catnav"
/** tailwind `brand-cyan-ink` — an active trigger's text colour. */
const ACTIVE_COLOR = "#005a87"

/**
 * The strip's visibility rules as CSS (container queries on the row):
 * - `[data-cn-i="i"]`: inline item i — hidden until the row is wide enough;
 * - `[data-cn-m="i"]`: item i in the "Mais" panel — the complement;
 * - `[data-cn-more]`: the "Mais" trigger — hidden once everything fits;
 * - `[data-cn-mdot]`: "Mais" active dot (+ active colour) — only while the
 *   active category is in the overflow.
 * Without container-query support everything stays under "Mais".
 */
export function navCss(
  { itemMin, allFit }: { itemMin: number[]; allFit: number },
  activeIndex: number
): string {
  const s = `[${NAV_SCOPE}]`
  const q = (cond: string, body: string) =>
    `@container ${NAV_CONTAINER} (${cond}){${body}}`
  let css =
    `${s} [data-cn-i]{display:none}` +
    `${s} [data-cn-m]{display:flex}` +
    `${s} [data-cn-more]{display:block}` +
    `${s} [data-cn-mdot]{display:none}`
  itemMin.forEach((min, i) => {
    css += q(
      `min-width:${min}px`,
      `${s} [data-cn-i="${i}"]{display:flex}${s} [data-cn-m="${i}"]{display:none}`
    )
  })
  if (itemMin.length) css += q(`min-width:${allFit}px`, `${s} [data-cn-more]{display:none}`)
  if (activeIndex >= 0 && activeIndex < itemMin.length) {
    // Below the active item's width it sits in the overflow: light up "Mais"
    // (brand-cyan-ink, as an active trigger) with the dot.
    css += q(
      `max-width:${itemMin[activeIndex] - 0.02}px`,
      `${s} [data-cn-mdot]{display:inline-flex}${s} [data-cn-more] button{color:${ACTIVE_COLOR}}`
    )
  }
  return css
}
