/**
 * Variants without a price set.
 *
 * A few early Moloni imports left variants with NO `product_variant_price_set`
 * link. Medusa then silently ignores `variants[].prices` on product updates
 * (`upsertVariantPricesWorkflow` only updates linked sets), and every price-list
 * write for such a variant throws `No price set exist for variants: …`, which
 * used to abort the whole sync. These helpers find them so the sync can create
 * the missing set (see `ensure-variant-price-sets.ts`) or skip them per item.
 */

type GraphAll = (
  entity: string,
  fields: string[],
  filters?: Record<string, unknown>
) => Promise<any[]>

/** Pure: which of `variantIds` have no price-set link among `links`. */
export function variantsWithoutPriceSet(
  variantIds: string[],
  links: { variant_id?: string | null; price_set_id?: string | null }[]
): string[] {
  const linked = new Set(
    links.filter((l) => l?.variant_id && l.price_set_id).map((l) => l.variant_id)
  )
  return [...new Set(variantIds)].filter((id) => !linked.has(id))
}

/** Query the variant ↔ price-set link table for `variantIds` (chunked). */
export async function loadVariantsWithoutPriceSet(
  graphAll: GraphAll,
  variantIds: string[]
): Promise<string[]> {
  const ids = [...new Set(variantIds)]
  const links: any[] = []
  for (let i = 0; i < ids.length; i += 200) {
    links.push(
      ...(await graphAll(
        "product_variant_price_set",
        ["variant_id", "price_set_id"],
        { variant_id: ids.slice(i, i + 200) }
      ))
    )
  }
  return variantsWithoutPriceSet(ids, links)
}
