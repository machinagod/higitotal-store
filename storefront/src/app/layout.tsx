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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/higitotal/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/higitotal/logo-full.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    title: `${SITE_NAME} · Higiene profissional e assistência técnica`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Higiene profissional e assistência técnica`,
    description: SITE_DESCRIPTION,
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
        {/* Must run before any Google tag: Consent Mode v2 defaults. */}
        <ConsentModeDefaults />
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
        <GoogleTagManagerScript />
      </body>
    </html>
  )
}
