import type { MetadataRoute } from "next"

import { SITE_NAME } from "@lib/util/seo"

/** Web app manifest: name and icons for Android / "Add to home screen". */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Higiene profissional`,
    short_name: SITE_NAME,
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#16181d",
    icons: [
      { src: "/higitotal/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/higitotal/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
