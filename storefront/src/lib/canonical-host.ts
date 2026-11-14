/**
 * Canonical-host redirect for the domain switch: when `CANONICAL_HOST` is set
 * (runtime env on the Railway storefront, e.g. `www.higitotal.pt`), requests
 * that arrive on one of the alias hosts are 301-redirected to the same path and
 * query on the canonical host. Unset → no-op (pre-launch / local / CI boot).
 *
 * Alias hosts default to store.higitotal.pt and the bare higitotal.pt and can
 * be overridden with `CANONICAL_REDIRECT_HOSTS` (comma-separated). Hosts not in
 * the list (localhost, Railway's own *.up.railway.app domain used by CI and
 * health checks) are never redirected.
 */
export const DEFAULT_ALIAS_HOSTS = ["store.higitotal.pt", "higitotal.pt"]

export function canonicalHostRedirect(
  host: string | null | undefined,
  pathAndQuery: string,
  env: { CANONICAL_HOST?: string; CANONICAL_REDIRECT_HOSTS?: string } = {
    CANONICAL_HOST: process.env.CANONICAL_HOST,
    CANONICAL_REDIRECT_HOSTS: process.env.CANONICAL_REDIRECT_HOSTS,
  }
): string | null {
  const canonical = (env.CANONICAL_HOST ?? "").trim().toLowerCase()
  if (!canonical || !host) return null
  const h = host.split(",")[0].trim().toLowerCase().replace(/:\d+$/, "")
  if (!h || h === canonical) return null
  const aliases = (env.CANONICAL_REDIRECT_HOSTS ?? "").trim()
    ? env.CANONICAL_REDIRECT_HOSTS!.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_ALIAS_HOSTS
  if (!aliases.includes(h)) return null
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`
  return `https://${canonical}${path}`
}
