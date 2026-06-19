import { model } from "@medusajs/framework/utils"

/**
 * Amazon-style product characteristics, stored per Medusa product.
 *
 * Two kinds share one table via the `kind` discriminator:
 *   - "highlight" → an "About this item" bullet (uses `value` only)
 *   - "spec"      → a key/value technical row (uses `label` + `value` + optional `unit`)
 *
 * `product_id` is the owning Medusa product id (no cross-module FK — Medusa
 * modules are isolated; we query by product_id from custom routes). `rank` orders
 * items within a (product, kind) group.
 */
export const ProductAttribute = model
  .define("product_attribute", {
    id: model.id().primaryKey(),
    product_id: model.text(),
    kind: model.text(), // "highlight" | "spec"
    label: model.text().nullable(),
    value: model.text(),
    unit: model.text().nullable(),
    rank: model.number().default(0),
  })
  .indexes([{ on: ["product_id"] }, { on: ["product_id", "kind"] }])
