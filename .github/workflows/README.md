# CI & deploy

## Flow

```
push to master ──► GitHub Actions "CI" (ci.yml)
                     spins Postgres + backend + storefront, runs Playwright e2e
                          │ (commit status: success / failure)
                          ▼
                   Railway "Wait for CI" ──► deploy only if CI is green
```

- **Deploy** is Railway's native GitHub integration (Backend & Storefront
  services are connected to this repo). A push to `master` triggers a build +
  deploy.
- **Gate**: `ci.yml` runs the full-stack Playwright e2e suite on an **ephemeral
  CI Postgres** (never production). Railway is set to **Wait for CI**, so a red
  run blocks the deploy.

## One-time setup (Railway dashboard)

For each service (Backend, Storefront) in the `production` environment:

1. Service → **Settings → Deploys**.
2. Enable **"Wait for CI"** (a.k.a. *Check Status before deploy*).

This makes Railway hold the deploy until the GitHub commit status (the CI run)
succeeds. Optionally add a branch protection rule on `master` requiring the
**CI / Build + full-stack e2e** check.

No GitHub secrets are required: the CI stack is self-contained (CI Postgres,
no Stripe/MinIO/MeiliSearch/Moloni — those modules stay disabled via their
fallbacks), so it never touches production or external services.

## ⚠️ The Playwright suite mutates its database

`storefront/e2e` **drops and recreates** its database between runs (failsafes
require the DB name to start with `test_`). It must only ever point at the
ephemeral CI database — never the production `DATABASE_URL`. The CI workflow
enforces this with `TEST_POSTGRES_DATABASE=test_medusa_db` against the CI
Postgres service.

## Iterating on CI

CI can only be validated on the runner. If the first run fails, check the
**playwright-report** artifact and the "Dump server logs" step. Likely tweaks:
the seeded `NEXT_PUBLIC_DEFAULT_REGION`, seed data expectations, or specs that
need a payment provider (Stripe test keys as secrets) for checkout flows.
