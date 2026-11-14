"use client"

import { Fragment, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Popover, Transition } from "@headlessui/react"
import { ArrowRight, ChevronDown } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  BRANDS_PATH,
  logoOpticalStyle,
  logoRestStyle,
  type NavLink,
} from "@lib/brands"
import { NAV_SCOPE, navBreakpoints, navCss } from "./fit"

const itemBase =
  "items-center gap-x-2 whitespace-nowrap rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
const itemIdle = "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"

/**
 * Desktop category strip: as many real product categories inline as the bar
 * has room for, the rest under "Mais", and the supplier brands under a
 * separate right-aligned "Marcas" menu (brands are never presented as
 * categories). The active entry gets a cyan dot.
 *
 * What fits is decided in CSS, not by measuring: label widths come from the
 * font's advance widths and each item's "fits" width is a container query on
 * the row (see ./fit). The server HTML is final — no layout reads at hydration
 * (forced reflow) and no "Mais" jump (layout shift). Client component only for
 * the current path. `icons` are the categories' icons for the "Mais" panel,
 * rendered on the server (keyed by href) so no icon code ships here.
 */
const CategoryNav = ({
  categories,
  brands = [],
  icons = {},
}: {
  categories: NavLink[]
  brands?: NavLink[]
  icons?: Record<string, ReactNode>
}) => {
  const pathname = usePathname() || ""

  // href is "/categories/<handle>" or "/collections/<handle>"; pathname is
  // "/<cc>/categories/<handle>".
  const isActive = (href: string) => {
    const parts = href.split("/").filter(Boolean)
    if (parts.length < 2 || parts[0] === "results") return false
    return pathname.includes(`/${parts[0]}/${parts[1]}`)
  }

  const activeIndex = categories.findIndex((c) => isActive(c.href))
  // Any brand page or the /marcas index lights up the "Marcas" menu.
  const brandActive =
    pathname.split("/").includes(BRANDS_PATH.slice(1)) ||
    brands.some((b) => isActive(b.href))

  // Which items show inline / under "Mais" at which row width.
  const css = navCss(
    navBreakpoints({
      labels: categories.map((c) => c.label),
      activeIndex,
      brands: brands.length ? { label: "Marcas", active: brandActive } : null,
    }),
    activeIndex
  )

  const dot = (
    <span className="h-[7px] w-[7px] flex-none rounded-full bg-brand-cyan shadow-[0_0_0_3px_rgba(0,173,239,0.18)]" />
  )

  return (
    // Hidden on mobile — the hamburger side-menu lists categories and brands.
    <nav
      aria-label="Categorias"
      className="glass hidden small:block border-b border-hairline/80"
      {...{ [NAV_SCOPE]: "" }}
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* The row is the `catnav` size container the rules above query. */}
      <div className="content-container relative flex items-center gap-x-1 h-[54px] [container:catnav/inline-size]">
        <ul className="flex min-w-0 items-center gap-x-1 overflow-hidden">
          {categories.map((cat, i) => {
            const active = i === activeIndex
            return (
              <li key={cat.href} data-cn-i={i}>
                <LocalizedClientLink
                  href={cat.href}
                  aria-current={active ? "page" : undefined}
                  className={`${itemBase} flex flex-none ${
                    active ? "text-brand-cyan-ink" : itemIdle
                  }`}
                >
                  {active && dot}
                  {cat.label}
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>

        {/* Dropdowns live outside the clipped list so their panels aren't cut. */}
        <div className="flex-none" data-cn-more="">
          <Dropdown
            label="Mais"
            ariaLabel="Mais categorias"
            // Idle styling; while the active category is in the overflow the
            // generated CSS adds the dot (`data-cn-mdot`) and the active colour.
            active={false}
            dot={activeIndex >= 0 ? <span data-cn-mdot="">{dot}</span> : null}
            align="left"
            testId="nav-more-button"
          >
            {(close) => (
              <div className="flex min-w-[260px] flex-col">
                {categories.map((cat, i) => {
                  const active = i === activeIndex
                  return (
                    <LocalizedClientLink
                      key={cat.href}
                      href={cat.href}
                      onClick={close}
                      data-cn-m={i}
                      aria-current={active ? "page" : undefined}
                      className={`items-center gap-x-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40 ${
                        active
                          ? "bg-brand-cyan-50 text-brand-cyan-ink"
                          : "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"
                      }`}
                    >
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-brand-cyan-50 text-brand-cyan-ink">
                        {icons[cat.href]}
                      </span>
                      {cat.label}
                    </LocalizedClientLink>
                  )
                })}
                <LocalizedClientLink
                  href="/store"
                  onClick={close}
                  className="mt-1 flex items-center justify-between gap-x-2 rounded-[10px] border-t border-hairline px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-[0.04em] text-brand-cyan-ink hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
                >
                  Ver catálogo completo
                  <ArrowRight className="h-4 w-4" />
                </LocalizedClientLink>
              </div>
            )}
          </Dropdown>
        </div>

        {brands.length > 0 && (
          <div className="ml-auto flex-none">
            <Dropdown
              label="Marcas"
              active={brandActive}
              dot={brandActive ? dot : null}
              align="right"
              testId="nav-brands-button"
            >
              {(close) => (
                <ul className="grid w-[392px] grid-cols-2 gap-1">
                  {brands.map((b) => {
                    const active = isActive(b.href)
                    return (
                      <li key={b.href}>
                        <LocalizedClientLink
                          href={b.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          className={`group flex h-12 items-center gap-x-3 rounded-[10px] px-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40 ${
                            active ? "bg-brand-cyan-50" : "hover:bg-[#f1f4f7]"
                          }`}
                        >
                          <BrandMark brand={b} />
                          <span
                            className={`text-[13px] font-semibold ${
                              active ? "text-brand-cyan-ink" : "text-[#4a5560] group-hover:text-brand-ink"
                            }`}
                          >
                            {b.label}
                          </span>
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                  <li className="col-span-2">
                    <LocalizedClientLink
                      href={BRANDS_PATH}
                      onClick={close}
                      className="mt-1 flex items-center justify-between gap-x-2 rounded-[10px] border-t border-hairline px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-[0.04em] text-brand-cyan-ink hover:text-brand-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
                      data-testid="nav-brands-all"
                    >
                      Ver todas as marcas
                      <ArrowRight className="h-4 w-4" />
                    </LocalizedClientLink>
                  </li>
                </ul>
              )}
            </Dropdown>
          </div>
        )}
      </div>
    </nav>
  )
}

/**
 * Fixed 56×24 mark box per brand: the logo when there is one (muted, colour on
 * hover), else a monogram tile — so every row lines up.
 */
function BrandMark({ brand }: { brand: NavLink }) {
  const box = "flex h-6 w-14 flex-none items-center justify-center"
  if (brand.logo) {
    // Height cap 20px, lifted by `logo.scale` for compact marks (round /
    // square / stacked); the 48px row leaves room for up to 30px.
    const maxH = Math.min(30, 20 * (brand.logo.scale ?? 1))
    const scale = Math.min(56 / brand.logo.width, maxH / brand.logo.height)
    const w = Math.round(brand.logo.width * scale)
    const h = Math.round(brand.logo.height * scale)
    return (
      <span className={box} style={{ height: Math.max(24, h) }} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logo.src}
          alt=""
          width={w}
          height={h}
          loading="lazy"
          className="block object-contain opacity-70 [filter:var(--logo-rest,grayscale(1)_brightness(0.35))] transition-[filter,opacity] group-hover:opacity-100 group-hover:[filter:none]"
          style={{
            width: w,
            height: h,
            ...logoRestStyle(brand.logo),
            ...logoOpticalStyle(brand.logo, h),
          }}
        />
      </span>
    )
  }
  const initials = (brand.wordmark ?? brand.label)
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÀ-ÿ]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
  return (
    <span className={box} aria-hidden>
      <span className="flex h-6 min-w-[32px] items-center justify-center rounded-[6px] border border-hairline bg-[#f5f7f9] px-1.5 text-[11px] font-extrabold tracking-[0.02em] text-[#5d666f]">
        {initials}
      </span>
    </span>
  )
}

function Dropdown({
  label,
  ariaLabel,
  active,
  dot,
  align,
  testId,
  children,
}: {
  label: string
  ariaLabel?: string
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
        aria-label={ariaLabel}
        className={`${itemBase} flex gap-x-1.5 ${
          active ? "text-brand-cyan-ink" : itemIdle
        }`}
      >
        {dot}
        {label}
        <ChevronDown className="h-4 w-4" aria-hidden />
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
        {/* `focus`: focus moves into the panel on open, and the panel closes
            when focus leaves it (Tab past the last link, Shift+Tab out). */}
        <Popover.Panel
          focus
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
