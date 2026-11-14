import type { Metadata } from "next"

import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "./env"
import { DEFAULT_OG_IMAGE, SITE_NAME, titleWithSiteName } from "./seo-meta"

/** Brand/site constants reused across metadata, JSON-LD and the sitemap. */
export { DEFAULT_OG_IMAGE, SITE_NAME }

export const SITE_DESCRIPTION =
  "Higiene profissional e equipamento para hotelaria, restauração e indústria, com assistência técnica própria sediada em Mirandela. Especialistas desde 1999."

/** The content language. The catalog and copy are Portuguese across every
 * region, so a single locale is correct here. */
export const SITE_LOCALE = "pt_PT"

/** Build an absolute URL from a site-root-relative path. */
export const absoluteUrl = (path = "/") => {
  const base = getBaseURL().replace(/\/$/, "")
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${base}${suffix}`
}

/**
 * The single country code we treat as canonical for SEO. The storefront serves
 * the same Portuguese catalog under every region prefix (`/dk`, `/fr`, …), which
 * is duplicate content; collapsing all variants onto one canonical URL keeps a
 * single indexable version per page.
 *
 * Prefers `NEXT_PUBLIC_DEFAULT_REGION` when it maps to a real region, otherwise
 * the first available region country. Fails soft to the configured default so
 * metadata still renders when the backend is unreachable (e.g. Docker build).
 *
 * Not memoized here on purpose — `listRegions` is already request-cached, so the
 * extra work is negligible and the function stays trivially unit-testable.
 */
export const getCanonicalCountryCode = async (): Promise<string> => {
  const preferred = (process.env.NEXT_PUBLIC_DEFAULT_REGION || "").toLowerCase()
  try {
    const regions = await listRegions()
    const countries = (regions ?? [])
      .flatMap((r) => r.countries?.map((c) => c.iso_2) ?? [])
      .filter(Boolean) as string[]

    if (preferred && countries.includes(preferred)) {
      return preferred
    }
    return countries[0] || preferred || "dk"
  } catch {
    return preferred || "dk"
  }
}

/**
 * Absolute canonical URL for a localized page. Pass the path WITHOUT the country
 * prefix (e.g. `products/my-handle`); the canonical region prefix is added so
 * every region variant points at the same indexable URL.
 */
export const canonicalUrl = async (pathWithoutCountry = ""): Promise<string> => {
  const cc = await getCanonicalCountryCode()
  const clean = pathWithoutCountry.replace(/^\/+/, "")
  return absoluteUrl(clean ? `/${cc}/${clean}` : `/${cc}`)
}

/** An Open Graph image: a URL (absolute or site-relative) or a full entry. */
export type OgImage =
  | string
  | { url: string; width?: number; height?: number; alt?: string }

/**
 * Standard metadata for an indexable page: title (with " · Higitotal" when it
 * fits, see `titleWithSiteName`), description, self-canonical URL on the
 * canonical region, and Open Graph (Twitter inherits it) with the page's own
 * images or the site default.
 *
 * `path` is WITHOUT the country prefix and may carry a query (`store?page=2`).
 * Next merges `openGraph` shallowly — a page that sets it drops the root
 * layout's images — so every page states its images through here.
 */
export async function pageMetadata({
  path,
  title,
  description,
  images,
}: {
  path: string
  title: string
  description: string
  images?: OgImage[]
}): Promise<Metadata> {
  const canonical = await canonicalUrl(path)
  const fullTitle = titleWithSiteName(title)
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: fullTitle,
      description,
      url: canonical,
      images: images?.length ? images : [DEFAULT_OG_IMAGE],
    },
  }
}
