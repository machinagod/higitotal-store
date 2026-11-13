"use client"

import { Fragment, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Popover, Transition } from "@headlessui/react"
import { ArrowRight, ChevronDown } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryIcon from "@modules/common/icons/category-icon"

type NavLink = { label: string; href: string; icon?: string }

// How many categories show inline before the rest collapse into "Mais".
const TOP_N = 4

const itemBase =
  "inline-flex items-center gap-x-2 whitespace-nowrap rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
const itemIdle = "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"

/**
 * Desktop category strip: the first few real product categories inline, the
 * rest under "Mais", and the supplier brands under a separate right-aligned
 * "Marcas" menu (brands are never presented as categories). The active entry
 * gets a cyan dot. Client component for the current path; the surrounding nav
 * is server-rendered.
 */
const CategoryNav = ({
  categories,
  brands = [],
}: {
  categories: NavLink[]
  brands?: NavLink[]
}) => {
  const pathname = usePathname() || ""

  // href is "/categories/<handle>" or "/collections/<handle>"; pathname is
  // "/<cc>/categories/<handle>".
  const isActive = (href: string) => {
    const parts = href.split("/").filter(Boolean)
    if (parts.length < 2 || parts[0] === "results") return false
    return pathname.includes(`/${parts[0]}/${parts[1]}`)
  }

  const top = categories.slice(0, TOP_N)
  const rest = categories.slice(TOP_N)
  const restActive = rest.some((c) => isActive(c.href))
  const brandActive = brands.some((b) => isActive(b.href))

  const dot = (
    <span className="h-[7px] w-[7px] flex-none rounded-full bg-brand-cyan shadow-[0_0_0_3px_rgba(0,173,239,0.18)]" />
  )

  return (
    // Hidden on mobile — the hamburger side-menu lists categories and brands.
    <nav
      aria-label="Categorias"
      className="hidden small:block bg-white border-b border-hairline"
    >
      <div className="content-container flex items-center gap-x-1 h-[54px]">
        <div className="flex items-center gap-x-1 min-w-0 overflow-x-auto no-scrollbar">
          {top.map((cat) => {
            const active = isActive(cat.href)
            return (
              <LocalizedClientLink
                key={cat.href}
                href={cat.href}
                aria-current={active ? "page" : undefined}
                className={`${itemBase} flex-none ${
                  active ? "text-brand-cyan-ink" : itemIdle
                }`}
              >
                {active && dot}
                {cat.label}
              </LocalizedClientLink>
            )
          })}
        </div>

        {/* Dropdowns live outside the scroll container so their panels
            aren't clipped by overflow-x. */}
        {rest.length > 0 && (
          <Dropdown
            label="Mais"
            active={restActive}
            dot={dot}
            align="left"
            testId="nav-more-button"
          >
            {(close) => (
              <div className="flex min-w-[260px] flex-col">
                {rest.map((cat) => {
                  const active = isActive(cat.href)
                  return (
                    <LocalizedClientLink
                      key={cat.href}
                      href={cat.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-x-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                        active
                          ? "bg-brand-cyan-50 text-brand-cyan-ink"
                          : "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"
                      }`}
                    >
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-brand-cyan-50 text-brand-cyan">
                        <CategoryIcon name={cat.icon} className="h-4 w-4" />
                      </span>
                      {cat.label}
                    </LocalizedClientLink>
                  )
                })}
                <LocalizedClientLink
                  href="/store"
                  onClick={close}
                  className="mt-1 flex items-center justify-between gap-x-2 border-t border-hairline px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-[0.04em] text-brand-cyan-ink hover:text-brand-ink"
                >
                  Ver catálogo completo
                  <ArrowRight className="h-4 w-4" />
                </LocalizedClientLink>
              </div>
            )}
          </Dropdown>
        )}

        {brands.length > 0 && (
          <div className="ml-auto flex-none">
            <Dropdown
              label="Marcas"
              active={brandActive}
              dot={dot}
              align="right"
              testId="nav-brands-button"
            >
              {(close) => (
                <div className="grid min-w-[300px] grid-cols-2 gap-1">
                  {brands.map((b) => {
                    const active = isActive(b.href)
                    return (
                      <LocalizedClientLink
                        key={b.href}
                        href={b.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={`rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                          active
                            ? "bg-brand-cyan-50 text-brand-cyan-ink"
                            : "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"
                        }`}
                      >
                        {b.label}
                      </LocalizedClientLink>
                    )
                  })}
                </div>
              )}
            </Dropdown>
          </div>
        )}
      </div>
    </nav>
  )
}

function Dropdown({
  label,
  active,
  dot,
  align,
  testId,
  children,
}: {
  label: string
  active: boolean
  dot: ReactNode
  align: "left" | "right"
  testId?: string
  children: (close: () => void) => ReactNode
}) {
  return (
    <Popover className="relative flex-none">
      <Popover.Button
        data-testid={testId}
        className={`${itemBase} gap-x-1.5 ${
          active ? "text-brand-cyan-ink" : itemIdle
        }`}
      >
        {active && dot}
        {label}
        <ChevronDown className="h-4 w-4" />
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel
          className={`absolute top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-card border border-hairline bg-white p-2 shadow-[0_18px_40px_rgba(16,24,40,0.12)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {({ close }) => <>{children(() => close())}</>}
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}

export default CategoryNav
