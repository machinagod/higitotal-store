---
name: competitor-matching
description: Drain the competitor-price fuzzy match-review queue. Pulls PROPOSAL mappings from the Medusa admin API, fans out research subagents to judge each one under strict same-brand/model/pack-size rules, then resolves (confirm/reject/reassign) every proposal. Loops up to 10 batches (~200 proposals) or until the queue is empty.
---

# Competitor Price Match-Review Skill

## Prerequisites

These env vars **must** be set in the session environment before this skill runs:

| Var | Purpose |
|-----|---------|
| `MEDUSA_ADMIN_EMAIL` | Admin user email for the Medusa backend |
| `MEDUSA_ADMIN_PASSWORD` | Admin user password |
| `MEDUSA_BACKEND_URL` | Backend base URL (default: `https://storeadmin.higitotal.pt`) |

If any are missing the skill will fail at Step 1 with a 401 and should abort immediately.

---

## Workflow

Work through each step in order. Mark each step done in your scratchpad before moving on.

### Step 1 — Authenticate

```
POST ${MEDUSA_BACKEND_URL:-https://storeadmin.higitotal.pt}/auth/user/emailpass
Content-Type: application/json

{ "email": "$MEDUSA_ADMIN_EMAIL", "password": "$MEDUSA_ADMIN_PASSWORD" }
```

Read `.token` from the JSON response. Store it as `ADMIN_TOKEN`. All subsequent requests use:
```
Authorization: Bearer $ADMIN_TOKEN
```

If you get a 401, **stop immediately** and report: "AUTH FAILED — MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD not set or invalid."

### Step 2 — Pull the review queue (repeat up to 10 batches)

```
GET /admin/competitor-prices/match/review?limit=20
Authorization: Bearer $ADMIN_TOKEN
```

Response shape:
```json
{
  "count": 42,
  "limit": 20,
  "offset": 0,
  "items": [
    {
      "id": "cpmap_...",
      "competitor_handle": "mediamarkt-pt",
      "competitor_name": "MediaMarkt PT",
      "competitor_url": "https://...",
      "theirs_title": "Samsung Galaxy S24 128GB Preto",
      "brand": "Samsung",
      "sku": "SM-S921BZKDEUB",
      "ean": "8806095076706",
      "match_score": 0.87,
      "proposed_product_id": "prod_...",
      "proposed_title": "Samsung Galaxy S24 128GB Black",
      "proposed_sku": "SM-S921B-128-BLK"
    }
  ]
}
```

If `count == 0`, the queue is empty — report summary and stop.

### Step 3 — Judge each proposal (fan out research subagents)

Spawn one research subagent per proposal (up to 20 in parallel). Each subagent:

- Uses **WebSearch and WebFetch only** — must NOT call the admin API
- Researches both the competitor listing and our proposed product
- Returns a verdict: `confirm`, `reject`, or `reassign` plus a one-line reason

**STRICT matching rule** — a match is valid ONLY when ALL of the following hold:

1. **Same brand AND product line** — "Leukoplast" ≠ "Hansaplast", "Hartmann" ≠ "Medline"
2. **Same model / variant** — Aero15 ≠ Aero8, D10 ≠ D4, 500mg ≠ 250mg
3. **Same (or trivially equivalent) pack size** — 5L ≠ 20L, 2×5L ≠ 5L, 100ct ≠ 50ct. "Trivially equivalent" means only unit-label differences (e.g. "1 L" vs "1000 mL").

**Auto-REJECT** any of these without researching:
- Accessory / consumable for the appliance vs the appliance itself
- Different product type entirely
- Generic our-title vs specific competitor brand
- SKU or model number suffix differs in a spec-meaningful way
- **Uncertain** — default to REJECT; a wrong confirm shows a bogus price on the live storefront

**Reassign** only when research finds a clearly better matching product in our catalog (search
`GET /admin/products?q={search_term}` to find it, then use `product_id` in the resolve call).

### Step 4 — Resolve each proposal

For every item pulled in Step 2, call exactly one resolve — no skips:

```
POST /admin/competitor-prices/match/resolve
Authorization: Bearer $ADMIN_TOKEN
Content-Type: application/json

{
  "mapping_id": "<id from the review item>",
  "action": "confirm" | "reject" | "reassign",
  "product_id": "<only for reassign>",
  "by": "agent"
}
```

Count confirms, rejects, and reassigns as you go.

### Step 5 — Loop

After resolving all items in the batch:

- If `count` from the last GET was > 0 and you haven't hit 10 batches yet, go to Step 2.
- If `count == 0` or batch limit reached, proceed to Step 6.

### Step 6 — Final report

Output exactly one line:

```
Reviewed <N>, confirmed <C>, rejected <R>, reassigned <A>. Queue remaining: <count>.
```

Where `count` is the `count` field from the last GET (0 if the queue was drained).

---

## Error handling

| Situation | Action |
|-----------|--------|
| 401 on auth | Stop, report AUTH FAILED |
| 401 mid-run (token expired) | Re-authenticate (Step 1) once, retry |
| 404 on resolve | Skip that item, log mapping_id |
| 500 on resolve | Retry once; if still failing, skip and log |
| Research subagent returns no verdict | Default to `reject` |
