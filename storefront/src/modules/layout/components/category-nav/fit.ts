/**
 * How many leading nav items fit inline in `available` px, given each item's
 * width, the gap between items and the width of the "Mais" trigger that must
 * follow them when not everything fits. Pure, so it can be unit-tested.
 */
export function fitCount(
  widths: number[],
  available: number,
  moreWidth: number,
  gap: number
): number {
  const n = widths.length
  if (n === 0 || available <= 0) return 0

  const total = widths.reduce((s, w) => s + w, 0) + gap * (n - 1)
  if (total <= available) return n

  // Not all fit: reserve room for the "Mais" trigger after the last inline one.
  let used = moreWidth
  let count = 0
  for (const w of widths) {
    const next = used + w + gap
    if (next > available) break
    used = next
    count++
  }
  return count
}

/**
 * Server-render fallback before the strip is measured: a breakpoint-based
 * guess (Tailwind classes) of how many items show inline, tuned to the live
 * labels — ~4 at 1024px, 5 from 1280px, 7 from 1440px.
 */
export function fallbackInlineClass(index: number): string {
  if (index < 4) return "flex"
  if (index < 5) return "hidden medium:flex"
  if (index < 7) return "hidden large:flex"
  return "hidden"
}

/** The matching "Mais" panel visibility for the fallback above. */
export function fallbackMoreClass(index: number): string {
  if (index < 4) return "hidden"
  if (index < 5) return "flex medium:hidden"
  if (index < 7) return "flex large:hidden"
  return "flex"
}
