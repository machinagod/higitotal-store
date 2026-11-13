import { consentDefaultScript, resolveGtmId } from "@lib/util/gtm"

/**
 * Google Consent Mode v2 defaults, rendered as a plain inline <script> in
 * <head>. It executes while the document is parsed — before GTM / gtag.js
 * (both loaded `afterInteractive`) can fire any tag — so GA4 and ads tags
 * start in "denied" mode and set no cookies until the CMP inside the GTM
 * container sends gtag('consent', 'update', …).
 *
 * Only rendered when a Google tag will actually load.
 */
export default function ConsentModeDefaults() {
  if (!resolveGtmId() && !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    return null
  }
  return (
    <script
      id="consent-mode-default"
      dangerouslySetInnerHTML={{ __html: consentDefaultScript() }}
    />
  )
}
