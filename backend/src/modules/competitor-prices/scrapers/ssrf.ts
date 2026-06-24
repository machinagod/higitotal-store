/**
 * SSRF guard for the catalog crawler. The enumerator follows URLs harvested from
 * UNTRUSTED upstream content — a competitor's sitemap `<loc>` entries and HTTP
 * redirects — so before every fetch we must reject anything that points at the
 * loopback / private / link-local / cloud-metadata ranges. Without this, a
 * hostile sitemap could make the backend fetch `http://169.254.169.254/…` or an
 * internal service.
 *
 * Pure + injectable: the DNS resolver is a parameter so it's testable offline.
 */
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

export type DnsResolver = (
  host: string,
  opts: { all: true }
) => Promise<Array<{ address: string; family: number }>>

/** True for an IPv4 literal in a non-routable / internal range. */
function ipv4Blocked(ip: string): boolean {
  const o = ip.split(".").map(Number)
  if (o.length !== 4 || o.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true // malformed → block, don't fetch
  }
  const [a, b] = o
  if (a === 0) return true // 0.0.0.0/8 "this host"
  if (a === 10) return true // 10/8 private
  if (a === 127) return true // 127/8 loopback
  if (a === 169 && b === 254) return true // 169.254/16 link-local (cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16/12 private
  if (a === 192 && b === 168) return true // 192.168/16 private
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64/10 CGNAT
  return false
}

/** True for an IPv6 literal in a loopback / unspecified / ULA / link-local range. */
function ipv6Blocked(ip: string): boolean {
  const lower = ip.toLowerCase()
  const mapped = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
  if (mapped) return ipv4Blocked(mapped[1]) // IPv4-mapped → check the embedded v4
  if (lower === "::1" || lower === "::") return true // loopback / unspecified
  const head = lower.split(":")[0]
  if (/^f[cd]/.test(head)) return true // fc00::/7 unique-local
  if (/^fe[89ab]/.test(head)) return true // fe80::/10 link-local
  return false
}

/** True if `ip` is a literal address we must never fetch (or isn't an IP at all). */
export function isBlockedAddress(ip: string): boolean {
  const kind = isIP(ip)
  if (kind === 4) return ipv4Blocked(ip)
  if (kind === 6) return ipv6Blocked(ip)
  return true // not a parseable IP → block
}

/**
 * Validate a URL is safe to fetch: http(s) scheme, and every resolved address is
 * public. Returns the parsed `URL` on success; throws otherwise. Must be called
 * for the initial URL AND for each redirect `Location`.
 */
export async function assertPublicUrl(
  rawUrl: string,
  resolver: DnsResolver = lookup as unknown as DnsResolver
): Promise<URL> {
  let u: URL
  try {
    u = new URL(rawUrl)
  } catch {
    throw new Error(`SSRF: invalid URL ${rawUrl}`)
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`SSRF: blocked scheme ${u.protocol}`)
  }
  const host = u.hostname.replace(/^\[|\]$/g, "") // strip IPv6 brackets

  if (isIP(host)) {
    if (isBlockedAddress(host)) throw new Error(`SSRF: blocked address ${host}`)
    return u
  }

  const records = await resolver(host, { all: true })
  if (!records.length) throw new Error(`SSRF: no DNS records for ${host}`)
  for (const r of records) {
    if (isBlockedAddress(r.address)) {
      throw new Error(`SSRF: ${host} resolves to blocked address ${r.address}`)
    }
  }
  return u
}
