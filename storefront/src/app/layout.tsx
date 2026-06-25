import { Metadata } from "next"
import "styles/globals.css"

import GoogleAnalytics from "@modules/common/components/analytics/google-analytics"
import JsonLd from "@modules/common/components/json-ld"
import { getBaseURL } from "@lib/util/env"
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
} from "@lib/util/seo"
import {
  organizationSchema,
  websiteSchema,
} from "@lib/util/structured-data"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: `${SITE_NAME} · Higiene profissional & assistência técnica`,
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
    title: `${SITE_NAME} · Higiene profissional & assistência técnica`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · Higiene profissional & assistência técnica`,
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
    <html lang="pt-PT" data-mode="light">
      <body>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <main className="relative">{props.children}</main>
        <GoogleAnalytics />
      </body>
    </html>
  )
}
