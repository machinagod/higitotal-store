import { Module } from "@medusajs/framework/utils"
import ProductAttributeModuleService from "./service"

export const PRODUCT_ATTRIBUTES_MODULE = "product_attributes"

export default Module(PRODUCT_ATTRIBUTES_MODULE, {
  service: ProductAttributeModuleService,
})

export { default as ProductAttributeModuleService } from "./service"

export type AttrRow = {
  id: string
  kind: string
  label: string | null
  value: string
  unit: string | null
  rank: number
}

/** Shape the flat rows into the two API-facing groups, each ordered by rank. */
export function groupAttributes(rows: AttrRow[]) {
  const ofKind = (k: string) =>
    rows.filter((r) => r.kind === k).sort((a, b) => a.rank - b.rank)
  return {
    highlights: ofKind("highlight").map((r) => ({ id: r.id, value: r.value, rank: r.rank })),
    specs: ofKind("spec").map((r) => ({
      id: r.id,
      label: r.label,
      value: r.value,
      unit: r.unit,
      rank: r.rank,
    })),
  }
}
