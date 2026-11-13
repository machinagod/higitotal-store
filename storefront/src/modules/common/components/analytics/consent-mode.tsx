import { analyticsEnabled, consentDefaultScript } from "@lib/util/gtm"

/**
 * Google Consent Mode v2 defaults, rendered as a plain inline <script> in
 * <head>. It executes while the document is parsed — before GTM / gtag.js
 * (both loaded `afterInteractive`) can fire any tag — so GA4 starts in
 * "denied" mode and sets no cookies. The same script restores a returning
 * visitor's stored choice (`ht_consent`); new choices come from the cookie
 * banner (@modules/common/components/cookie-consent).
 *
 * Only rendered when a Google tag will actually load.
 */
export default function ConsentModeDefaults() {
  if (!analyticsEnabled()) {
    return null
  }
  return (
    <script
      id="consent-mode-default"
      dangerouslySetInnerHTML={{ __html: consentDefaultScript() }}
    />
  )
}
