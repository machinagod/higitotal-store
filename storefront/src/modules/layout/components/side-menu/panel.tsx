"use client"

import { Dialog, Transition } from "@headlessui/react"
import { useToggleState } from "@medusajs/ui"
import dynamic from "next/dynamic"
import { Fragment, useRef, type ReactNode } from "react"
import {
  ArrowRight,
  Building2,
  ChevronRight,
  ClipboardList,
  Clock,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  User,
  Wrench,
  X,
} from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { BRANDS_PATH } from "@lib/brands"
import { COMPANY } from "@lib/company"
import { useQuoteList } from "@lib/quote-list/context"
import { productCountLabel } from "@lib/quote-list/state"
import { shortHours } from "./hours"

// Only rendered when selling (never in catalog mode): its Listbox, flags and
// region names load with it, not with the menu.
const CountrySelect = dynamic(() => import("../country-select"), { ssr: false })

type NavLink = { label: string; href: string; icon?: string }

export type SideMenuPanelProps = {
  open: boolean
  onClose: () => void
  /** id of the panel (the hamburger's aria-controls). */
  panelId: string
  /** useId() of the trigger, for the section headings. */
  uid: string
  regions: HttpTypes.StoreRegion[] | null
  categories: NavLink[]
  categoryIcons: Record<string, ReactNode>
  brands: NavLink[]
  catalogMode: boolean
}

function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-svc-fg-muted"
    >
      <span className="ind" />
      {children}
    </h2>
  )
}

const rowClass =
  "flex min-h-[44px] items-center gap-3 rounded-[12px] px-2 py-2.5 text-[17px] font-semibold leading-snug text-white transition-colors hover:bg-white/[0.06] hover:text-brand-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"

/**
 * The mobile menu dialog (Headless UI `Dialog`): focus moves to the first link
 * on open and is trapped inside, the rest of the page is inert, Escape / the
 * close button / a tap on the backdrop close it, and focus goes back to the
 * hamburger. Pinned at the bottom: phone + opening hours and the quote CTA.
 *
 * Its own chunk, loaded on first use (see ./index): nothing here is needed to
 * render or hydrate the page.
 */
export default function SideMenuPanel({
  open,
  onClose: close,
  panelId,
  uid,
  regions,
  categories,
  categoryIcons,
  brands,
  catalogMode,
}: SideMenuPanelProps) {
  const toggleState = useToggleState()
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null)
  // Quote list (catalog mode only — null otherwise).
  const quoteList = useQuoteList()
  const quote = catalogMode ? quoteList : null
  const quoteCount = quote?.count ?? 0

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog
        as="div"
        className="relative z-[60]"
        onClose={close}
        initialFocus={firstLinkRef}
        aria-label="Menu principal"
      >
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-150 motion-reduce:transition-none"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150 motion-reduce:transition-none"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-200 motion-reduce:transition-none"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in duration-150 motion-reduce:transition-none"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <Dialog.Panel
            id={panelId}
            data-testid="nav-menu-popup"
            className="fixed inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-svc-ground text-svc-fg shadow-2xl"
          >
            <Dialog.Title className="sr-only">Menu</Dialog.Title>

            {/* Header */}
            <div className="flex h-16 flex-none items-center justify-between border-b border-svc-line px-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/higitotal/logo-reversed-trim.png"
                alt="Higitotal"
                width={560}
                height={150}
                className="h-7 w-auto"
              />
              <button
                type="button"
                data-testid="close-menu-button"
                aria-label="Fechar menu"
                className="flex h-11 w-11 items-center justify-center rounded-pill text-svc-fg-muted transition-colors hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                onClick={close}
              >
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-5">
              {categories.length > 0 && (
                <nav aria-labelledby={`${uid}-cats`} className="px-2">
                  <SectionTitle id={`${uid}-cats`}>Categorias</SectionTitle>
                  <ul className="-mx-2">
                    {categories.map((item, i) => (
                      <li key={item.href}>
                        <LocalizedClientLink
                          href={item.href}
                          className={rowClass}
                          onClick={close}
                          ref={i === 0 ? firstLinkRef : undefined}
                        >
                          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-white/[0.06] text-brand-cyan">
                            {categoryIcons[item.href]}
                          </span>
                          <span className="min-w-0 flex-1">{item.label}</span>
                        </LocalizedClientLink>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {brands.length > 0 && (
                <nav aria-labelledby={`${uid}-brands`} className="mt-6 px-2">
                  <SectionTitle id={`${uid}-brands`}>Marcas</SectionTitle>
                  <ul className="flex flex-wrap gap-2 pt-1">
                    {brands.map((b) => (
                      <li key={b.href}>
                        <LocalizedClientLink
                          href={b.href}
                          onClick={close}
                          className="inline-flex min-h-[44px] items-center rounded-pill border border-svc-line px-4 py-2 text-[15px] font-semibold text-svc-fg transition-colors hover:border-brand-cyan hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                        >
                          {b.label}
                        </LocalizedClientLink>
                      </li>
                    ))}
                    <li>
                      <LocalizedClientLink
                        href={BRANDS_PATH}
                        onClick={close}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill px-4 py-2 text-[15px] font-bold text-brand-cyan-bright transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                        data-testid="menu-brands-all"
                      >
                        Ver todas as marcas
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </LocalizedClientLink>
                    </li>
                  </ul>
                </nav>
              )}

              <ul className="mt-6 border-t border-svc-line px-0 pt-4">
                {quote && (
                  <li>
                    <LocalizedClientLink
                      href="/orcamento"
                      className={rowClass}
                      onClick={close}
                      data-testid="menu-quote-list-link"
                      aria-label={
                        quoteCount
                          ? `O meu orçamento: ${productCountLabel(quoteCount)}`
                          : "O meu orçamento (lista vazia)"
                      }
                    >
                      <ClipboardList className="mx-2 h-5 w-5 text-brand-cyan-bright" aria-hidden />
                      <span className="flex-1">O meu orçamento</span>
                      {quoteCount > 0 && (
                        <span
                          className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-pill bg-brand-cyan-bright px-1.5 text-xs font-extrabold text-svc-ground"
                          aria-hidden
                          data-testid="menu-quote-count"
                        >
                          {quoteCount > 99 ? "99+" : quoteCount}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-svc-fg-muted" aria-hidden />
                    </LocalizedClientLink>
                  </li>
                )}
                <li>
                  <LocalizedClientLink
                    href="/store"
                    className={rowClass}
                    onClick={close}
                    data-testid="store-link"
                    ref={categories.length === 0 ? firstLinkRef : undefined}
                  >
                    <LayoutGrid className="mx-2 h-5 w-5 text-svc-fg-muted" aria-hidden />
                    <span className="flex-1">Catálogo</span>
                    <ChevronRight className="h-4 w-4 text-svc-fg-muted" aria-hidden />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/assistencia-tecnica"
                    className={rowClass}
                    onClick={close}
                    data-testid="assistencia-tecnica-link"
                  >
                    <Wrench className="mx-2 h-5 w-5 text-svc-signal" aria-hidden />
                    <span className="flex-1">Assistência Técnica</span>
                    <ChevronRight className="h-4 w-4 text-svc-fg-muted" aria-hidden />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/contact"
                    className={rowClass}
                    onClick={close}
                    data-testid="contact-link"
                  >
                    <Mail className="mx-2 h-5 w-5 text-svc-fg-muted" aria-hidden />
                    <span className="flex-1">Contactos</span>
                    <ChevronRight className="h-4 w-4 text-svc-fg-muted" aria-hidden />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/a-nossa-loja"
                    className={rowClass}
                    onClick={close}
                    data-testid="store-location-link"
                  >
                    <MapPin className="mx-2 h-5 w-5 text-svc-fg-muted" aria-hidden />
                    <span className="flex-1">A nossa loja</span>
                    <ChevronRight className="h-4 w-4 text-svc-fg-muted" aria-hidden />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/sobre-nos"
                    className={rowClass}
                    onClick={close}
                    data-testid="about-link"
                  >
                    <Building2 className="mx-2 h-5 w-5 text-svc-fg-muted" aria-hidden />
                    <span className="flex-1">Sobre nós</span>
                    <ChevronRight className="h-4 w-4 text-svc-fg-muted" aria-hidden />
                  </LocalizedClientLink>
                </li>
                {!catalogMode && (
                  <>
                    <li>
                      <LocalizedClientLink
                        href="/account"
                        className={rowClass}
                        onClick={close}
                        data-testid="account-link"
                      >
                        <User className="mx-2 h-5 w-5 text-svc-fg-muted" aria-hidden />
                        <span className="flex-1">Conta</span>
                        <ChevronRight className="h-4 w-4 text-svc-fg-muted" aria-hidden />
                      </LocalizedClientLink>
                    </li>
                    <li>
                      <LocalizedClientLink
                        href="/cart"
                        className={rowClass}
                        onClick={close}
                        data-testid="nav-cart-link"
                      >
                        <ShoppingBag className="mx-2 h-5 w-5 text-svc-fg-muted" aria-hidden />
                        <span className="flex-1">Carrinho</span>
                        <ChevronRight className="h-4 w-4 text-svc-fg-muted" aria-hidden />
                      </LocalizedClientLink>
                    </li>
                  </>
                )}
              </ul>

              {/* Shipping country — only when selling (catalog mode has no
                  checkout, so the selector would be meaningless). */}
              {!catalogMode && regions && (
                <div
                  className="mt-4 px-2 text-sm text-svc-fg-muted"
                  onMouseEnter={toggleState.open}
                  onMouseLeave={toggleState.close}
                >
                  <CountrySelect toggleState={toggleState} regions={regions} />
                </div>
              )}
            </div>

            {/* Pinned contact block — phone + opening hours, quote CTA */}
            <div className="flex-none border-t border-svc-line bg-svc-ground-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <div className="flex items-center justify-between gap-3">
                <a
                  href={COMPANY.phone.href}
                  className="flex min-w-0 items-center gap-3 rounded-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                  data-testid="menu-call-link"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-cyan/15 text-brand-cyan">
                    <Phone className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="whitespace-nowrap text-[18px] font-extrabold tracking-tight text-white">
                      {COMPANY.phone.display}
                    </span>
                    <span className="text-xs font-medium text-svc-fg-muted">
                      {COMPANY.phone.costNote}
                    </span>
                  </span>
                </a>
              </div>
              <p
                className="mt-2.5 flex items-start gap-2 pl-[52px] text-xs font-medium leading-snug text-svc-fg-muted"
                data-testid="menu-hours"
              >
                <Clock className="mt-px h-3.5 w-3.5 flex-none" aria-hidden />
                <span>
                  <span className="sr-only">Horário: </span>
                  {shortHours(COMPANY.hours)}
                </span>
              </p>
              <LocalizedClientLink
                href={catalogMode ? "/orcamento" : "/contact"}
                onClick={close}
                data-testid="menu-quote-link"
                className="mt-4 flex w-full items-center justify-center rounded-pill bg-brand-cyan px-5 py-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-brand-cyan-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Pedir orçamento
              </LocalizedClientLink>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  )
}
