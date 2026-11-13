/**
 * Customer-facing names for catalogue categories. Category names come from the
 * Moloni sync (bookkeeping groups), so some are internal codes ("EQ_Máquinas")
 * or need grammar fixes; renaming them in Medusa would be overwritten by the
 * next sync, so the storefront maps them for display here.
 */
const DISPLAY_NAMES: Record<string, string> = {
  "EQ_Máquinas": "Equipamento de Cozinha e Lavandaria",
  "ML_Máquinas": "Máquinas de Limpeza",
  "Utensílios Limpeza": "Utensílios de Limpeza",
  "Utensílios Hotelaria": "Utensílios de Hotelaria",
  "Ambientador e Inseticidas": "Ambientadores e Inseticidas",
  "Transporte e Industria": "Transporte e Indústria",
  "Papel Extração Central": "Papel de Extração Central",
  "Dispensador Papel Industrial": "Dispensadores de Papel Industrial",
  "Dispensador Papel Higiénico": "Dispensadores de Papel Higiénico",
  "Dispensador Lenços Faciais": "Dispensadores de Lenços Faciais",
  "Dispensador Rolos de Marquesa": "Dispensadores de Rolos de Marquesa",
  "Marquesa": "Rolos de Marquesa",
}

/**
 * Supplier-brand root categories (the Moloni sync files products under the
 * supplier group). `display` is the brand's own casing, used everywhere the
 * brand is named (nav "Marcas", H1, breadcrumbs); `short` is the brand alone,
 * used to qualify generic sub-groups ("Produtos" → "Produtos SC Johnson").
 * Keep in sync with `BRANDS` in @lib/brands (names there must match `display`).
 */
const BRAND_CATEGORY_NAMES: Record<string, { display: string; short: string }> = {
  "SCJohnson (DEB)": { display: "SC Johnson (Deb)", short: "SC Johnson" },
  "SC Johnson (DEB)": { display: "SC Johnson (Deb)", short: "SC Johnson" },
  Diversey: { display: "Diversey", short: "Diversey" },
  Unilever: { display: "Unilever", short: "Unilever" },
  Vileda: { display: "Vileda", short: "Vileda" },
  "Vileda Swep": { display: "Vileda Swep", short: "Vileda Swep" },
  Taski: { display: "Taski", short: "Taski" },
}

/**
 * Generic sub-groups qualified by a NON-brand parent, where "<name> <parent>"
 * would read badly in Portuguese ("Outros Papel").
 */
const GENERIC_WITH_PARENT: Record<string, Record<string, string>> = {
  Outros: {
    Detergentes: "Outros detergentes",
    Papel: "Outros produtos de papel",
  },
}

/** Bookkeeping groups that are not real browsable categories. */
export function isInternalCategory(name: string | null | undefined): boolean {
  const n = (name ?? "").trim()
  return /^(EQ_|ML_)/.test(n) || n.includes("Maquinas / Acessórios") || n === "Indiferenciado"
}

/**
 * Generic group names that say nothing on their own ("Outros", "Produtos") —
 * avoid using them alone as a card eyebrow; prefer the parent or the brand.
 */
export function isGenericCategory(name: string | null | undefined): boolean {
  return ["Outros", "Produtos", "Acessórios e Complementos"].includes((name ?? "").trim())
}

/** The brand a (root) category name stands for, if it is a supplier group. */
export function brandCategoryName(
  name: string | null | undefined
): { display: string; short: string } | undefined {
  return BRAND_CATEGORY_NAMES[(name ?? "").trim()]
}

/**
 * Customer-facing display name for a category.
 *
 * Pass the parent category's (raw) name when you have it: generic sub-groups
 * ("Produtos", "Acessórios e Complementos", "Outros") are then qualified by it,
 * so a page/breadcrumb never reads just "Produtos":
 *   - under a brand → "Produtos SC Johnson", "Acessórios e Complementos Diversey"
 *   - "Outros" under Papel → "Outros produtos de papel"; other parents →
 *     "Outros · <Parent>".
 */
export function displayCategoryName(
  name: string | null | undefined,
  parentName?: string | null
): string {
  const n = (name ?? "").trim()
  const brand = BRAND_CATEGORY_NAMES[n]
  const base = brand?.display ?? DISPLAY_NAMES[n] ?? n

  const parent = (parentName ?? "").trim()
  if (!parent || !isGenericCategory(n)) return base

  const parentBrand = BRAND_CATEGORY_NAMES[parent]
  if (parentBrand) return `${base} ${parentBrand.short}`

  const special = GENERIC_WITH_PARENT[n]?.[parent]
  if (special) return special
  return `${base} · ${displayCategoryName(parent)}`
}
