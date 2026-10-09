# CLAUDE.md

Project-specific operating guide for AI agents. Read this before running anything.

## What this is

A **Medusa 2.21.2** e-commerce monorepo (Railway boilerplate), two apps:

- **`backend/`** — Medusa server + admin dashboard. Dev server on `:9000`, admin at `/app`.
- **`storefront/`** — Next.js 15 storefront. Dev server on `:8000`. Needs the backend up.

Each app is a **separate** install (its own `pnpm-lock.yaml`); this is *not* a pnpm
workspace spanning both. Run install/build/dev inside each directory.

## ⚠️ Local is wired to LIVE production data (read first)

The gitignored env files point local dev at the **live Railway deployment**
(project `scintillating-adaptation`, production), driven from that project's
variables:

- `backend/.env` `DATABASE_URL` → Railway's **public** Postgres proxy
  (`*.proxy.rlwy.net`). The internal `*.railway.internal` hosts are unreachable
  from a laptop, so the public proxy is required.
- MinIO, MeiliSearch, Resend, and JWT/COOKIE secrets also point at production.
- `REDIS_URL` is **intentionally unset** → local uses in-memory redis, so this
  machine does not consume production's event-bus / workflow jobs. Keep it unset.

Because of this:

- **NEVER run `pnpm ib` / `pnpm seed` / migrations against the live DB.** They
  mutate production. (Prod is already migrated at the same version, so there is
  nothing to apply locally anyway.)
- Treat any backend write (admin actions, uploads, order changes) as hitting
  **production** data and storage. Confirm before doing so.
- The store has **Europe regions only** (`dk/fr/de/it/es/se/gb`), no `us`. The
  storefront default region is `dk`.

To run against a throwaway local DB instead, repoint `backend/.env`
`DATABASE_URL` at a local Postgres and then `pnpm ib` is safe.

## Node version (required)

The repo pins Node **22.x** (`engines`; Docker images use `node:22.22.0`). Medusa
≥ 2.19 needs Node **≥ 22.12**, so an older 22.x will not run it. If the machine's
default `node` is a different major (e.g. 25), use the Homebrew keg explicitly —
prefix commands so they resolve Node 22:

```bash
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"   # node v22.x (keg-only)
```

Install once with `brew install node@22` if missing. Do not `brew link` it
(that would shadow the system Node globally).

## Commands

Package manager is **pnpm** (v10+). All commands assume the Node 22 PATH prefix above.

### backend/
- `pnpm install` — install deps
- `pnpm dev` — start backend + admin (`:9000`, admin at `/app`)
- `pnpm build` — compile (`medusa build` + postBuild)
- `pnpm start` — run compiled build (runs `init-backend` first — **DB-mutating**, avoid against prod)
- `pnpm seed` / `pnpm ib` — **DB-mutating**, do NOT run against the live DB (see warning above)

### storefront/
- `pnpm install` — install deps
- `pnpm dev` — waits for backend, then `next dev -p 8000`
- `pnpm build` — production build
- `pnpm lint` — `next lint`
- `pnpm test-e2e` — Playwright e2e

### pnpm gotcha (already handled)
pnpm 10+ ignores native build scripts and no longer reads the `pnpm` field in
`package.json`. The storefront needs `sharp` (Next.js image optimization) allowed
via `storefront/pnpm-workspace.yaml` (`allowBuilds: { sharp: true }`); without it
`pnpm install` exits non-zero and the dev launcher fails. If a new native dep
trips `ERR_PNPM_IGNORED_BUILDS`, add it there rather than `pnpm approve-builds`
interactively.

## Validation gate

Before committing, from each app you changed:
- storefront: `pnpm lint` (and `pnpm build` for non-trivial changes)
- backend: `pnpm build` (typecheck/compile)

Fix failures before committing — including pre-existing ones in files you touch.

## Deploy & CI
- **Build & deploy**: GitHub Actions (`.github/workflows/ci.yml`) builds Docker
  images from `backend/Dockerfile` and `storefront/Dockerfile` and pushes them to
  **GHCR** (private: `ghcr.io/machinagod/higitotal-store/{backend,storefront}` — the
  repo was renamed from `medusajs-2.0-for-railway-boilerplate`; CI uses
  `${{ github.repository }}` so it follows the rename, and Railway's image source
  must point at the **same** path,
  tags `:latest` + `:sha-<commit>`). CI does **not** trigger the deploy — each
  Railway service has **GHCR image auto-updates** enabled, so Railway polls the
  image tag and redeploys itself when a new `:latest` is published. Railway no
  longer builds from the repo. `init-backend` + the start command run DB
  migrations on boot (backend image `CMD`). The boot runs `db:migrate
  --execute-safe-links --execute-safe-search`: without those flags a link-table
  change makes `db:migrate` wait on an interactive prompt, which hangs the
  non-TTY container forever. Link **updates/deletes** are therefore never
  applied on boot — run `medusa db:sync-links` deliberately when one is pending.
- **Search**: Meilisearch is a provider of Medusa's Search Module (index
  declarations in `backend/src/search/`). Physical indexes are versioned
  (`products_v1`, …), so the storefront must search via `POST /store/search`
  (InstantSearch adapter), never Meilisearch directly by index name.
- **Pipeline order**: `changes` → `backend-image` + `storefront-image` →
  `deploy` → `e2e-prod`. Each `*-image` job **builds the image once, boots it, then
  pushes** — the boot is the **only pre-push gate** (runs on PRs + master): it boots
  the **pruned** production image, so a runtime dep misfiled as a devDependency (it
  has bitten us: storefront `ansi-colors`, backend `react`) is caught before
  publish, on an ephemeral CI Postgres (never prod; no secrets). The backend boot
  first migrates that DB with the **currently published** image, so the new
  image's migrations run on the previous schema — the real upgrade path. It
  migrates schema only (no data): data-dependent migrations (e.g. the 2.15
  product-dimension `text → real` cast) still need a prod data check. The image **push**
  + `deploy` + `e2e-prod` run on push to `master` only.
- **e2e runs AFTER deploy, against LIVE prod** (not a pre-merge gate). Each image
  bakes the commit into `GIT_SHA`; the `deploy` job force-redeploys then **waits
  until prod reports the new commit** (`/version` on the backend,
  `/api/healthcheck` on the storefront) before `e2e-prod` runs. `e2e-prod`
  (`pnpm test-e2e:prod`, `playwright.prod.config.ts` → `e2e/prod/`) is **strictly
  read-only** — navigation/render assertions only, never creates carts/accounts/
  orders — and authenticates through the access-token gate with the
  `STOREFRONT_ACCESS_TOKEN` repo secret. PRs run **no** e2e.
- **Storefront images are env-specific**: `NEXT_PUBLIC_*` (incl. the publishable
  key) are inlined at build time from GitHub Actions **Variables**. The backend
  image needs no build secrets.
- **Required config** (one-time): the `NEXT_PUBLIC_*` Actions Variables, a GHCR
  pull credential on each Railway service, and **image auto-updates** enabled on
  each service (Railway dashboard — not settable via API). CI now force-redeploys
  and runs prod e2e, so it also needs: `RAILWAY_TOKEN` (project token on the
  `scintillating-adaptation / production` Environment), the `RAILWAY_BACKEND_SERVICE`
  / `RAILWAY_STOREFRONT_SERVICE` Variables, and the `STOREFRONT_ACCESS_TOKEN` repo
  secret (for the prod e2e gate). Full list in `.github/workflows/README.md`.
- The `storefront/e2e` suite **drops/recreates its DB** — only ever point it at a
  `test_`-prefixed DB, never the production `DATABASE_URL`.

## Conventions
- This repo commits small config/fix changes directly to `master`.
- Secrets live only in the gitignored `.env` / `.env.local` files — never commit them.
