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

/** Customer-facing display name for a category. */
export function displayCategoryName(name: string | null | undefined): string {
  const n = (name ?? "").trim()
  return DISPLAY_NAMES[n] ?? n
}
