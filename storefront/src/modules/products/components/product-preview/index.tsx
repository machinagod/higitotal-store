import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import ProductCardAddButton from "./add-button"
import QuoteCardButton from "@modules/quote/components/quote-card-button"
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
  priority = false,
  eyebrowContext,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  /** First row of a listing: load the image eagerly (it is the LCP). */
  priority?: boolean
  /**
   * Names of the page the card is listed on (category / brand / collection).
   * An eyebrow that would just repeat one of them is left blank.
   */
  eyebrowContext?: (string | null | undefined)[]
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

  // Brand when known, else the most specific customer-facing category; blank
  // when it repeats the page (see productEyebrow).
  const eyebrow = productEyebrow(product, { context: eyebrowContext })

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
      className="group relative flex h-full flex-col rounded-card border border-hairline bg-white p-2.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(16,24,40,0.10)] xsmall:p-3 small:p-4"
    >
      {/* The title link stretches over the whole card (after:inset-0), so a
          click anywhere opens the PDP; footer controls sit above it (z-10). */}
      <Thumbnail
        thumbnail={product.thumbnail}
        images={product.images}
        size="full"
        isFeatured={isFeatured}
        alt={product.title}
        priority={priority}
        className="mb-3 small:mb-3.5"
      />

      {/* The eyebrow line is ALWAYS there (blank when there is no label), so
          titles line up across a row. The narrowest phones (< 380px, cards
          ~130px) allow two lines rather than truncating "Máquinas de Limp…". */}
      <p
        className="mb-1 line-clamp-2 h-[26px] overflow-hidden break-words text-[10px] font-bold uppercase leading-[13px] tracking-[0.02em] text-brand-cyan min-[380px]:line-clamp-1 min-[380px]:h-[13px] min-[380px]:tracking-[0.06em] xsmall:tracking-[0.1em] small:mb-1.5"
        aria-hidden={eyebrow ? undefined : true}
        title={eyebrow ?? undefined}
        data-testid="product-eyebrow"
      >
        {eyebrow && (
          <>
            {/* No dot on narrow phone cards: it would wrap alone onto line 1. */}
            <span
              className="mr-1.5 hidden h-[7px] w-[7px] rounded-pill bg-brand-cyan align-[1px] min-[380px]:inline-block"
              aria-hidden
            />
            {eyebrow}
          </>
        )}
      </p>

      <h3
        className="line-clamp-4 text-sm font-medium leading-snug text-brand-ink small:line-clamp-3 small:text-[15px]"
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
          {/* Secondary (outline) on cards so a grid of 24 doesn't shout over
              the product names; the solid button stays on the PDP/header.
              Adds 1 unit to the quote list ("carrinho de orçamento"). */}
          <QuoteCardButton
            product={{
              productId: product.id!,
              handle: product.handle!,
              title: product.title!,
              // The reference only when it is unambiguous (single variant).
              sku:
                (pricedProduct.variants?.length ?? 0) === 1
                  ? variant?.sku ?? undefined
                  : undefined,
              thumbnail: product.thumbnail ?? undefined,
            }}
          />
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
