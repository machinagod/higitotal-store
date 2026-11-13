"use client"

import { Dialog, Transition } from "@headlessui/react"
import { useToggleState } from "@medusajs/ui"
import { Fragment, useId, useRef, useState, type ReactNode } from "react"
import {
  ChevronRight,
  Clock,
  LayoutGrid,
  Mail,
  Phone,
  ShoppingBag,
  User,
  Wrench,
  X,
} from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryIcon from "@modules/common/icons/category-icon"
import CountrySelect from "../country-select"
import { HttpTypes } from "@medusajs/types"
import { COMPANY } from "@lib/company"
import { shortHours } from "./hours"

type NavLink = { label: string; href: string; icon?: string }

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
  "flex items-center gap-3 rounded-[12px] px-2 py-2.5 text-[17px] font-semibold leading-snug text-white transition-colors hover:bg-white/[0.06] hover:text-brand-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"

/**
 * Mobile menu — a modal dialog (Headless UI `Dialog`): focus moves to the
 * first link on open and is trapped inside, the rest of the page is inert,
 * Escape / the close button / a tap on the backdrop close it, and focus goes
 * back to the hamburger. Pinned at the bottom: phone + opening hours and the
 * quote CTA.
 */
const SideMenu = ({
  regions,
  categories = [],
  brands = [],
  catalogMode = false,
}: {
  regions: HttpTypes.StoreRegion[] | null
  categories?: NavLink[]
  brands?: NavLink[]
  /** Catalog mode has no prices/cart → no account, cart or country selector. */
  catalogMode?: boolean
}) => {
  const toggleState = useToggleState()
  const [open, setOpen] = useState(false)
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null)
  const uid = useId()
  const panelId = `${uid}-menu`
  const close = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        data-testid="nav-menu-button"
        aria-label="Abrir menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(true)}
        className="relative flex h-11 w-11 items-center justify-center rounded-pill text-brand-ink transition-colors hover:bg-[#f1f4f7] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <Transition show={open} as={Fragment}>
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
                              <CategoryIcon
                                name={item.icon}
                                className="h-[18px] w-[18px]"
                              />
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
                    </ul>
                  </nav>
                )}

                <ul className="mt-6 border-t border-svc-line px-0 pt-4">
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
                  href="/contact"
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
    </>
  )
}

export default SideMenu
