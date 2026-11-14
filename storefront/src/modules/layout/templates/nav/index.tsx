import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { getNavGroups, listCategories } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import CategoryNav from "@modules/layout/components/category-nav"
import SearchBox, {
  type SearchBrand,
  type SearchCategory,
} from "@modules/layout/components/search-box"
import {
  MobileHeaderProvider,
  MobileSearchRow,
  MobileSearchToggle,
} from "@modules/layout/components/mobile-header"
import {
  QuoteNavIcon,
  QuoteNavPill,
} from "@modules/quote/components/quote-nav-link"
import { Mail, Phone, User, ShoppingBag, Wrench } from "lucide-react"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { COMPANY } from "@lib/company"
import { brandForCategory } from "@lib/brands"
import {
  displayCategoryName,
  isInternalCategory,
} from "@lib/util/category-display"

// Flatten categories for the predictive search, excluding internal parts/repair
// categories (EQ_/ML_ prefixes, "Maquinas / Acessórios") that aren't browsable.
// Brand roots ("Diversey", "SCJohnson (DEB)"…) are suggested as Marcas (with
// their best landing page) instead, but their sub-ranges stay as subcategories.
function buildSearchCategories(all: any[]): SearchCategory[] {
  const out: SearchCategory[] = []
  for (const c of all || []) {
    if (c.parent_category_id || isInternalCategory(c.name)) continue
    const isBrand = !!brandForCategory(c)
    if (!isBrand) {
      out.push({
        name: displayCategoryName(c.name),
        handle: c.handle,
        type: "category",
      })
    }
    for (const ch of c.category_children || []) {
      if (isInternalCategory(ch.name)) continue
      out.push({
        name: displayCategoryName(ch.name, c.name),
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
  const searchBrands: SearchBrand[] = brands.map((b) => ({
    name: b.label,
    href: b.href,
  }))
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
    <MobileHeaderProvider>
      {/* Desktop: the whole block (topbar, header, category strip) is pinned.
          Mobile: the wrapper dissolves (display: contents) so the dark topbar
          scrolls away and only the logo row + the (collapsible) search row are
          pinned against the page. */}
      <div className="contents small:sticky small:top-0 small:z-50 small:block">
        {/* Utility topbar — dark "pro" register: who we are + the service entry */}
        <div className="bg-svc-ground text-[#aeb6c0]">
          <div className="content-container flex items-center justify-between gap-x-3 h-9 text-xs font-medium">
            <div className="flex min-w-0 items-center gap-x-5">
              {/* Too tight below ~360px: the service pill keeps the row. */}
              <span className="flex min-w-0 items-center gap-x-2 max-[359px]:hidden">
                <span className="ind flex-none" />
                <span className="truncate">
                  <span className="small:hidden">Desde {COMPANY.since}</span>
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
            <div className="flex shrink-0 items-center gap-x-5 max-[359px]:ml-auto">
              {/* Desktop only — on mobile the side menu carries it. */}
              <LocalizedClientLink
                href="/sobre-nos"
                className="hidden h-9 items-center hover:text-white transition-colors small:inline-flex"
                data-testid="util-about-link"
              >
                Sobre nós
              </LocalizedClientLink>
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
        </div>

        {/* Main header — logo, search, phone + quote CTA (account/cart when
            selling). On mobile only the logo row; search is its own row below. */}
        <header className="glass sticky top-0 z-50 border-b border-hairline/80 small:static">
          <div
            className={`content-container flex items-center small:gap-x-6 h-[60px] small:h-[84px] ${
              catalogMode ? "gap-x-2 min-[360px]:gap-x-3" : "gap-x-3"
            }`}
          >
            <LocalizedClientLink
              href="/"
              // 44px tap target and a rounded focus ring with breathing room;
              // the negative margin keeps the logo exactly where it was.
              className="-mx-2 flex min-h-[44px] shrink-0 items-center rounded-[10px] px-2 transition-opacity hover:opacity-80"
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
                className={`w-auto small:h-[35px] ${
                  // Catalog mode adds the quote icon to the mobile row: a
                  // slightly smaller logo keeps the row inside 320px.
                  catalogMode ? "h-[26px] min-[360px]:h-[30px]" : "h-[30px]"
                }`}
              />
            </LocalizedClientLink>

            {/* Mobile: search (when its row is hidden), tap-to-call, hamburger */}
            <div className="small:hidden flex items-center gap-x-0.5 shrink-0 ml-auto">
              <MobileSearchToggle />
              <a
                href={COMPANY.phone.href}
                aria-label={`Ligar ${COMPANY.phone.display} (${COMPANY.phone.costNote.toLowerCase()})`}
                className="flex h-11 w-11 items-center justify-center rounded-pill text-brand-ink transition-colors hover:bg-brand-cyan-50 hover:text-brand-cyan-ink"
                data-testid="nav-call-link"
              >
                <Phone className="h-[21px] w-[21px]" />
              </a>
              {catalogMode && <QuoteNavIcon />}
              <SideMenu
                regions={regions}
                categories={categories}
                brands={brands}
                catalogMode={catalogMode}
              />
            </div>

            {/* Desktop search */}
            <div className="hidden small:flex small:flex-1 small:max-w-[520px] min-w-0 items-center">
              <SearchBox categories={searchCategories} brands={searchBrands} />
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

              {catalogMode ? (
                // Quote list: "Pedir orçamento" / "Orçamento (N)" → /orcamento
                <QuoteNavPill />
              ) : (
                <LocalizedClientLink
                  href="/contact"
                  data-testid="nav-quote-link"
                  className="inline-flex items-center whitespace-nowrap rounded-pill bg-brand-cyan px-5 py-3 text-xs font-bold uppercase tracking-[0.04em] text-white shadow-[0_8px_20px_rgba(0,173,239,0.25)] transition-colors hover:bg-brand-cyan-ink"
                >
                  Pedir orçamento
                </LocalizedClientLink>
              )}

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

        {/* Mobile search row (+ cart when selling) — slides away on scroll-down */}
        <MobileSearchRow>
          <SearchBox categories={searchCategories} brands={searchBrands} />
          {!catalogMode && (
            <div className="shrink-0">
              <Suspense fallback={cartFallback}>
                <CartButton />
              </Suspense>
            </div>
          )}
        </MobileSearchRow>

        {/* Category strip — real product categories + "Marcas" (desktop) */}
        <CategoryNav categories={categories} brands={brands} />
      </div>
    </MobileHeaderProvider>
  )
}
