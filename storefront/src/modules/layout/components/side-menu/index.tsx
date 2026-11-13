"use client"

import { Popover, Transition } from "@headlessui/react"
import { useToggleState } from "@medusajs/ui"
import { Fragment, useEffect, type ReactNode } from "react"
import {
  ChevronRight,
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

type NavLink = { label: string; href: string; icon?: string }

/** Locks page scroll while the full-height menu is open. */
function ScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return null
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-svc-fg-muted">
      <span className="ind" />
      {children}
    </h2>
  )
}

const rowClass =
  "flex items-center gap-3 rounded-[12px] px-2 py-2.5 text-[17px] font-semibold leading-snug text-white transition-colors hover:bg-white/[0.06] hover:text-brand-cyan"

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

  return (
    <Popover className="flex">
      {({ open, close }) => (
        <>
          <Popover.Button
            data-testid="nav-menu-button"
            aria-label="Abrir menu"
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
          </Popover.Button>

          {open && <ScrollLock />}

          <Transition
            show={open}
            as={Fragment}
            enter="transition-opacity ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Overlay className="fixed inset-0 z-[60] bg-black/50" />
          </Transition>

          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in duration-150"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Popover.Panel
              static
              data-testid="nav-menu-popup"
              className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[420px] flex-col bg-svc-ground text-svc-fg shadow-2xl"
            >
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
                  data-testid="close-menu-button"
                  aria-label="Fechar menu"
                  className="flex h-11 w-11 items-center justify-center rounded-pill text-svc-fg-muted transition-colors hover:bg-white/[0.06] hover:text-white"
                  onClick={close}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-5">
                {categories.length > 0 && (
                  <nav aria-label="Categorias" className="px-2">
                    <SectionTitle>Categorias</SectionTitle>
                    <ul className="-mx-2">
                      {categories.map((item) => (
                        <li key={item.href}>
                          <LocalizedClientLink
                            href={item.href}
                            className={rowClass}
                            onClick={close}
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
                  <nav aria-label="Marcas" className="mt-6 px-2">
                    <SectionTitle>Marcas</SectionTitle>
                    <ul className="flex flex-wrap gap-2 pt-1">
                      {brands.map((b) => (
                        <li key={b.href}>
                          <LocalizedClientLink
                            href={b.href}
                            onClick={close}
                            className="inline-flex items-center rounded-pill border border-svc-line px-4 py-2 text-[15px] font-semibold text-svc-fg transition-colors hover:border-brand-cyan hover:text-white"
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
                    >
                      <LayoutGrid className="mx-2 h-5 w-5 text-svc-fg-muted" />
                      <span className="flex-1">Catálogo</span>
                      <ChevronRight className="h-4 w-4 text-svc-fg-muted" />
                    </LocalizedClientLink>
                  </li>
                  <li>
                    <LocalizedClientLink
                      href="/assistencia-tecnica"
                      className={rowClass}
                      onClick={close}
                      data-testid="assistencia-tecnica-link"
                    >
                      <Wrench className="mx-2 h-5 w-5 text-svc-signal" />
                      <span className="flex-1">Assistência Técnica</span>
                      <ChevronRight className="h-4 w-4 text-svc-fg-muted" />
                    </LocalizedClientLink>
                  </li>
                  <li>
                    <LocalizedClientLink
                      href="/contact"
                      className={rowClass}
                      onClick={close}
                      data-testid="contact-link"
                    >
                      <Mail className="mx-2 h-5 w-5 text-svc-fg-muted" />
                      <span className="flex-1">Contactos</span>
                      <ChevronRight className="h-4 w-4 text-svc-fg-muted" />
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
                          <User className="mx-2 h-5 w-5 text-svc-fg-muted" />
                          <span className="flex-1">Conta</span>
                          <ChevronRight className="h-4 w-4 text-svc-fg-muted" />
                        </LocalizedClientLink>
                      </li>
                      <li>
                        <LocalizedClientLink
                          href="/cart"
                          className={rowClass}
                          onClick={close}
                          data-testid="nav-cart-link"
                        >
                          <ShoppingBag className="mx-2 h-5 w-5 text-svc-fg-muted" />
                          <span className="flex-1">Carrinho</span>
                          <ChevronRight className="h-4 w-4 text-svc-fg-muted" />
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

              {/* Pinned contact block */}
              <div className="flex-none border-t border-svc-line bg-svc-ground-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                <a
                  href={COMPANY.phone.href}
                  className="flex items-center gap-3"
                  data-testid="menu-call-link"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-cyan/15 text-brand-cyan">
                    <Phone className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[18px] font-extrabold tracking-tight text-white">
                      {COMPANY.phone.display}
                    </span>
                    <span className="text-xs font-medium text-svc-fg-muted">
                      {COMPANY.phone.costNote}
                    </span>
                  </span>
                </a>
                <LocalizedClientLink
                  href="/contact"
                  onClick={close}
                  data-testid="menu-quote-link"
                  className="mt-4 flex w-full items-center justify-center rounded-pill bg-brand-cyan px-5 py-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-brand-cyan-ink"
                >
                  Pedir orçamento
                </LocalizedClientLink>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}

export default SideMenu
