import Script from "next/script"

/**
 * Google Analytics 4 (gtag.js), gated on `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Renders
 * nothing until that variable is set, so this is safe to ship ahead of having a
 * property — set the measurement id (G-XXXXXXXXXX) at build time to activate.
 *
 * Consent Mode v2 defaults everything (incl. analytics) to denied, as Portuguese law
 * requires consent first; the consent banner flips it with gtag('consent','update').
 */
export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!measurementId) {
    return null
  }

  return (
    <>
      <Script
        id="ga-consent-default"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied'
            });
          `,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            gtag('js', new Date());
            gtag('config', '${measurementId}');
          `,
        }}
      />
    </>
  )
}
