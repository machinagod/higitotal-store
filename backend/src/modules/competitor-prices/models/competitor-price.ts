import { model } from "@medusajs/framework/utils"
import { CompetitorProduct } from "./competitor-product"

/**
 * A single price observation for a competitor mapping (time series — one row per
 * scrape). Monetary values are stored in MINOR units (cents) to stay
 * integer-precise. `raw` keeps the extracted payload for debugging/audit.
 */
export const CompetitorPrice = model
  .define("competitor_price", {
    id: model.id().primaryKey(),
    competitor_product: model.belongsTo(() => CompetitorProduct, {
      mappedBy: "prices",
    }),
    price: model.number().nullable(), // minor units (cents) — listing price
    // Per-unit price (listing price ÷ mapping.pack_units), minor units — the
    // figure comparable to our own product price.
    unit_price: model.number().nullable(),
    // OUR product price at the moment of extraction (minor units, EUR) — snapshot
    // so historical comparisons stay accurate.
    our_price: model.number().nullable(),
    original_price: model.number().nullable(), // pre-discount, minor units
    currency_code: model.text().default("EUR"),
    in_stock: model.boolean().nullable(),
    availability: model.text().nullable(),
    status: model.text().default("ok"), // ok | not_found | error
    error_message: model.text().nullable(),
    raw: model.json().nullable(),
    scraped_at: model.dateTime(),
  })
  .indexes([{ on: ["scraped_at"] }])
