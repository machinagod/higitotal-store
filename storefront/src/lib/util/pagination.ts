/** `?page=` value → a page number ≥ 1 (missing or garbage → 1). */
export function parsePage(page?: string | null): number {
  const n = parseInt(page ?? "", 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

/**
 * Page numbers to show around `page` (1-based), with "gap" markers:
 * always the first and last page, plus the current page and one neighbour
 * on each side. Short ranges (≤ 7 pages) are shown in full.
 *
 *   pageWindow(1, 20)  → [1, 2, 3, 4, "gap", 20]
 *   pageWindow(9, 20)  → [1, "gap", 8, 9, 10, "gap", 20]
 */
export function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const total = Math.max(0, Math.floor(totalPages))
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const current = Math.min(Math.max(Math.floor(page) || 1, 1), total)
  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  // Near either end, show a few more so the window doesn't collapse to 2 items.
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p))

  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)

  const out: (number | "gap")[] = []
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1]
    if (prev !== undefined && p - prev > 1) {
      // A gap of exactly one page is shown as that page, not an ellipsis.
      if (p - prev === 2) out.push(prev + 1)
      else out.push("gap")
    }
    out.push(p)
  })
  return out
}
