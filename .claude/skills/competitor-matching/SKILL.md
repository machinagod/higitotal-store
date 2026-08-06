---
name: competitor-matching
description: Drain the competitor-price match-review queue by judging fuzzy proposals and resolving each one via the Medusa admin API.
---

# Competitor Price Match-Review Skill

Drains the competitor-price fuzzy-match proposal queue. Each proposal pairs a
competitor listing with a candidate of OUR product; this skill judges every
pair and calls the resolve endpoint so proposals leave the queue.

## Required environment variables

| Variable | Purpose |
|---|---|
| `MEDUSA_BACKEND_URL` | Admin API base URL (default: `https://storeadmin.higitotal.pt`) |
| `MEDUSA_ADMIN_EMAIL` | Admin user email for JWT authentication |
| `MEDUSA_ADMIN_PASSWORD` | Admin user password for JWT authentication |

Configure these in the Claude Code session environment (project `.env` or
session variables) before this skill can run.

## Steps

### 1. Authenticate

POST `${MEDUSA_BACKEND_URL}/auth/user/emailpass` with
`{"email": MEDUSA_ADMIN_EMAIL, "password": MEDUSA_ADMIN_PASSWORD}`.
Read `.token` from the response — this is the Bearer token for all subsequent
admin API calls.

### 2. Fetch a batch of proposals

GET `${MEDUSA_BACKEND_URL}/admin/competitor-prices/match/review?limit=20`
with `Authorization: Bearer <token>`.

Response shape:
```json
{
  "count": 42,
  "limit": 20,
  "offset": 0,
  "items": [
    {
      "id": "...",
      "competitor_handle": "...",
      "competitor_name": "...",
      "competitor_url": "...",
      "theirs_title": "...",
      "brand": "...",
      "sku": "...",
      "ean": "...",
      "match_score": 0.85,
      "proposed_product_id": "prod_...",
      "proposed_title": "...",
      "proposed_sku": "..."
    }
  ]
}
```

Stop the loop when `count` reaches 0 or after ~10 batches (~200 proposals).

### 3. Judge each proposal (READ-ONLY research subagents)

Fan out one research subagent per proposal. Each subagent uses ONLY
WebSearch/WebFetch (no admin API calls). The subagent compares:

- **Their listing**: `theirs_title`, `brand`, `sku`, `ean`, `competitor_url`
- **Our proposal**: `proposed_title`, `proposed_sku`

**Match is VALID only if ALL three hold:**
1. Same brand/line
2. Same model/variant (spec numbers must match — Aero15 ≠ Aero8, D10 ≠ D4)
3. Same (or trivially equivalent) pack size (5L ≠ 20L, 2×5L ≠ 5L)

**Default to REJECT when uncertain.** A wrong confirm shows a bogus price
on the live comparison widget.

**Auto-reject patterns:**
- Accessory/consumable vs the appliance itself
- Different pack sizes
- Different product types
- Generic title on their side vs a specific-model title on ours
- Any mismatch in spec numbers, colours, or configurations

### 4. Resolve each proposal

POST `${MEDUSA_BACKEND_URL}/admin/competitor-prices/match/resolve` for each:

```json
{
  "mapping_id": "<id from proposal>",
  "action": "confirm" | "reject" | "reassign",
  "product_id": "<only for reassign — from GET /admin/products?q=>",
  "by": "agent"
}
```

Every pulled proposal must get exactly one resolve call.

**Reassign flow**: if the research shows the correct product is different
from `proposed_product_id`, search via
`GET /admin/products?q=<search_term>` to find the right `product_id`,
then call resolve with `action: "reassign"` and the correct `product_id`.

### 5. Loop

Repeat steps 2–4 until `count === 0` or the 10-batch cap is reached.

### 6. Report

Finish with a one-line summary:
```
Reviewed: N  Confirmed: N  Rejected: N  Reassigned: N  Queue remaining: N
```
