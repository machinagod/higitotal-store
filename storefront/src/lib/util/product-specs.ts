import { displayCategoryName } from "@lib/util/category-display"

/**
 * Product-page spec formatting. Medusa stores `weight` in grams (the Moloni
 * sync writes e.g. 2200 for a 2 L bottle, 204000 for a 200 L drum) and
 * `length`/`width`/`height` in millimetres. Output follows pt-PT conventions
 * ("2,2 kg", "600 × 400 × 300 mm").
 */

const nf = (max: number) =>
  new Intl.NumberFormat("pt-PT", { maximumFractionDigits: max })

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : (v as number)
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null
}

/** Grams → "750 g" below 1 kg, "2,2 kg" from 1 kg. Null when unset/invalid. */
export function formatWeight(grams: unknown): string | null {
  const g = num(grams)
  if (g === null) return null
  if (g < 1000) return `${nf(0).format(g)} g`
  return `${nf(2).format(g / 1000)} kg`
}

/** Millimetres → "600 × 400 × 300 mm" (needs all three). */
export function formatDimensions(
  length: unknown,
  width: unknown,
  height: unknown
): string | null {
  const dims = [length, width, height].map(num)
  if (dims.some((d) => d === null)) return null
  return `${dims.map((d) => nf(1).format(d as number)).join(" × ")} mm`
}

/** Normalise a unit string to pt-PT/SI casing ("l" → "L", "ML" → "ml"). */
export function normalizeUnit(unit: string | null | undefined): string {
  const u = (unit ?? "").trim()
  const lower = u.toLowerCase()
  if (lower === "l" || lower === "lt" || lower === "lts") return "L"
  if (lower === "ml") return "ml"
  if (lower === "kg") return "kg"
  if (lower === "g" || lower === "gr") return "g"
  if (lower === "mm" || lower === "cm" || lower === "m") return lower
  return u
}

/** "59 x 39 x 49" / "C x L x A" → proper multiplication sign. */
export function withTimesSign(text: string): string {
  return text
    .replace(/(\d)\s*[xX]\s*(?=\d)/g, "$1 × ")
    .replace(/\b([A-Z])\s+[xX]\s+(?=[A-Z]\b)/g, "$1 × ")
}

/** "3,8" + "l" → "3,8 L"; value alone when there is no unit. */
export function formatSpecValue(
  value: string | null | undefined,
  unit?: string | null
): string {
  const v = withTimesSign((value ?? "").trim())
  const u = normalizeUnit(unit)
  return u ? `${v} ${u}` : v
}

export type SpecRow = { label: string; value: string }

type SpecSource = {
  material?: string | null
  weight?: number | string | null
  origin_country?: string | null
  type?: { value?: string | null } | null
  length?: number | string | null
  width?: number | string | null
  height?: number | string | null
}

type AttributeSpec = {
  label: string | null
  value: string
  unit: string | null
}

/**
 * Rows for the "Características" table: curated attribute specs first (from
 * the product_attributes module), then the core product fields.
 */
export function buildSpecRows(
  product: SpecSource,
  attributeSpecs: AttributeSpec[] = []
): SpecRow[] {
  const rows: SpecRow[] = attributeSpecs
    .filter((s) => (s.label ?? "").trim() && (s.value ?? "").trim())
    .map((s) => ({
      label: withTimesSign((s.label as string).trim()),
      value: formatSpecValue(s.value, s.unit),
    }))

  const has = (label: string) =>
    rows.some((r) => r.label.toLowerCase() === label.toLowerCase())
  const push = (label: string, value: string | null | undefined) => {
    if (value && !has(label)) rows.push({ label, value })
  }

  push("Material", product.material?.trim())
  push("Peso", formatWeight(product.weight))
  push("Dimensões", formatDimensions(product.length, product.width, product.height))
  push("País de origem", product.origin_country?.trim()?.toUpperCase())
  push("Tipo", product.type?.value?.trim())
  return rows
}

/**
 * Category / collection names (raw or display) that mark a product as a piece
 * of equipment Higitotal's technical team installs and maintains. Utensils and
 * consumables under "Equipamento Hoteleiro" are deliberately not included.
 */
const EQUIPMENT_CATEGORY_NAMES = [
  "EQ_Máquinas",
  "ML_Máquinas",
  "Máquinas de Limpeza",
  "Equipamento de Cozinha e Lavandaria",
].map((n) => n.toLowerCase())

const EQUIPMENT_COLLECTION_NAMES = [
  "Fornos Profissionais",
  "Máquinas de Limpeza",
].map((n) => n.toLowerCase())

type EquipmentSource = {
  categories?:
    | {
        name?: string | null
        parent_category?: { name?: string | null } | null
      }[]
    | null
  collection?: { title?: string | null } | null
}

const matches = (name: string | null | undefined, list: string[]) => {
  const raw = (name ?? "").trim()
  if (!raw) return false
  return (
    list.includes(raw.toLowerCase()) ||
    list.includes(displayCategoryName(raw).toLowerCase())
  )
}

/**
 * The product's spec sheet (ficha técnica) URL from `metadata.spec_pdf_url`.
 * Metadata is admin-settable, so only an absolute http(s) URL is accepted —
 * rejects javascript:/data:/vbscript: etc.
 */
export function specSheetUrl(
  metadata: Record<string, unknown> | null | undefined
): string | undefined {
  const raw = metadata?.["spec_pdf_url"]
  if (typeof raw !== "string") return undefined
  try {
    const parsed = new URL(raw)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : undefined
  } catch {
    return undefined
  }
}

/** True for machines/kitchen equipment (shows the "Instalação e manutenção" panel). */
export function isEquipmentProduct(product: EquipmentSource): boolean {
  if (matches(product.collection?.title, EQUIPMENT_COLLECTION_NAMES)) return true
  return (product.categories ?? []).some(
    (c) =>
      matches(c.name, EQUIPMENT_CATEGORY_NAMES) ||
      matches(c.parent_category?.name, ["máquinas de limpeza"])
  )
}
