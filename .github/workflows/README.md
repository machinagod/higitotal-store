# CI & deploy

## Flow

```
push to master ──► GitHub Actions "CI" (ci.yml)
    │
    ├─ e2e                spins Postgres + backend + storefront, runs Playwright e2e
    │                     (ephemeral CI Postgres — never production)
    │                          │ green
    │                          ▼
    ├─ backend-image     build backend/Dockerfile  ─┐  push to GHCR (private)
    ├─ storefront-image  build storefront/Dockerfile ┘  tags :latest + :sha-<commit>
    │                          │ both pushed
    │                          ▼
    └─ deploy            railway redeploy Backend + Storefront → pulls the new :latest
```

GitHub Actions **builds the images and triggers the deploy**. Railway no longer
builds from the repo — each service deploys the prebuilt GHCR image. The `e2e`
job still gates everything: a red run blocks the image builds and the deploy.

`backend-image`, `storefront-image`, and `deploy` only run on **push to
master** (not on PRs). PRs still get the full `e2e` gate.

## Images

- `ghcr.io/machinagod/medusajs-2.0-for-railway-boilerplate/backend`
- `ghcr.io/machinagod/medusajs-2.0-for-railway-boilerplate/storefront`

Both are **private** packages. Tags: `latest` (moving, what Railway deploys) and
`sha-<short-commit>` (immutable, for traceability / rollback).

The `NEXT_PUBLIC_*` storefront config is **baked into the image at build time**
(Next.js inlines it), so the storefront image is environment-specific — it
carries the production backend URL, publishable key, region, etc. The backend
image needs no build-time secrets (`medusa build` only bundles; optional modules
stay disabled when their env is absent).

The storefront image builds **hermetically** — it does not need a running
backend. `generateStaticParams` (product/collection/category routes) degrades to
no prerendered paths when the backend is unreachable at build time, so those
routes simply render on demand instead. When the backend *is* reachable at build
time, they are still statically prerendered.

## One-time setup

### 1. GitHub → Settings → Secrets and variables → Actions

**Secrets:**

| Secret | Purpose |
| --- | --- |
| `RAILWAY_TOKEN` | Railway **project token** scoped to the `production` environment. Used by the `deploy` job to `railway redeploy`. Create it in Railway → Project → Settings → Tokens. |

`GITHUB_TOKEN` is provided automatically and has `packages: write` for pushing
to GHCR — no extra secret needed for the push.

**Variables** (these are `NEXT_PUBLIC_*` — public values, not secrets — plus the
Railway service names):

| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://<backend>.up.railway.app` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_...` (required — missing fails the build) |
| `NEXT_PUBLIC_BASE_URL` | `https://<storefront>.up.railway.app` |
| `NEXT_PUBLIC_DEFAULT_REGION` | `dk` |
| `NEXT_PUBLIC_MINIO_ENDPOINT` | `bucket-...up.railway.app` (optional) |
| `NEXT_PUBLIC_SEARCH_ENDPOINT` | MeiliSearch URL (optional) |
| `NEXT_PUBLIC_SEARCH_API_KEY` | MeiliSearch search key (optional) |
| `NEXT_PUBLIC_INDEX_NAME` | `products` (optional) |
| `RAILWAY_BACKEND_SERVICE` | `Backend` |
| `RAILWAY_STOREFRONT_SERVICE` | `Storefront` |

### 2. Railway → each service (Backend, Storefront), `production` environment

1. **Source → Docker Image**: set to the GHCR image above with the `:latest` tag.
2. **Private registry credentials**: add GHCR auth so Railway can pull the
   private package — username = your GitHub username, password = a GitHub PAT
   with **`read:packages`**. (This credential cannot be set through the Railway
   API/MCP; it must be added in the dashboard.)
3. Clear any **custom start command** so the image's `CMD` is used (the backend
   image runs `pnpm start` = migrate-on-boot + `medusa start`; the storefront
   image runs `next start`).
4. Keep the existing **health check paths** (`/health`, `/api/healthcheck`).
5. The old **"Wait for CI"** setting is now moot — image-source services don't
   watch git; the `deploy` job is the only trigger. You can leave it off.

> Because the images don't exist until the first `master` build runs, do the
> Railway source switch **after** that first build has pushed both images
> (otherwise the first image-source deploy has nothing to pull).

## ⚠️ The Playwright suite mutates its database

`storefront/e2e` **drops and recreates** its database between runs (failsafes
require the DB name to start with `test_`). It must only ever point at the
ephemeral CI database — never the production `DATABASE_URL`. The CI workflow
enforces this with `TEST_POSTGRES_DATABASE=test_medusa_db` against the CI
Postgres service.

## Iterating on CI

- **Image build failures** surface in the `backend-image` / `storefront-image`
  jobs. Docker isn't run in the `e2e` job, so the first real validation of the
  Dockerfiles is this job — check its logs.
- **e2e failures**: check the **playwright-report** artifact and the "Dump
  server logs" step. Likely tweaks: the seeded `NEXT_PUBLIC_DEFAULT_REGION`,
  seed data expectations, or specs that need a payment provider.
- **Deploy failures**: usually a missing `RAILWAY_TOKEN`/service-name var, or
  Railway lacking GHCR pull credentials.
