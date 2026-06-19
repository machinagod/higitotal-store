import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  PRODUCT_ATTRIBUTES_MODULE,
  groupAttributes,
  type AttrRow,
} from "../../../../../modules/product-attributes"
import type ProductAttributeModuleService from "../../../../../modules/product-attributes/service"

const LIST = { take: 1000, order: { rank: "ASC" as const } }

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<ProductAttributeModuleService>(PRODUCT_ATTRIBUTES_MODULE)
  const rows = (await svc.listProductAttributes(
    { product_id: req.params.id },
    LIST
  )) as unknown as AttrRow[]
  res.json(groupAttributes(rows))
}

type SpecInput = { label?: string; value: string; unit?: string }
type Body = { highlights?: string[]; specs?: SpecInput[] }

/**
 * Replace-all: the admin widget submits the full set of highlights + specs for
 * this product, and we rewrite the rows. Simple, idempotent, no partial-state.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve<ProductAttributeModuleService>(PRODUCT_ATTRIBUTES_MODULE)
  const id = req.params.id
  const body = (req.body ?? {}) as Body

  const existing = (await svc.listProductAttributes(
    { product_id: id },
    LIST
  )) as unknown as AttrRow[]
  if (existing.length) {
    await svc.deleteProductAttributes(existing.map((e) => e.id))
  }

  const highlights = (body.highlights ?? [])
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .map((value, rank) => ({
      product_id: id,
      kind: "highlight",
      value,
      label: null,
      unit: null,
      rank,
    }))

  const specs = (body.specs ?? [])
    .filter((s) => s && String(s.value ?? "").trim())
    .map((s, rank) => ({
      product_id: id,
      kind: "spec",
      label: (s.label ?? "").trim() || null,
      value: String(s.value).trim(),
      unit: (s.unit ?? "").trim() || null,
      rank,
    }))

  const toCreate = [...highlights, ...specs]
  const created = toCreate.length
    ? ((await svc.createProductAttributes(toCreate)) as unknown as AttrRow[])
    : []
  res.json(groupAttributes(created))
}
