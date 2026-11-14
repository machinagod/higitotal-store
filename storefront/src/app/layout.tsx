import { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "styles/globals.css"

import ConsentModeDefaults from "@modules/common/components/analytics/consent-mode"
import GoogleAnalytics from "@modules/common/components/analytics/google-analytics"
import {
  GoogleTagManagerNoScript,
  GoogleTagManagerScript,
} from "@modules/common/components/analytics/google-tag-manager"
import CookieConsent from "@modules/common/components/cookie-consent"
import JsonLd from "@modules/common/components/json-ld"
import { getBaseURL } from "@lib/util/env"
import { analyticsEnabled } from "@lib/util/gtm"
import {
  DEFAULT_OG_IMAGE,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
} from "@lib/util/seo"
import {
  organizationSchema,
  websiteSchema,
} from "@lib/util/structured-data"

// Montserrat, committed to the repo (./fonts, SIL OFL 1.1, from
// @fontsource-variable/montserrat 5.2.5): one variable woff2 for the Latin
// subset (all Portuguese, €, typographic punctuation), every weight 100–900.
// Local on purpose: next/font/google downloads at build time, and a flaky
// fetch can fail the build or ship mismatched font CSS. Exposed as
// --font-montserrat, which tailwind's `font-sans` and globals.css use.
const montserrat = localFont({
  src: "./fonts/montserrat-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-montserrat",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets content reach the screen edges on notched phones; components pad
  // with env(safe-area-inset-*) where needed.
  viewportFit: "cover",
  // Matches the dark top utility bar of the header.
  themeColor: "#16181d",
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: `${SITE_NAME} · Higiene profissional e assistência técnica`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "higiene profissional",
    "produtos de limpeza",
    "equipamento hoteleiro",
    "detergentes profissionais",
    "assistência técnica",
    "hotelaria",
    "restauração",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  // The H mark: SVG for modern browsers (turns white on dark tabs), a
  // multi-size .ico fallback, a square 180px touch icon, and the manifest's
  // 192/512 icons (app/manifest.ts).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/higitotal/favicon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    title: `${SITE_NAME} · Higiene profissional e assistência técnica`,
    description: SITE_DESCRIPTION,
    // Default social image. A page that sets its own `openGraph` replaces this
    // object wholesale (shallow merge), so pages pass their images — or this
    // default — via `pageMetadata` (@lib/util/seo).
    images: [DEFAULT_OG_IMAGE],
  },
  // Card type only: Next fills twitter title/description/image from each
  // page's resolved openGraph. Setting them here would pin the home page's
  // values onto every page.
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" data-mode="light" className={montserrat.variable}>
      <head>
        {/* Must run before any Google tag: Consent Mode v2 defaults (also
            creates window.dataLayer). */}
        <ConsentModeDefaults />
        {/* GTM loader: requests gtm.js only after window load + idle. */}
        <GoogleTagManagerScript />
      </head>
      <body>
        <GoogleTagManagerNoScript />
        {/* Fixed bottom card, but first in the DOM so keyboard users reach
            it early. Only when a Google tag loads (nothing to consent to
            otherwise); renders nothing on the server. */}
        {analyticsEnabled() && <CookieConsent />}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {/* Landmarks (header, <main>, footer) come from each route-group
            layout, so the header/footer are never nested inside <main>. */}
        {props.children}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
