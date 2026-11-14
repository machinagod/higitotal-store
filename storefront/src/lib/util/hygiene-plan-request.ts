import { SECTORS } from "@lib/sectors"

/** Query value the sector pages' "Pedir um plano de higiene" button sends. */
export const HYGIENE_PLAN_QUERY = "plano-higiene"

/** Contact-page link for a hygiene-plan request, optionally for a sector. */
export function hygienePlanHref(sectorSlug?: string): string {
  const q = new URLSearchParams({ pedido: HYGIENE_PLAN_QUERY })
  if (sectorSlug) q.set("setor", sectorSlug)
  return `/contact?${q.toString()}`
}

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v

/**
 * Reads the contact page's search params: `?pedido=plano-higiene` (+ an
 * optional known `setor` slug) → the request kind "plano" and a pre-filled
 * message. Anything else → null (a general contact). Unknown sectors are
 * ignored rather than echoed into the form.
 */
export function hygienePlanRequest(
  params: Record<string, string | string[] | undefined>
): { message: string; sectorName?: string } | null {
  if (first(params.pedido) !== HYGIENE_PLAN_QUERY) return null
  const slug = first(params.setor)
  const sector = slug ? SECTORS.find((s) => s.slug === slug) : undefined
  const sectorName = sector?.name
  const forWhat = sectorName ? ` (${sectorName.toLowerCase()})` : ""
  return {
    sectorName,
    message: `Gostaria de pedir um plano de higiene para a minha instalação${forWhat}.`,
  }
}
