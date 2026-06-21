# syntax=docker/dockerfile:1

# Storefront image (Next.js 15). Built in GitHub Actions, pushed to GHCR,
# deployed by Railway.
#
# NEXT_PUBLIC_* values are inlined by `next build`, so they are passed as build
# args (NOT fetched from a live backend). The build is hermetic: the publishable
# key is provided directly here, and generateStaticParams degrades to no
# prerendered paths when the backend is unreachable (those routes render on
# demand at runtime instead). So no running backend is required to build.

ARG NODE_IMAGE=node:22.11.0-bookworm-slim

# ── Builder ─────────────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS builder
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate
WORKDIR /app

# pnpm-workspace.yaml carries the sharp allowBuilds entry — copy it before install
# so the native build is permitted (else `pnpm install` exits on ERR_PNPM_IGNORED_BUILDS).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

# Build-time public config (inlined into the bundle by next build).
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION
ARG NEXT_PUBLIC_MINIO_ENDPOINT
ARG NEXT_PUBLIC_SEARCH_ENDPOINT
ARG NEXT_PUBLIC_SEARCH_API_KEY
ARG NEXT_PUBLIC_INDEX_NAME
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=${NEXT_PUBLIC_MEDUSA_BACKEND_URL} \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY} \
    NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL} \
    NEXT_PUBLIC_DEFAULT_REGION=${NEXT_PUBLIC_DEFAULT_REGION} \
    NEXT_PUBLIC_MINIO_ENDPOINT=${NEXT_PUBLIC_MINIO_ENDPOINT} \
    NEXT_PUBLIC_SEARCH_ENDPOINT=${NEXT_PUBLIC_SEARCH_ENDPOINT} \
    NEXT_PUBLIC_SEARCH_API_KEY=${NEXT_PUBLIC_SEARCH_API_KEY} \
    NEXT_PUBLIC_INDEX_NAME=${NEXT_PUBLIC_INDEX_NAME} \
    NODE_ENV=production

# `next build` directly — bypasses await-backend/launch-storefront so no live
# backend is required during the image build.
RUN pnpm run build:next

# Drop devDependencies; `next start` only needs runtime deps.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm prune --prod

# ── Runner ──────────────────────────────────────────────────────────────────
FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=production
WORKDIR /app

# next.config.js runs check-env-variables.js on start too, which requires the
# publishable key to be present — persist the build-time publics so `next start`
# boots without depending on Railway env (Railway env still overrides).
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_DEFAULT_REGION
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=${NEXT_PUBLIC_MEDUSA_BACKEND_URL} \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY} \
    NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL} \
    NEXT_PUBLIC_DEFAULT_REGION=${NEXT_PUBLIC_DEFAULT_REGION}

COPY --from=builder /app ./

# Commit baked in for the /api/healthcheck probe — CI polls it post-deploy to
# confirm this exact build is live before running prod e2e.
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}

# Railway injects PORT; default to the repo's 8000 convention.
EXPOSE 8000
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-8000}"]
