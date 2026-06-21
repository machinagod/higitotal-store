"use client"

import { Fragment } from "react"
import { usePathname } from "next/navigation"
import { Popover, Transition } from "@headlessui/react"
import { ChevronDown } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type NavCategory = { label: string; href: string; icon?: string }

// How many categories show inline before the rest collapse into "Mais".
const TOP_N = 3

/**
 * Top-level category strip (matches the design mock): the first few categories
 * inline, the remainder under a "Mais" dropdown, and a right-pinned "Pedir
 * assistência" service pill. The active category gets a cyan dot. Needs the
 * current path, so this is a client component (the surrounding nav is server-
 * rendered).
 */
const CategoryNav = ({ categories }: { categories: NavCategory[] }) => {
  const pathname = usePathname() || ""

  const isActive = (href: string) => {
    // href is "/categories/<handle>"; pathname is "/<cc>/categories/<handle>".
    const handle = href.split("/").filter(Boolean).pop()
    return !!handle && pathname.includes(`/categories/${handle}`)
  }

  const top = categories.slice(0, TOP_N)
  const rest = categories.slice(TOP_N)
  const restActive = rest.some((c) => isActive(c.href))

  const dot = (
    <span className="h-[7px] w-[7px] flex-none rounded-full bg-brand-cyan shadow-[0_0_0_3px_rgba(0,173,239,0.18)]" />
  )

  return (
    <nav className="bg-white border-b border-hairline">
      <div className="content-container flex items-center gap-x-2 small:gap-x-3 h-[54px]">
        {/* Inline categories — scroll within the available width if needed */}
        <div className="flex items-center gap-x-1 flex-1 min-w-0 overflow-x-auto no-scrollbar">
          {top.map((cat, idx) => {
            const active = isActive(cat.href)
            return (
              <LocalizedClientLink
                key={`${cat.label}-${idx}`}
                href={cat.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap flex-none inline-flex items-center gap-x-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors ${
                  active
                    ? "text-brand-cyan"
                    : "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"
                }`}
              >
                {active && dot}
                {cat.label}
              </LocalizedClientLink>
            )
          })}
        </div>

        {/* "Mais" dropdown — kept outside the scroll container so the panel
            isn't clipped by overflow-x. */}
        {rest.length > 0 && (
          <Popover className="relative flex-none">
            <Popover.Button
              className={`inline-flex items-center gap-x-1.5 whitespace-nowrap px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors focus:outline-none ${
                restActive
                  ? "text-brand-cyan"
                  : "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"
              }`}
            >
              {restActive && dot}
              Mais
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
              <Popover.Panel className="absolute right-0 top-full z-50 mt-1 min-w-[230px] max-h-[70vh] overflow-y-auto rounded-card border border-hairline bg-white p-2 shadow-[0_18px_40px_rgba(16,24,40,0.12)]">
                {({ close }) => (
                  <div className="flex flex-col">
                    {rest.map((cat, idx) => {
                      const active = isActive(cat.href)
                      return (
                        <LocalizedClientLink
                          key={`${cat.label}-${idx}`}
                          href={cat.href}
                          onClick={() => close()}
                          aria-current={active ? "page" : undefined}
                          className={`inline-flex items-center gap-x-2 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors ${
                            active
                              ? "text-brand-cyan bg-[#f1f4f7]"
                              : "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"
                          }`}
                        >
                          {active && dot}
                          {cat.label}
                        </LocalizedClientLink>
                      )
                    })}
                  </div>
                )}
              </Popover.Panel>
            </Transition>
          </Popover>
        )}

        {/* Service pill — pinned right, always visible */}
        <LocalizedClientLink
          href="/assistencia-tecnica"
          data-testid="nav-assistencia-link"
          className="flex-none inline-flex items-center gap-x-2 whitespace-nowrap bg-svc-signal text-white px-3 small:px-[18px] py-2.5 rounded-pill text-xs font-bold uppercase tracking-[0.04em] hover:bg-svc-signal-ink transition-colors"
        >
          <span className="h-2 w-2 flex-none rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.35)]" />
          <span className="hidden xsmall:inline">Pedir assistência</span>
          <span className="xsmall:hidden">Assistência</span>
        </LocalizedClientLink>
      </div>
    </nav>
  )
}

export default CategoryNav
