import { brandKey } from "@lib/brands"
import { isGenericCategory } from "./category-display"
import { hasThumbnail } from "./listing-order"

/**
 * Complementary categories for the PDP suggestion rails ("Complementos
 * habituais" / "Também lhe pode interessar"). Each pair links a consumable to
 * the equipment it goes in (both directions): a jumbo toilet roll should
 * suggest the jumbo dispenser, not bleach. Matched on the category NAME (case,
 * accents and punctuation ignored), so a range that exists in two places
 * ("Lavandaria" under Detergentes and under Diversey) matches both, and the
 * Moloni-generated handle suffixes don't matter.
 *
 *   consumable                 ↔ equipment
 *   Papel Higiénico            ↔ Dispensador Papel Higiénico
 *   Toalhas de Mãos            ↔ Toalheiros
 *   Papel Autocorte            ↔ Toalheiros
 *   Papel Extração Central     ↔ Toalheiros (the "papel chaminé" holders)
 *   Papel Industrial           ↔ Dispensador Papel Industrial
 *   Marquesa                   ↔ Dispensador Rolos de Marquesa
 *   Lenços                     ↔ Dispensador Lenços Faciais
 *   Higiene Pessoal            ↔ Saboneteiras (soap / gel dispensers)
 *   Concentrados               ↔ Doseadores
 *   Lavandaria                 ↔ Doseadores
 *   Cozinha                    ↔ Doseadores
 *   Ambientador e Inseticidas  ↔ Ambientadores Automáticos
 */
export const COMPLEMENT_PAIRS: readonly [string, string][] = [
  ["Papel Higiénico", "Dispensador Papel Higiénico"],
  ["Toalhas de Mãos", "Toalheiros"],
  ["Papel Autocorte", "Toalheiros"],
  ["Papel Extração Central", "Toalheiros"],
  ["Papel Industrial", "Dispensador Papel Industrial"],
  ["Marquesa", "Dispensador Rolos de Marquesa"],
  ["Lenços", "Dispensador Lenços Faciais"],
  ["Higiene Pessoal", "Saboneteiras"],
  ["Concentrados", "Doseadores"],
  ["Lavandaria", "Doseadores"],
  ["Cozinha", "Doseadores"],
  ["Ambientador e Inseticidas", "Ambientadores Automáticos"],
]

type CategoryRef = {
  id?: string | null
  name?: string | null
  parent_category?: { id?: string | null; name?: string | null } | null
}

export type RankableProduct = {
  id?: string
  title?: string | null
  thumbnail?: string | null
  categories?: CategoryRef[] | null
}

/** Category-name keys complementary to any of `names` (see COMPLEMENT_PAIRS). */
export function complementNameKeys(
  names: (string | null | undefined)[],
  pairs: readonly [string, string][] = COMPLEMENT_PAIRS
): Set<string> {
  const keys = new Set(names.map((n) => brandKey(n)).filter(Boolean))
  const out = new Set<string>()
  for (const [a, b] of pairs) {
    if (keys.has(brandKey(a))) out.add(brandKey(b))
    if (keys.has(brandKey(b))) out.add(brandKey(a))
  }
  return out
}

/** The names of a product's categories AND their parents. */
export function categoryNames(p: RankableProduct): string[] {
  const names: string[] = []
  for (const c of p.categories ?? []) {
    if (c?.name) names.push(c.name)
    if (c?.parent_category?.name) names.push(c.parent_category.name)
  }
  return names
}

/** Ids of the categories in `all` whose name is one of `nameKeys`. */
export function categoryIdsForKeys(
  all: { id?: string | null; name?: string | null }[],
  nameKeys: Set<string>
): string[] {
  return all
    .filter((c) => c.id && nameKeys.has(brandKey(c.name)))
    .map((c) => c.id as string)
}

const STOP = new Set(["para", "com", "sem", "rolos", "rolo", "branco", "branca", "negro", "preto"])

/** Distinctive title words (≥ 4 letters, accent-free) — "Jumbo", "Chaminé"… */
function titleTokens(title: string | null | undefined): Set<string> {
  const words = (title ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
  return new Set(words.filter((w) => w.length >= 4 && !STOP.has(w) && !/^\d/.test(w)))
}

/**
 * How closely `candidate` relates to `current`, lower is closer:
 *   0 — in a complementary category (paper ↔ its dispenser),
 *   1 — same family, another range (Toalhas de Mãos for a Papel Higiénico),
 *   2 — same category (an alternative to the product itself),
 *   3 — unrelated.
 */
export function relationTier(current: RankableProduct, candidate: RankableProduct): number {
  const complements = complementNameKeys(categoryNames(current))
  const own = new Set((current.categories ?? []).map((c) => c?.id).filter(Boolean))
  // The same range filed twice ("Lavandaria" under Detergentes and Diversey)
  // counts as the same category — but not two unrelated "Outros".
  const ownNames = new Set(
    (current.categories ?? [])
      .map((c) => c?.name)
      .filter((n) => n && !isGenericCategory(n))
      .map((n) => brandKey(n))
  )
  const parents = new Set(
    (current.categories ?? []).map((c) => c?.parent_category?.id).filter(Boolean)
  )
  const cats = candidate.categories ?? []

  if (cats.some((c) => complements.has(brandKey(c?.name)))) return 0
  if (
    cats.some(
      (c) =>
        (c?.id && own.has(c.id)) ||
        (c?.name && !isGenericCategory(c.name) && ownNames.has(brandKey(c.name)))
    )
  )
    return 2
  if (cats.some((c) => c?.parent_category?.id && parents.has(c.parent_category.id))) return 1
  return 3
}

/**
 * Order suggestion candidates for `current`, deterministically: by
 * {@link relationTier}, then products with a photo first, then shared
 * distinctive title words (a "Jumbo" roll → the "Jumbo" dispenser), then
 * co-purchase `frequency` (bought-together data, when known), then input
 * order. Drops `current` itself and duplicates.
 */
export function rankSuggestions<T extends RankableProduct>(
  current: RankableProduct,
  candidates: T[],
  { frequency }: { frequency?: Map<string, number> } = {}
): T[] {
  const tokens = titleTokens(current.title)
  const seen = new Set<string>()
  const rows: { p: T; tier: number; img: number; overlap: number; freq: number; i: number }[] = []

  candidates.forEach((p, i) => {
    if (!p?.id || p.id === current.id || seen.has(p.id)) return
    seen.add(p.id)
    const own = titleTokens(p.title)
    let overlap = 0
    own.forEach((t) => {
      if (tokens.has(t)) overlap++
    })
    rows.push({
      p,
      tier: relationTier(current, p),
      img: hasThumbnail(p) ? 0 : 1,
      overlap,
      freq: frequency?.get(p.id) ?? 0,
      i,
    })
  })

  rows.sort(
    (a, b) =>
      a.tier - b.tier ||
      a.img - b.img ||
      b.overlap - a.overlap ||
      b.freq - a.freq ||
      a.i - b.i
  )
  return rows.map((r) => r.p)
}
