/**
 * Normalize a raw price (string or number) to MINOR units (cents), handling
 * both EU ("1.234,56" / "37,17 €") and US ("1,234.56") formatting. Returns null
 * when no sane number can be parsed. Mirrors the price-parser approach used in
 * the OSS price-intelligence stack, kept dependency-free and TS-native.
 */
export function parsePriceToMinor(input: unknown): number | null {
  if (input == null) return null
  if (typeof input === "number") {
    return Number.isFinite(input) ? Math.round(input * 100) : null
  }
  let s = String(input).trim()
  // Keep digits and separators only (drops currency symbols, NBSP, letters).
  s = s.replace(/[^\d.,-]/g, "")
  if (!s) return null

  const hasComma = s.includes(",")
  const hasDot = s.includes(".")
  if (hasComma && hasDot) {
    // The last-occurring separator is the decimal one.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".")
    } else {
      s = s.replace(/,/g, "")
    }
  } else if (hasComma) {
    // Comma is a decimal separator only when 1–2 digits trail it.
    s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "")
  }

  const n = parseFloat(s)
  return Number.isFinite(n) ? Math.round(n * 100) : null
}
