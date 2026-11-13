import { Check } from "lucide-react"

import { getProductAttributes } from "@lib/data/products"

/**
 * "Destaques" — key product points from the product_attributes module. Async
 * server component: fetches its own data and renders nothing when a product
 * has no highlights.
 */
const ProductHighlights = async ({ productId }: { productId: string }) => {
  const { highlights } = await getProductAttributes(productId)

  if (!highlights?.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3" data-testid="product-highlights">
      <h2 className="text-base font-extrabold tracking-[-0.01em] text-brand-ink">
        Destaques
      </h2>
      <ul className="flex flex-col gap-y-2.5">
        {[...highlights]
          .sort((a, b) => a.rank - b.rank)
          .map((h) => (
            <li key={h.id} className="flex gap-2.5 text-sm leading-relaxed text-grey-60">
              <Check
                className="mt-[3px] h-4 w-4 flex-none text-brand-cyan"
                aria-hidden="true"
              />
              <span className="whitespace-pre-line">{h.value}</span>
            </li>
          ))}
      </ul>
    </div>
  )
}

export default ProductHighlights
