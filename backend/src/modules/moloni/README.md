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
| `src/jobs/sync-moloni.ts` | Scheduled job (daily 03:00). No-ops if the module isn't configured. |
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
