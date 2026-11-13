import Script from "next/script"

/**
 * Google Analytics 4 (gtag.js), gated on `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Renders
 * nothing until that variable is set, so this is safe to ship ahead of having a
 * property — set the measurement id (G-XXXXXXXXXX) at build time to activate.
 *
 * Consent Mode v2 defaults (everything non-essential denied, as Portuguese law
 * requires consent first) are set earlier, in <head>, by ConsentModeDefaults;
 * the first-party cookie banner flips them with gtag('consent','update').
 */
export default function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  // Validate before interpolating into an inline script.
  if (!measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}');
          `,
        }}
      />
    </>
  )
}
