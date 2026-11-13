"use client"

import { openConsentPreferences } from "@lib/consent/client"

/**
 * "Preferências de cookies": reopens the cookie banner on its Personalizar
 * panel (via a window event the banner listens for). Render it only where the
 * banner is mounted, i.e. when analyticsEnabled().
 */
export default function CookiePreferencesButton({
  className,
  children = "Preferências de cookies",
  testId = "cookie-preferences",
}: {
  className?: string
  children?: React.ReactNode
  testId?: string
}) {
  return (
    <button
      type="button"
      onClick={openConsentPreferences}
      className={className}
      data-testid={testId}
    >
      {children}
    </button>
  )
}
