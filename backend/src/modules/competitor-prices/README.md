# competitor-prices module

Competitor **price intelligence** for the store: stores competitor prices over
time, refreshes them on an **adaptive schedule**, **fuzzy-matches** competitor
listings to our (Moloni-keyed) catalog, supports **pluggable per-competitor
scraper strategies**, and runs periodic **discovery** (find new stores for our
products / detect competitors' new products) — optionally via a **Claude agent**.

Ships **inert**: no competitors/mappings/watches configured ⇒ jobs no-op.

## Data models

| Model | Purpose |
|-------|---------|
| `competitor` | A competitor e-shop. `scraper_key`, `refresh_interval_seconds`, catalog-discovery cadence. |
| `competitor_product` | Mapping our product ↔ a competitor listing. Match outcome, scraper override, **adaptive refresh state** (interval + backoff counters + `next_scrape_at`), `metadata` (match detail, discovered characteristics, `scraper_hints`). |
| `competitor_price` | One price observation per scrape (time series). Money in **minor units (cents)**. |
| `product_watch` | One of OUR products to monitor for new competitor stores (product-discovery cadence). |

## Refresh scheduling (adaptive)

Cadence resolves **mapping → competitor → global option**. After each scrape the
interval adapts (clamped to `[min, max]` + jitter):

- **price changed** → reset to base (watch closely)
- **unchanged** → `× stableFactor` (ease off)
- **error** → `× backoffFactor` (exponential backoff)

Global defaults in `medusa-config.js` options; per-competitor and per-mapping
overrides via `refresh_interval_seconds`.

## Scrapers (pluggable)

Engine = **Crawlee** `CheerioCrawler` (`scrapers/engine.ts`, dynamic ESM import)
— concurrency, retries, politeness, sessions/proxies. A scraper is a **parser**
selected per mapping/competitor by `scraper_key`:

- `generic-jsonld` (default) — schema.org `Product`/`Offer` JSON-LD + meta fallback
- `prestashop` — example site-specific scraper (template)
- `config-selectors` — **selector-driven**; reads CSS selectors from
  `metadata.scraper_hints` (this is what the parser-generation routine writes)

Register custom scrapers with `registerScraper(...)`. For JS-rendered sites,
swap `CheerioCrawler` for `PlaywrightCrawler` in the engine.

## Matching (`matching/fuzzy.ts`)

EAN → SKU/reference → fuzzy title (Dice coefficient, optionally brand-gated).
Score ≥ `autoConfirmScore` ⇒ `confirmed`, else `fuzzy` (pending review). The full
match detail is stored in `metadata.match`.

## Discovery (`discovery/`) — optional Claude agent

A `DiscoveryAgent` powers two periodic routines (cadence configurable, per-entity
`next_*_at` → global option):

- **product discovery** — "who else sells our watched product?" → new mappings
- **catalog discovery** — "what new products did this competitor launch?" → new
  unmatched mappings (then run through the matcher); can **generate a parser**
  (selector spec) for a brand-new site (`metadata.auto_generate_parser`)

Default agent is a **no-op**. Wire the Claude one from a loader when
`ANTHROPIC_API_KEY` is set:

```ts
import { setDiscoveryAgent, createAnthropicDiscoveryAgent } from "../modules/competitor-prices"
if (process.env.ANTHROPIC_API_KEY) {
  setDiscoveryAgent(createAnthropicDiscoveryAgent({ apiKey: process.env.ANTHROPIC_API_KEY }))
}
```

## Jobs

| Job | Schedule (tick) | Real cadence |
|-----|------|------|
| `scrape-competitor-prices` | `*/15 * * * *` | per-mapping `next_scrape_at` |
| `discover-competitor-catalog` | `0 3 * * *` | per-competitor `next_catalog_discovery_at` |
| `discover-product-competitors` | `0 4 * * *` | per-watch `next_discovery_at` |

## Admin API

- `GET/POST /admin/competitors`
- `GET/POST /admin/competitor-products` (GET includes `latest_price`)
- `GET/POST /admin/product-watches`
- `POST /admin/competitor-prices/scrape` `{ mapping_ids?, limit?, force? }`
- `POST /admin/competitor-prices/match` `{ mapping_ids?, limit?, rematch? }`
- `POST /admin/competitor-prices/discover` `{ mode?, competitor_ids?, watch_ids?, limit?, force? }`

Admin dashboard page: **Competitor Prices** (latest price per mapping).

## Notes / TODO

- The Anthropic agent is a **skeleton** — harden prompts, add structured-output
  validation, retries, cost caps, and competitor-domain allow-listing.
- Respect each competitor's robots.txt / ToS; scope to publicly-published prices.
- A Medusa **module link** `competitor_product ↔ product` could replace the plain
  `product_id` text column for graph joins.
