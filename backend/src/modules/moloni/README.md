# Moloni → Medusa bridge

Imports the **product catalog (skeleton), stock and customers** from
[Moloni](https://www.moloni.pt) into Medusa, plus Moloni **price classes** as
Medusa **Price Lists** and supplier **cost** as variant metadata + a "Moloni
Cost" price list.

## Pieces

| Path | Role |
|------|------|
| `src/modules/moloni/` | The Moloni module: API client + `MoloniModuleService` (paginated readers). Pure data source — no Medusa writes. |
| `src/modules/moloni/client.ts` | **Swap point.** Self-contained Node port of the Moloni SDK. Replace `createMoloniClient()` with the published `moloni-client` package when available — same method surface. |
| `src/workflows/moloni/` | `runMoloniSync()` orchestration + pure `mappers.ts`. Calls core-flows to upsert into Medusa. |
| `src/jobs/sync-moloni.ts` | Scheduled job (every 5 minutes, incremental). No-ops if the module isn't configured. |
| `src/api/admin/moloni/sync/route.ts` | `POST /admin/moloni/sync` — manual, admin-authenticated trigger. |
| `src/scripts/sync-moloni.ts` | `medusa exec` runner; **defaults to dry-run**. |

## Configuration

Set in `.env` (all five required to enable the module):

```
MOLONI_CLIENT_ID=...
MOLONI_CLIENT_SECRET=...
MOLONI_USER=...
MOLONI_PASSWORD=...
MOLONI_COMPANY_ID=240211     # Higitotal
# MOLONI_SANDBOX=true        # optional
```

## Mapping & idempotency

Every entity upserts by its Moloni id — re-runs update in place, never duplicate.

- **Products** carry the Moloni id in `external_id`; categories/customers/price
  lists in `metadata.moloni_*`.
- Each Moloni product → one Medusa product with a single default variant
  (`sku = reference`, `barcode = ean`). Imported as **draft**.
- Default EUR price = **PVP1** price class (falls back to `product.price`).
- Each Moloni **price class** → a Medusa **Price List**; `value` → that variant's
  price in the list.
- Supplier **cost** → variant `metadata` (`cost_price`, `cost_price_discounted`,
  `supplier_id`, `supplier_reference`) **and** a "Moloni Cost" price list.
- **Stock** → inventory level at the existing stock location (`product.stock` /
  summed `warehouses[].stock`).
- **Customers** → Medusa customers (company-style). Missing emails get a
  synthesized `moloni-<number>@no-email.invalid` placeholder flagged via
  `metadata.moloni_no_email`.

## Running

First run — observe with a dry run, then a small committed batch, then full:

`medusa exec` consumes leading-dash flags itself, so the runner takes
**positional** args (`commit`, `limit=N`, `entities=...`, `status=...`):

```bash
# dry run: fetches from Moloni, writes nothing
npx medusa exec ./src/scripts/sync-moloni.ts

# commit a few products end-to-end
npx medusa exec ./src/scripts/sync-moloni.ts commit limit=5

# full sync
npx medusa exec ./src/scripts/sync-moloni.ts commit
```

> ⚠️ The connected database in local dev points at **production**. The script
> defaults to dry-run for that reason; `commit` writes for real.

## Robustness (incremental runs must never wedge)

Every run is incremental from the `products` cursor, so one failing product
must not abort the run — otherwise the cursor never advances, every run
re-syncs the whole catalog and floods the event bus.

- **SKU moves** (`sku-plan.ts`, `sku-sync.ts`): Moloni references can move
  between products, but Medusa variant/inventory-item skus are unique and a
  variant's sku change is *not* propagated to its inventory item. Each run plans
  all sku movements: colliding variant renames go through a temporary
  `<sku>__tmp_<id>` sku, inventory items are renamed to their variant's (new)
  sku — which also heals drift left by earlier runs — and a product whose sku
  is genuinely taken (duplicate reference in Moloni, orphan inventory item) is
  skipped with an error naming both Moloni ids.
- **Failure isolation** (`batch.ts`): a failing create/update/price/stock batch
  is replayed item by item; failures are logged
  (`[moloni-sync] product <id> (<sku>) failed: …`) and counted in the report.
- **Retry list** (`retry-state.ts`): the products cursor always advances; failed
  Moloni ids are stored as JSON under the `products:retry` key of the cursor
  table and fetched by id (`products/getOne`) on later runs until they succeed
  (dropped after 3 consecutive "not found" replies; ≤100 fetched per run).
- **Missing price sets** (`price-sets.ts`, `ensure-variant-price-sets.ts`):
  existing variants with no price set get one (default EUR price) in the
  products step; price-list prices / stock for variants still lacking a price
  set / inventory item are skipped and retried instead of throwing.
- **No pointless updates** (`product-update.ts`, `category-update.ts`): products
  and categories are only updated when a field the sync owns changed, so
  re-syncs don't emit `product.updated` / `product-category.updated` floods.
