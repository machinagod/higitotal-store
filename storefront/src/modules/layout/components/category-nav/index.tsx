"use client"

import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { Popover, Transition } from "@headlessui/react"
import { ArrowRight, ChevronDown } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryIcon from "@modules/common/icons/category-icon"
import type { NavLink } from "@lib/brands"
import { fallbackInlineClass, fallbackMoreClass, fitCount } from "./fit"

// Gap between inline items (Tailwind gap-x-1) — keep in sync with the markup.
const GAP = 4
// Room the active-page dot adds to an item (7px dot + 8px gap).
const DOT_W = 15

// useLayoutEffect warns on the server; this strip only measures in the browser.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect

const itemBase =
  "items-center gap-x-2 whitespace-nowrap rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40"
const itemIdle = "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"

/**
 * Desktop category strip: as many real product categories inline as the bar
 * has room for (measured, so it adapts to the labels and the viewport), the
 * rest under "Mais", and the supplier brands under a separate right-aligned
 * "Marcas" menu (brands are never presented as categories). The active entry
 * gets a cyan dot. Client component for the current path and measuring; the
 * surrounding nav is server-rendered (with a breakpoint-based first guess).
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

  // null until measured → breakpoint fallback classes.
  const [visible, setVisible] = useState<number | null>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const brandsRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  const activeIndex = categories.findIndex((c) => isActive(c.href))

  const measure = useCallback(() => {
    const row = rowRef.current
    const probe = measureRef.current
    if (!row || !probe) return
    const style = getComputedStyle(row)
    const inner =
      row.clientWidth -
      parseFloat(style.paddingLeft || "0") -
      parseFloat(style.paddingRight || "0")
    const brandsW = brandsRef.current
      ? brandsRef.current.getBoundingClientRect().width + 16
      : 0
    const nodes = Array.from(probe.children) as HTMLElement[]
    const more = nodes.pop()
    const widths = nodes.map(
      (n, i) => n.getBoundingClientRect().width + (i === activeIndex ? DOT_W : 0)
    )
    const moreW = (more?.getBoundingClientRect().width ?? 80) + GAP
    setVisible(fitCount(widths, inner - brandsW, moreW, GAP))
  }, [activeIndex])

  useIsoLayoutEffect(() => {
    measure()
    const row = rowRef.current
    if (!row || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measure())
    ro.observe(row)
    // Web font swap changes label widths.
    document.fonts?.ready.then(() => measure()).catch(() => {})
    return () => ro.disconnect()
  }, [measure])

  const n = categories.length
  const restIdx = categories
    .map((_, i) => i)
    .filter((i) => (visible === null ? i >= 4 : i >= visible))
  const restActive = restIdx.some((i) => isActive(categories[i].href))
  const brandActive = brands.some((b) => isActive(b.href))

  // "Mais" trigger: measured → shown when something overflows; fallback →
  // per breakpoint, matching fallbackInlineClass.
  const moreClass =
    visible !== null
      ? visible < n
        ? "block"
        : "hidden"
      : n > 7
      ? "block"
      : n > 5
      ? "block large:hidden"
      : n > 4
      ? "block medium:hidden"
      : "hidden"

  const dot = (
    <span className="h-[7px] w-[7px] flex-none rounded-full bg-brand-cyan shadow-[0_0_0_3px_rgba(0,173,239,0.18)]" />
  )

  return (
    // Hidden on mobile — the hamburger side-menu lists categories and brands.
    <nav
      aria-label="Categorias"
      className="hidden small:block bg-white border-b border-hairline"
    >
      <div
        ref={rowRef}
        className="content-container relative flex items-center gap-x-1 h-[54px]"
      >
        {/* Off-screen probe with every label at its natural width (+ "Mais"). */}
        {/* Zero-size clipping wrapper so the probe never widens the page. */}
        <div
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden"
        >
          <div ref={measureRef} className="flex w-max">
            {categories.map((cat) => (
              <span key={cat.href} className={`${itemBase} inline-flex flex-none`}>
                {cat.label}
              </span>
            ))}
            <span className={`${itemBase} inline-flex flex-none gap-x-1.5`}>
              Mais
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
        </div>

        <ul className="flex min-w-0 items-center gap-x-1 overflow-hidden">
          {categories.map((cat, i) => {
            const active = isActive(cat.href)
            const shown =
              visible === null
                ? fallbackInlineClass(i)
                : i < visible
                ? "flex"
                : "hidden"
            return (
              <li key={cat.href} className={shown}>
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
        <div className={`flex-none ${moreClass}`}>
          <Dropdown
            label="Mais"
            ariaLabel="Mais categorias"
            active={restActive}
            dot={dot}
            align="left"
            testId="nav-more-button"
          >
            {(close) => (
              <div className="flex min-w-[260px] flex-col">
                {categories.map((cat, i) => {
                  const shown =
                    visible === null
                      ? fallbackMoreClass(i)
                      : i >= visible
                      ? "flex"
                      : "hidden"
                  const active = isActive(cat.href)
                  return (
                    <LocalizedClientLink
                      key={cat.href}
                      href={cat.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={`${shown} items-center gap-x-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40 ${
                        active
                          ? "bg-brand-cyan-50 text-brand-cyan-ink"
                          : "text-[#4a5560] hover:bg-[#f1f4f7] hover:text-brand-ink"
                      }`}
                    >
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-brand-cyan-50 text-brand-cyan-ink">
                        <CategoryIcon name={cat.icon} className="h-4 w-4" />
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
          <div ref={brandsRef} className="ml-auto flex-none">
            <Dropdown
              label="Marcas"
              active={brandActive}
              dot={dot}
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
    const scale = Math.min(56 / brand.logo.width, 20 / brand.logo.height)
    const w = Math.round(brand.logo.width * scale)
    const h = Math.round(brand.logo.height * scale)
    return (
      <span className={box} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logo.src}
          alt=""
          width={w}
          height={h}
          loading="lazy"
          className="block opacity-70 [filter:grayscale(1)_brightness(0.35)] transition-[filter,opacity] group-hover:opacity-100 group-hover:[filter:none]"
          style={{ width: w, height: h }}
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
        {active && dot}
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
