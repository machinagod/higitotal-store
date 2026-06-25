---
name: competitor-matching
description: Resolve the competitor-price match-review queue — confirm/reject/reassign the fuzzy product-match PROPOSALS the deterministic matcher could not auto-confirm. Use when asked to "review competitor matches", "drain the match queue", "confirm fuzzy matches", or on a schedule. The backend never calls an LLM; *you* are the matcher, run as a Claude Code worker (mirrors the competitor-discovery skill).
---

# Competitor match-review worker

The backend auto-confirms only DETERMINISTIC matches (EAN / SKU / brand+reference).
Title-only "fuzzy" candidates are unreliable (audited <50% precision) so they are
parked as **proposals** awaiting review — not scraped, not shown live. You are the
reviewer: pull a batch, judge each proposal against OUR product, and resolve it.
Confirmed proposals go live (scraped + shown on the Prices/Gaps pages); rejected
ones drop to `catalog_only`.

## Endpoints (Medusa admin API, admin-authed)

Base URL: `${MEDUSA_BACKEND_URL:-https://storeadmin.higitotal.pt}`

1. `GET  /admin/competitor-prices/match/review?limit=N[&competitor_id=…][&status=]` →
   `{ count, items:[{ id, competitor_handle, competitor_name, competitor_url,
   theirs_title, brand, sku, ean, match_score, proposed_product_id,
   proposed_title, proposed_sku }] }` — highest score first. `status` defaults to
   `fuzzy` (the unreviewed backlog); `status=confirmed` AUDITS the live matches and
   `status=all` covers every match. Overrides apply to ANY match, not just fuzzy.
2. `POST /admin/competitor-prices/match/resolve` →
   `{ mapping_id, action: "confirm" | "reject" | "reassign", product_id?, by:"agent" }`
   — works on ANY mapping regardless of its current status:
   - **confirm**  — the `proposed_title` IS the same product → goes live
   - **reject**   — different product (even a wrong auto-confirm) → `catalog_only`
   - **reassign** — link to a DIFFERENT product of ours (`product_id` required)
3. `GET  /admin/products?q=<terms>&limit=10&fields=id,title,*variants.sku` —
   search OUR catalog (Medusa core) to find the right product for a **reassign**.

## Auth

Get a bearer token once, reuse it. Same pattern as competitor-discovery:

```bash
BE="${MEDUSA_BACKEND_URL:-https://storeadmin.higitotal.pt}"
E="${MEDUSA_ADMIN_EMAIL:-$(grep -m1 '^MEDUSA_ADMIN_EMAIL=' backend/.env | cut -d= -f2-)}"
P="${MEDUSA_ADMIN_PASSWORD:-$(grep -m1 '^MEDUSA_ADMIN_PASSWORD=' backend/.env | cut -d= -f2-)}"
TOK=$(curl -s -X POST "$BE/auth/user/emailpass" -H 'Content-Type: application/json' \
  --data-binary "$(node -e "console.log(JSON.stringify({email:process.env.E,password:process.env.P}))" E="$E" P="$P")" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).token||''))")
```

## ⚖️ The judging rule (be strict — this is a precision job)

A proposal is **the same product** ONLY if `theirs_title` and `proposed_title`
are the same purchasable item: **same brand/line, same model/variant, AND the same
(or directly equivalent) pack size** — so comparing their prices is meaningful.

- **confirm** when all three hold (size equal, or a trivial restatement like
  `6x0,5L` vs `3L`, or `5 litros` vs `5L`).
- **reject** when ANY of these differ — they are the killers:
  - **Model / spec number**: `Taski Aero 15` ≠ `Aero 8`; `Suma D10` ≠ `Suma D4`;
    `Nilfisk VP300` ≠ `VP100`; `VL500 55-1` ≠ `55-2`.
  - **Accessory / consumable vs the appliance**: a vacuum **bag / hose / filter** is
    NOT the vacuum; a **refill** is NOT the dispenser.
  - **Pack size with no equivalence**: `5L` vs `20L`, `100un` vs `1000un`.
  - **Different product / category** entirely (a straw vs an apron).
  - **Different brand** when ours is brand-specific (not a generic own-label).
- **reassign** when theirs is clearly one of OUR products but NOT the proposed one
  — search `/admin/products?q=` for the real match and resolve with its `product_id`.
- When our title is **generic** (e.g. "Amaciador para Roupa (5L)") and theirs is a
  specific branded product of the same type+size, it's genuinely ambiguous: **reject**
  unless brand/ref evidence ties them. A wrong confirm pollutes the live comparison.

Open `competitor_url` with **WebFetch** when the titles alone don't settle it
(check the on-page brand, model code, net content). Don't guess.

## Loop

1. `GET /match/review?limit=20`. Default drains the `fuzzy` backlog; pass
   `status=confirmed` for an audit pass over the live matches (catch wrong
   auto-confirms), or `status=all` to sweep everything. If `count` is 0 → done.
2. Judge each item (fan out for big batches — see below).
3. `POST /match/resolve` once per item (`by:"agent"`). Every item in the batch gets
   exactly one confirm / reject / reassign so it leaves the queue.
4. Repeat until `count` is 0 or you hit your budget. Report: reviewed, confirmed,
   rejected, reassigned, remaining.

## Fan-out with subagents (batches > ~8)

Parallelise the judging; keep the writes central.

- Spawn **research subagents on `sonnet`**, ~10 proposals each. Give each the
  proposals (their `id`, `theirs_title`, `proposed_title`, `competitor_url`, `brand`),
  the judging rule above, and the domain (Diversey/Suma/Clax/Taski/Vileda/Nilfisk).
- Subagents are **READ-ONLY web research** (WebFetch/WebSearch only). They MUST NOT
  call the admin API. Each returns STRICT JSON:
  `[{"id":"…","verdict":"confirm"|"reject"|"reassign","reassign_query":"…?","reason":"≤12 words"}]`.
- **The orchestrator (you) does ALL `/match/resolve` calls**, re-checking the rule;
  for a `reassign`, run `/admin/products?q=<reassign_query>`, pick the single clear
  match, and resolve with its `product_id` (else reject).

## Rules

- **Default to reject when uncertain.** Precision over recall — a human can always
  add a missed match via the Prices UI; a wrong confirm shows a bogus price.
- Read-only on the web; the only writes are `/match/resolve`.
- Be a polite crawler: a couple of fetches per ambiguous proposal, not hundreds.
