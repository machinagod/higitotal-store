"use client"

import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"

import MobileActions from "./mobile-actions"
import EnquiryDeepLink from "./enquiry-deep-link"
import { useInViewport } from "./use-in-viewport"
import ProductPrice from "../product-price"
import ContactModal from "../contact-modal"
import ProductSpecSheet from "../product-spec-sheet"
import { addToCart } from "@lib/data/cart"
import { COMPANY } from "@lib/company"
import { useQuoteList } from "@lib/quote-list/context"
import { QuoteProductInput } from "@lib/quote-list/state"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import QuantityStepper from "@modules/quote/components/quantity-stepper"
import { shortHours } from "@lib/util/contact-request"
import { getProductPrice } from "@lib/util/get-product-price"
import { specSheetUrl } from "@lib/util/product-specs"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import {
  Phone,
  ArrowRight,
  Check,
  Clock,
  ClipboardCheck,
  ClipboardPlus,
  FileText,
} from "lucide-react"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  /**
   * No prices / cart: the CTA becomes "Adicionar ao orçamento" (quote list),
   * with "Estou interessado neste produto" for a single-product request.
   */
  catalogMode?: boolean
}

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce(
    (acc: Record<string, string | undefined>, varopt: any) => {
      if (
        varopt.option &&
        varopt.value !== null &&
        varopt.value !== undefined
      ) {
        acc[varopt.option.title] = varopt.value
      }
      return acc
    },
    {}
  )
}

const primaryCta =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-pill bg-brand-cyan px-6 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-0.5 hover:bg-brand-cyan-ink disabled:opacity-50 disabled:hover:translate-y-0"

const outlineCta =
  "flex h-12 w-full items-center justify-center gap-2 rounded-pill border-[1.5px] border-hairline bg-white px-5 text-[13px] font-bold text-brand-ink transition-colors hover:border-brand-cyan hover:text-brand-cyan"

export default function ProductActions({
  product,
  region,
  disabled,
  catalogMode = false,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [contactOpen, setContactOpen] = useState(false)
  const countryCode = useParams().countryCode as string
  // Quote list — only provided in catalog mode.
  const quoteList = useQuoteList()
  const quote = catalogMode ? quoteList : null
  /** Primary CTA ("Pedir orçamento" / add to cart) — drives the mobile bar. */
  const ctaRef = useRef<HTMLButtonElement>(null)
  /** Whatever opened the enquiry dialog — focused again when it closes. */
  const triggerRef = useRef<HTMLElement | null>(null)

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const openEnquiry = useCallback((e?: React.MouseEvent<HTMLElement>) => {
    triggerRef.current = e?.currentTarget ?? null
    setContactOpen(true)
  }, [])
  /** `?pedido=1` deep link: no opener — focus returns to the main CTA. */
  const openFromLink = useCallback(() => {
    triggerRef.current = null
    setContactOpen(true)
  }, [])
  const closeEnquiry = useCallback(() => setContactOpen(false), [])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))
  }

  // Real stock availability (ignores backorder) — drives the "sob encomenda"
  // label/icon. Backorder is allowed on the variants, so we still let the user
  // add it; this only changes how the action is presented.
  const hasStock = useMemo(() => {
    if (!selectedVariant) return false
    if (!selectedVariant.manage_inventory) return true
    return (selectedVariant.inventory_quantity || 0) > 0
  }, [selectedVariant])

  // Quote list line for this product (per variant when it has several).
  const multiVariant = (product.variants?.length ?? 0) > 1
  const needsVariant = multiVariant && !selectedVariant
  const quoteProduct: QuoteProductInput | null =
    product.id && product.handle && product.title
      ? {
          productId: product.id,
          variantId: multiVariant ? selectedVariant?.id : undefined,
          handle: product.handle,
          title:
            multiVariant && selectedVariant?.title
              ? `${product.title} — ${selectedVariant.title}`
              : product.title,
          sku:
            (multiVariant ? selectedVariant?.sku : product.variants?.[0]?.sku) ??
            undefined,
          thumbnail: product.thumbnail ?? undefined,
        }
      : null
  const quoteLine =
    quote && quoteProduct && !needsVariant ? quote.find(quoteProduct) : undefined

  const addToQuote = () => {
    if (!quote || !quoteProduct || needsVariant || disabled) return
    const res = quote.add(quoteProduct, quantity)
    if (res.status !== "full") setQuantity(1)
  }

  // Show the mobile bar whenever the primary CTA itself is off-screen (under
  // the sticky header or behind the bar). null = not measured yet.
  const ctaInView = useInViewport(ctaRef, "-140px 0px -88px 0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (catalogMode || !selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })

    setIsAdding(false)
  }

  // gross (c/IVA) hint from the Moloni VAT % stored on the product
  const { variantPrice, cheapestPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
  })
  const selectedPrice = selectedVariant ? variantPrice : cheapestPrice
  const vatPct = Number((product.metadata as any)?.moloni_vat_percent)
  const grossLabel =
    selectedPrice && Number.isFinite(vatPct) && vatPct > 0
      ? new Intl.NumberFormat("pt-PT", {
          style: "currency",
          currency: (
            (selectedPrice as any).currency_code || "eur"
          ).toUpperCase(),
        }).format(
          ((selectedPrice as any).calculated_price_number || 0) *
            (1 + vatPct / 100)
        )
      : null

  const hasSpecSheet = !!specSheetUrl(
    product.metadata as Record<string, unknown> | null
  )

  /** Secondary row: call + spec sheet. */
  const secondaryRow = (
    <div
      className={clx(
        "grid grid-cols-1 gap-3",
        hasSpecSheet && "xsmall:grid-cols-2"
      )}
    >
      <div>
        <a
          href={COMPANY.phone.href}
          className={outlineCta}
          data-testid="product-call-cta"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Ligar {COMPANY.phone.display}
        </a>
        <p className="mt-1.5 text-center text-[11px] leading-4 text-grey-50">
          {COMPANY.phone.costNote}
          <span className="block" data-testid="product-call-hours">
            {shortHours(COMPANY.hours)}
          </span>
        </p>
      </div>
      {hasSpecSheet && (
        <ProductSpecSheet product={product} className="w-full" />
      )}
    </div>
  )

  return (
    <>
      <div className="flex flex-col gap-y-2">
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.title ?? ""]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        {catalogMode ? (
          <>
            {/* Catalog mode: no price / cart — enquiry CTA */}
            <div className="border-y border-hairline py-4">
              <p
                className="text-xl font-extrabold tracking-[-0.01em] text-brand-ink"
                data-testid="price-on-request"
              >
                Preço sob consulta
              </p>
              <p className="mt-1 text-sm leading-relaxed text-grey-60">
                {quote
                  ? "Junte este e outros produtos ao seu orçamento — enviamos uma proposta para a sua empresa."
                  : "Indique quantidades e condições — enviamos uma proposta para a sua empresa."}
              </p>
            </div>

            {quote ? (
              <div className="flex flex-col gap-3" data-testid="pdp-quote">
                <div className="flex items-stretch gap-2 xsmall:gap-3">
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    label="Quantidade"
                    size="lg"
                    disabled={!!disabled}
                    data-testid="pdp-quote-quantity"
                  />
                  <button
                    ref={ctaRef}
                    type="button"
                    onClick={addToQuote}
                    disabled={!!disabled || needsVariant || !quoteProduct}
                    data-testid="add-to-quote-cta"
                    className={clx(
                      primaryCta,
                      "min-w-0 flex-1 px-3 normal-case tracking-normal text-[15px] xsmall:px-6"
                    )}
                  >
                    {needsVariant ? (
                      "Selecione uma opção"
                    ) : (
                      <>
                        <ClipboardPlus
                          className="hidden h-[18px] w-[18px] flex-none min-[400px]:block"
                          aria-hidden="true"
                        />
                        <span className="truncate">Adicionar ao orçamento</span>
                      </>
                    )}
                  </button>
                </div>

                {quoteLine && (
                  <p
                    className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-btn bg-brand-cyan-50 px-3.5 py-2 text-sm font-semibold text-brand-ink"
                    data-testid="pdp-quote-state"
                  >
                    <ClipboardCheck
                      className="h-4 w-4 flex-none text-brand-cyan"
                      aria-hidden="true"
                    />
                    <span>
                      No seu orçamento ·{" "}
                      <span data-testid="pdp-quote-state-qty">
                        {quoteLine.quantity}
                      </span>{" "}
                      un.
                    </span>
                    <LocalizedClientLink
                      href="/orcamento"
                      className="ml-auto inline-flex min-h-[44px] items-center gap-1 font-bold text-brand-cyan underline-offset-2 hover:text-brand-cyan-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                      data-testid="pdp-quote-view"
                    >
                      Ver orçamento ({quote.count})
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </LocalizedClientLink>
                  </p>
                )}

                <button
                  type="button"
                  onClick={openEnquiry}
                  disabled={!!disabled}
                  data-testid="request-info-cta"
                  className="mx-auto inline-flex min-h-[44px] items-center gap-2 rounded-pill px-3 text-sm font-bold text-brand-cyan underline-offset-4 transition-colors hover:text-brand-cyan-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Estou interessado neste produto
                </button>
                {secondaryRow}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  ref={ctaRef}
                  type="button"
                  onClick={openEnquiry}
                  disabled={!!disabled}
                  data-testid="request-info-cta"
                  className={primaryCta}
                >
                  Pedir orçamento
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                {secondaryRow}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Price box */}
            <div className="my-2 flex items-end gap-3 border-y border-hairline py-5">
              <ProductPrice product={product} variant={selectedVariant} />
              {grossLabel && (
                <span className="ml-auto text-right text-xsmall-regular leading-snug text-grey-50">
                  <b className="block text-small-regular text-grey-70">
                    {grossLabel} c/ IVA
                  </b>
                </span>
              )}
            </div>
            <p className="-mt-1 text-xs text-grey-50">
              Preço sem IVA — IVA à taxa legal em vigor.
            </p>

            {/* Buy row: quantity + add to cart */}
            <div className="mt-2 flex items-stretch gap-3">
              <div className="flex items-center overflow-hidden rounded-pill border-[1.5px] border-hairline">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-[52px] w-11 text-lg text-brand-ink hover:bg-grey-10"
                >
                  −
                </button>
                <input
                  value={quantity}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    setQuantity(Number.isFinite(n) && n > 0 ? n : 1)
                  }}
                  inputMode="numeric"
                  aria-label="Quantidade"
                  className="h-[52px] w-12 text-center text-base font-bold text-brand-ink outline-none"
                />
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-[52px] w-11 text-lg text-brand-ink hover:bg-grey-10"
                >
                  +
                </button>
              </div>

              <button
                ref={ctaRef}
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedVariant || !!disabled || isAdding}
                data-testid="add-product-button"
                className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-pill bg-brand-ink text-[13px] font-bold uppercase tracking-[0.04em] text-white transition hover:-translate-y-0.5 hover:bg-brand-cyan disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-brand-ink"
              >
                {!selectedVariant ? (
                  "Selecionar variante"
                ) : isAdding ? (
                  "A adicionar…"
                ) : !hasStock ? (
                  <>
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    Adicionar (sob encomenda)
                  </>
                ) : (
                  <>
                    Adicionar ao carrinho
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>

            {/* Secondary: quote request for larger / business quantities */}
            <div className="mt-3 flex flex-col gap-3">
              <button
                type="button"
                onClick={openEnquiry}
                data-testid="contact-cta"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-pill border-[1.5px] border-brand-cyan bg-white text-[13px] font-bold uppercase tracking-[0.04em] text-brand-cyan transition hover:bg-brand-cyan hover:text-white"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Pedir orçamento
              </button>
              {secondaryRow}
            </div>
          </>
        )}

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={hasStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!disabled && ctaInView === false}
          optionsDisabled={!!disabled || isAdding}
          catalogMode={catalogMode}
          onRequestInfo={openEnquiry}
          quote={
            quote
              ? {
                  count: quote.count,
                  onAdd: addToQuote,
                  disabled: !!disabled || needsVariant || !quoteProduct,
                  needsVariant,
                }
              : undefined
          }
        />
      </div>

      {/* Only the live instance (not the disabled Suspense fallback). */}
      {!disabled && (
        <>
          <Suspense fallback={null}>
            <EnquiryDeepLink onOpen={openFromLink} />
          </Suspense>
          <ContactModal
            open={contactOpen}
            onClose={closeEnquiry}
            returnFocusRef={triggerRef}
            fallbackFocusRef={ctaRef}
            product={{
              title: product.title,
              sku:
                selectedVariant?.sku ?? product.variants?.[0]?.sku ?? undefined,
              thumbnail: product.thumbnail,
              quantity: catalogMode ? undefined : quantity,
            }}
          />
        </>
      )}
    </>
  )
}
