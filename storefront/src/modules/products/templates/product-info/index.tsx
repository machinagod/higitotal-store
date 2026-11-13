import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

/** Title block: collection eyebrow, title, Ref.ª and the description (shown once). */
const ProductInfo = ({ product }: ProductInfoProps) => {
  const sku = product.variants?.[0]?.sku
  return (
    <div id="product-info" className="flex flex-col gap-y-3">
      {product.collection && (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="inline-flex w-fit items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan hover:text-brand-cyan-ink"
        >
          <span className="ind" aria-hidden="true" />
          {product.collection.title}
        </LocalizedClientLink>
      )}
      <h1
        className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.025em] text-brand-ink small:text-[36px]"
        data-testid="product-title"
      >
        {product.title}
      </h1>

      {sku && (
        <p className="text-sm font-medium text-grey-50" data-testid="product-ref">
          Ref.ª {sku}
        </p>
      )}

      {product.description && (
        <p
          className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-grey-60"
          data-testid="product-description"
        >
          {product.description}
        </p>
      )}
    </div>
  )
}

export default ProductInfo
