import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import ProductCardAddButton from "./add-button"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { productEyebrow } from "@lib/util/product-eyebrow"

/**
 * Does this row already carry what the card footer needs? Listings fetch
 * prices + stock up front (`LISTING_FIELDS`); other callers (e.g. the home
 * rail) may pass bare rows, which are re-fetched with prices.
 */
function hasCardData(product: HttpTypes.StoreProduct, catalogMode: boolean) {
  if (catalogMode) return true
  return (product.variants ?? []).some(
    (v) => v?.calculated_price && v.inventory_quantity !== undefined
  )
}

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const catalogMode = isCatalogMode()

  const pricedProduct = hasCardData(product, catalogMode)
    ? product
    : (
        await getProductsById({
          ids: [product.id!],
          regionId: region.id,
        })
      )[0]

  if (!pricedProduct) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
  })

  // Brand, else a customer-facing category (never "EQ_…" or "Outros").
  const eyebrow = productEyebrow(product)

  // Single (default) variant — add it straight to the cart from the card.
  const variant = (pricedProduct.variants ?? [])[0]
  const variantId = variant?.id
  const inStock =
    !variant?.manage_inventory || (variant?.inventory_quantity ?? 0) > 0
  const countryCode = region.countries?.[0]?.iso_2 ?? "pt"
  const href = `/products/${product.handle}`

  return (
    <div
      data-testid="product-wrapper"
      className="group relative flex h-full flex-col rounded-card border border-hairline bg-white p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(16,24,40,0.10)] small:p-4"
    >
      {/* The title link stretches over the whole card (after:inset-0), so a
          click anywhere opens the PDP; footer controls sit above it (z-10). */}
      <Thumbnail
        thumbnail={product.thumbnail}
        images={product.images}
        size="full"
        isFeatured={isFeatured}
        alt={product.title}
        className="mb-3 small:mb-3.5"
      />

      {eyebrow && (
        <span className="mb-1 flex min-w-0 items-center gap-x-1.5 text-[10px] font-bold uppercase tracking-[0.04em] text-brand-cyan xsmall:tracking-[0.1em] small:mb-1.5 small:gap-x-2">
          <span className="ind flex-none" />
          <span className="truncate" title={eyebrow}>
            {eyebrow}
          </span>
        </span>
      )}

      <h3
        className="line-clamp-4 text-[13px] font-medium small:line-clamp-3 leading-snug text-brand-ink small:text-sm"
        data-testid="product-title"
      >
        <LocalizedClientLink
          href={href}
          className="outline-none after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-brand-cyan"
        >
          {product.title}
        </LocalizedClientLink>
      </h3>

      {/* Footer — mt-auto keeps it aligned across cards whatever the title length. */}
      {catalogMode ? (
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <span
            className="text-xs font-medium text-grey-50"
            data-testid="price-on-request"
          >
            Preço sob consulta
          </span>
          <LocalizedClientLink
            href={`${href}?pedido=1`}
            aria-label={`Pedir orçamento: ${product.title}`}
            data-testid="card-request-quote"
            className="relative z-10 flex h-11 w-full items-center justify-center whitespace-nowrap rounded-pill bg-brand-cyan px-2 text-xs font-bold text-white xsmall:text-[13px] small:px-3 small:text-sm transition-colors hover:bg-brand-cyan-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
          >
            Pedir orçamento
          </LocalizedClientLink>
        </div>
      ) : (
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="min-w-0">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
          <div className="relative z-10">
            <ProductCardAddButton
              variantId={variantId}
              inStock={inStock}
              countryCode={countryCode}
            />
          </div>
        </div>
      )}
    </div>
  )
}
