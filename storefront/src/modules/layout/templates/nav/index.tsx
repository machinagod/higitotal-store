import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { getNavGroups, listCategories } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import CategoryNav from "@modules/layout/components/category-nav"
import SearchBox, {
  type SearchCategory,
} from "@modules/layout/components/search-box"
import { Mail, Phone, User, ShoppingBag, Wrench } from "lucide-react"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { COMPANY } from "@lib/company"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"

// Flatten categories for the predictive search, excluding internal parts/repair
// categories (EQ_/ML_ prefixes, "Maquinas / Acessórios") that aren't browsable.
function buildSearchCategories(all: any[]): SearchCategory[] {
  const out: SearchCategory[] = []
  for (const c of all || []) {
    if (c.parent_category_id || isInternalCategory(c.name)) continue
    out.push({
      name: displayCategoryName(c.name),
      handle: c.handle,
      type: "category",
    })
    for (const ch of c.category_children || []) {
      if (isInternalCategory(ch.name)) continue
      out.push({
        name: displayCategoryName(ch.name),
        handle: ch.handle,
        type: "subcategory",
        parent: displayCategoryName(c.name),
      })
    }
  }
  return out
}

export default async function Nav() {
  const regions = await listRegions().then((regions: StoreRegion[]) => regions)
  const { categories, brands } = await getNavGroups()
  const searchCategories = buildSearchCategories(await listCategories())
  // Catalog mode (no prices / no cart) hides the cart and the account link.
  const catalogMode = isCatalogMode()

  const cartFallback = (
    <LocalizedClientLink
      href="/cart"
      data-testid="nav-cart-link"
      className="flex items-center gap-x-1.5 small:gap-x-2.5 px-3 small:px-4 py-2.5 rounded-pill bg-brand-ink text-white text-xs font-semibold uppercase tracking-wide hover:bg-black transition-colors"
    >
      <ShoppingBag className="h-[18px] w-[18px]" />
      <span className="hidden small:inline">Carrinho</span>
      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-pill bg-brand-cyan text-white text-[11px] font-bold">
        0
      </span>
    </LocalizedClientLink>
  )

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      {/* Utility topbar — dark "pro" register: who we are + the service entry */}
      <div className="bg-svc-ground text-[#aeb6c0]">
        <div className="content-container flex items-center justify-between gap-x-3 h-9 text-xs font-medium">
          <div className="flex min-w-0 items-center gap-x-5">
            <span className="flex min-w-0 items-center gap-x-2">
              <span className="ind flex-none" />
              <span className="truncate">
                <span className="small:hidden">
                  Desde {COMPANY.since}
                </span>
                <span className="hidden small:inline">
                  Especialistas em higiene profissional desde {COMPANY.since}
                </span>
              </span>
            </span>
            <a
              href={`mailto:${COMPANY.email}`}
              className="hidden small:inline-flex items-center gap-x-1.5 hover:text-white transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              {COMPANY.email}
            </a>
          </div>
          <LocalizedClientLink
            href="/assistencia-tecnica"
            className="inline-flex shrink-0 items-center gap-x-1.5 rounded-pill bg-svc-signal px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-svc-signal-ink"
            data-testid="util-assistencia-link"
          >
            <Wrench className="h-3 w-3" />
            Assistência Técnica
          </LocalizedClientLink>
        </div>
      </div>

      {/* Main header — logo, search, phone + quote CTA (account/cart when selling) */}
      <header className="bg-white border-b border-hairline">
        <div className="content-container flex items-center gap-x-3 small:gap-x-6 min-h-[60px] small:h-[84px] py-2 small:py-0 flex-wrap small:flex-nowrap">
          <LocalizedClientLink
            href="/"
            className="flex items-center shrink-0"
            data-testid="nav-store-link"
            aria-label="Higitotal — página inicial"
          >
            {/* Tagline-free wordmark (the tagline is unreadable at header size). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/higitotal/logo-wordmark-hd.png"
              alt="Higitotal"
              width={560}
              height={148}
              className="h-[30px] w-auto small:h-[35px]"
            />
          </LocalizedClientLink>

          {/* Mobile: tap-to-call + hamburger, pinned right on the logo row */}
          <div className="small:hidden flex items-center gap-x-1 shrink-0 ml-auto">
            <a
              href={COMPANY.phone.href}
              aria-label={`Ligar ${COMPANY.phone.display} (${COMPANY.phone.costNote.toLowerCase()})`}
              className="flex h-11 w-11 items-center justify-center rounded-pill text-brand-ink transition-colors hover:bg-brand-cyan-50 hover:text-brand-cyan-ink"
              data-testid="nav-call-link"
            >
              <Phone className="h-[21px] w-[21px]" />
            </a>
            <SideMenu
              regions={regions}
              categories={categories}
              brands={brands}
              catalogMode={catalogMode}
            />
          </div>

          {/* Search (+ cart when selling). On mobile its own full-width row. */}
          <div className="order-last small:order-none basis-full min-w-0 small:basis-auto small:flex-1 small:max-w-[520px] flex items-center gap-x-2">
            <SearchBox categories={searchCategories} />
            {!catalogMode && (
              <div className="small:hidden shrink-0">
                <Suspense fallback={cartFallback}>
                  <CartButton />
                </Suspense>
              </div>
            )}
          </div>

          {/* Desktop right group — phone, quote CTA, account/cart when selling */}
          <div className="hidden small:flex items-center gap-x-5 ml-auto">
            <a
              href={COMPANY.phone.href}
              className={`group items-center gap-x-3 ${
                catalogMode ? "flex" : "hidden medium:flex"
              }`}
              data-testid="nav-phone-link"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-cyan-50 text-brand-cyan transition-colors group-hover:bg-brand-cyan group-hover:text-white">
                <Phone className="h-[18px] w-[18px]" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="whitespace-nowrap text-[18px] font-extrabold tracking-tight text-brand-ink">
                  {COMPANY.phone.display}
                </span>
                <span className="whitespace-nowrap text-[11px] font-medium text-[#6b7580]">
                  Seg–Sex · {COMPANY.phone.costNote}
                </span>
              </span>
            </a>

            <LocalizedClientLink
              href="/contact"
              data-testid="nav-quote-link"
              className="inline-flex items-center whitespace-nowrap rounded-pill bg-brand-cyan px-5 py-3 text-xs font-bold uppercase tracking-[0.04em] text-white shadow-[0_8px_20px_rgba(0,173,239,0.25)] transition-colors hover:bg-brand-cyan-ink"
            >
              Pedir orçamento
            </LocalizedClientLink>

            {!catalogMode && (
              <div className="flex items-center gap-x-1">
                <LocalizedClientLink
                  href="/account"
                  data-testid="nav-account-link"
                  className="flex items-center gap-x-2 px-3 py-2.5 rounded-pill text-xs font-semibold uppercase tracking-wide text-brand-ink hover:bg-[#f1f4f7] transition-colors"
                >
                  <User className="h-[18px] w-[18px]" />
                  <span className="hidden medium:inline">Conta</span>
                </LocalizedClientLink>
                <Suspense fallback={cartFallback}>
                  <CartButton />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Category strip — real product categories + "Marcas" (desktop) */}
      <CategoryNav categories={categories} brands={brands} />
    </div>
  )
}
