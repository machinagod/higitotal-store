/**
 * Password reset links for Medusa's `auth.password_reset` event
 * (payload `{ entity_id, actor_type, token }`, entity_id = the e-mail for the
 * emailpass provider).
 *
 * Admin users reset on the dashboard's own page, `/app/reset-password`, which
 * reads `token` (and `email`) from the query string. The storefront has no
 * customer reset page (catalog mode, no customer self-service), so customer
 * resets are not e-mailed — `null`.
 */
export type PasswordResetEvent = {
  entity_id?: unknown
  actor_type?: unknown
  token?: unknown
}

export function adminResetLink(backendUrl: string, token: string, email: string): string {
  const base = backendUrl.replace(/\/+$/, '')
  const q = new URLSearchParams({ token, email })
  return `${base}/app/reset-password?${q.toString()}`
}

export function passwordResetEmail(
  event: PasswordResetEvent,
  backendUrl: string
): { to: string; resetLink: string } | null {
  const email = typeof event.entity_id === 'string' ? event.entity_id.trim() : ''
  const token = typeof event.token === 'string' ? event.token : ''
  if (!email || !token || event.actor_type !== 'user') return null
  return { to: email, resetLink: adminResetLink(backendUrl, token, email) }
}
