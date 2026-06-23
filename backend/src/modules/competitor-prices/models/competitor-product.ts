import { model } from "@medusajs/framework/utils"
import { Competitor } from "./competitor"
import { CompetitorPrice } from "./competitor-price"

/**
 * Mapping between one of OUR products (Moloni-keyed) and a competitor listing.
 * Holds the matching outcome, the per-mapping scraper override, and the adaptive
 * refresh state (interval + backoff counters + next_scrape_at). Our side is kept
 * as plain ids/sku + `metadata` so the module stays decoupled from the product
 * module; a Medusa module link can be layered on later for graph joins.
 */
export const CompetitorProduct = model
  .define("competitor_product", {
    id: model.id().primaryKey(),
    competitor: model.belongsTo(() => Competitor, { mappedBy: "products" }),
    prices: model.hasMany(() => CompetitorPrice, {
      mappedBy: "competitor_product",
    }),

    // ── Our side (resolved via fuzzy/EAN/ref matching) ──
    product_id: model.text().nullable(),
    variant_id: model.text().nullable(),
    product_sku: model.text().nullable(), // Moloni reference

    // ── Competitor side ──
    competitor_url: model.text().nullable(),
    competitor_sku: model.text().nullable(),
    competitor_ean: model.text().nullable(),
    title: model.text().nullable(),
    brand: model.text().nullable(),

    // ── Unit normalization ──
    // How many of OUR comparable units the competitor listing represents (e.g. a
    // "2 × 5L" pack mapped to our single 5L = 2). Competitor prices are divided
    // by this to get a per-unit price comparable to ours. `pack_label` is just
    // for display (e.g. "2 × 5L").
    pack_units: model.number().default(1),
    pack_label: model.text().nullable(),

    // ── Matching outcome ──
    // unmatched | fuzzy | confirmed | rejected
    match_status: model.text().default("unmatched"),
    // ean | sku | brand_ref | fuzzy | manual
    match_method: model.text().nullable(),
    match_score: model.number().nullable(), // 0..100 confidence

    // ── Scraper selection (falls back to competitor.scraper_key) ──
    scraper_key: model.text().nullable(),

    // ── Adaptive refresh scheduling ──
    refresh_interval_seconds: model.number().nullable(), // product-level override
    current_interval_seconds: model.number().nullable(), // last computed interval
    consecutive_failures: model.number().default(0),
    consecutive_unchanged: model.number().default(0),
    last_scraped_at: model.dateTime().nullable(),
    next_scrape_at: model.dateTime().nullable(),
    last_price: model.number().nullable(), // minor units; for change detection
    // Outcome of the last scrape (ok | not_found | error) + reason on failure —
    // failed scrapes do NOT create a price row, they just update these.
    last_status: model.text().nullable(),
    last_error: model.text().nullable(),

    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
  })
  .indexes([
    { on: ["product_id"] },
    { on: ["match_status"] },
    { on: ["next_scrape_at"] },
  ])
