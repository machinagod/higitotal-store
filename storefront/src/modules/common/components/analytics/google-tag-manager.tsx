import { gtmLoaderScript, resolveGtmId } from "@lib/util/gtm"

/**
 * Google Tag Manager container, as a plain inline <script> in <head> placed
 * right AFTER ConsentModeDefaults: that script creates `window.dataLayer` and
 * pushes the Consent Mode v2 defaults (all non-essential storage denied, plus
 * any stored "statistics" consent) first; the first-party cookie banner sends
 * later updates — Portuguese law requires consent before analytics cookies.
 *
 * gtm.js itself is NOT requested here: the loader waits for `window` `load`,
 * a short delay and an idle period (see gtmLoaderScript), so the ~180 KiB
 * container never competes with hydration. dataLayer events pushed earlier
 * (add_to_quote, generate_lead) are queued and processed when GTM boots.
 * A plain inline script (not next/script) so it is independent of hydration.
 */
export function GoogleTagManagerScript() {
  const id = resolveGtmId()
  if (!id) return null
  return (
    <script id="gtm" dangerouslySetInnerHTML={{ __html: gtmLoaderScript(id) }} />
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
