import Script from "next/script"
import { resolveGtmId } from "@lib/util/gtm"

/**
 * Google Tag Manager container (standard snippet). Consent Mode defaults and the
 * cookie banner are managed inside the GTM container (a CMP template), as
 * Portuguese law requires consent before analytics/marketing cookies.
 */
export function GoogleTagManagerScript() {
  const id = resolveGtmId()
  if (!id) return null
  return (
    <Script
      id="gtm"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${id}');
        `,
      }}
    />
  )
}

/** <noscript> fallback, placed at the top of <body>. */
export function GoogleTagManagerNoScript() {
  const id = resolveGtmId()
  if (!id) return null
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${id}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  )
}
