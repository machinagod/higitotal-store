/**
 * The storefront's public origins. The quote / contact forms and the search
 * page call the Store API straight from the visitor's browser, so every domain
 * the storefront is served from must be in STORE_CORS (and AUTH_CORS).
 * Keeping them here means a domain switch (store. → www.) needs no Railway
 * variable change; the env value still adds anything else (e.g. localhost).
 */
export const PUBLIC_SITE_ORIGINS = [
  'https://www.higitotal.pt',
  'https://higitotal.pt',
  'https://store.higitotal.pt',
]

/**
 * Merge a comma-separated CORS env value with extra origins, de-duplicated,
 * order kept (env first). Entries are compared without a trailing slash.
 * An unset/blank env value stays `undefined` so Medusa's own default applies
 * (local development).
 */
export function withOrigins(
  envValue: string | undefined,
  extra: string[] = PUBLIC_SITE_ORIGINS
): string | undefined {
  if (!envValue || !envValue.trim()) return undefined
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of [...envValue.split(','), ...extra]) {
    const origin = raw.trim()
    if (!origin) continue
    const key = origin.replace(/\/+$/, '')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(origin)
  }
  return out.join(',')
}
