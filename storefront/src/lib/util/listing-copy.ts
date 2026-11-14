/** "1 produto" / "123 produtos" (pt-PT digit grouping). */
export function productCountLabel(count: number): string {
  const n = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0))
  return `${n.toLocaleString("pt-PT")} ${n === 1 ? "produto" : "produtos"}`
}

/**
 * Meta description for a collection listing. Collections are mostly brands
 * ("Vileda") but some are product lines ("Fornos Profissionais"), so the
 * wording works for both.
 */
export function collectionMetaDescription(title: string): string {
  return `${title}: gama para uso profissional no catálogo Higitotal. Peça preço e disponibilidade.`
}

/**
 * Decode a search term from a route segment. `decodeURIComponent` throws on a
 * malformed escape ("%E0%A4%A"); fall back to the raw segment then.
 */
export function decodeSearchTerm(raw: string): string {
  try {
    return decodeURIComponent(raw).trim()
  } catch {
    return raw.trim()
  }
}
