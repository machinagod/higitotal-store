import { MetadataRoute } from "next"

import { getBaseURL } from "@lib/util/env"

/**
 * robots.txt. Allows the public catalog and blocks the transactional / private
 * surfaces, which carry a `[countryCode]` prefix (e.g. `/dk/checkout`) — hence
 * the leading slash-star wildcards in the disallow list. Points crawlers at the
 * dynamic sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getBaseURL().replace(/\/$/, "")

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/account",
          "/*/checkout",
          "/*/cart",
          "/*/order/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
