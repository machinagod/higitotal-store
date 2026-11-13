"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Search } from "lucide-react"

/**
 * Mobile header behaviour (< 1024px). Only the logo row (logo, tap-to-call,
 * menu) is pinned; the search row below it is pinned too, but slides up
 * behind the logo row while the visitor scrolls down and comes back as soon
 * as they scroll up — or when they tap the search icon that appears in the
 * logo row while it is hidden. The rows are `position: sticky` and the search
 * row hides with a transform, so nothing below them shifts.
 */

type Ctx = {
  collapsed: boolean
  expand: (focus?: boolean) => void
  rowRef: React.MutableRefObject<HTMLDivElement | null>
}

const MobileHeaderContext = createContext<Ctx | null>(null)

/** Below this scroll offset the search row is always shown. */
const TOP_ZONE = 120
/** Ignore jitter smaller than this (px) when deciding the direction. */
const DELTA = 8

export function MobileHeaderProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const rowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)")
    let lastY = Math.max(window.scrollY, 0)
    let frame = 0

    const update = () => {
      frame = 0
      const y = Math.max(window.scrollY, 0)
      if (!mq.matches || y < TOP_ZONE) {
        setCollapsed(false)
        lastY = y
        return
      }
      const dy = y - lastY
      if (Math.abs(dy) < DELTA) return
      lastY = y
      // Never hide the search while the visitor is using it.
      const row = rowRef.current
      if (row && row.contains(document.activeElement)) return
      setCollapsed(dy > 0)
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    const onMq = () => update()

    window.addEventListener("scroll", onScroll, { passive: true })
    mq.addEventListener("change", onMq)
    return () => {
      window.removeEventListener("scroll", onScroll)
      mq.removeEventListener("change", onMq)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const expand = useCallback((focus = false) => {
    setCollapsed(false)
    if (!focus) return
    // Wait for `inert` to be lifted before moving focus into the row.
    window.requestAnimationFrame(() => {
      rowRef.current
        ?.querySelector<HTMLInputElement>("input[type='search']")
        ?.focus()
    })
  }, [])

  return (
    <MobileHeaderContext.Provider value={{ collapsed, expand, rowRef }}>
      {children}
    </MobileHeaderContext.Provider>
  )
}

function useMobileHeader(): Ctx {
  const ctx = useContext(MobileHeaderContext)
  if (!ctx) throw new Error("MobileHeader* must be inside MobileHeaderProvider")
  return ctx
}

/** The mobile search row — pinned under the logo row, hidden on scroll-down. */
export function MobileSearchRow({ children }: { children: ReactNode }) {
  const { collapsed, rowRef } = useMobileHeader()
  return (
    <div
      ref={rowRef}
      data-collapsed={collapsed || undefined}
      inert={collapsed || undefined}
      className={`glass sticky top-[60px] z-40 border-b border-hairline/80 transition-transform duration-200 ease-out motion-reduce:transition-none small:hidden ${
        collapsed ? "-translate-y-full" : "translate-y-0"
      }`}
      data-testid="mobile-search-row"
    >
      <div className="content-container flex items-center gap-x-2 py-2">
        {children}
      </div>
    </div>
  )
}

/** Search icon in the logo row; only visible while the search row is hidden. */
export function MobileSearchToggle() {
  const { collapsed, expand } = useMobileHeader()
  return (
    <button
      type="button"
      onClick={() => expand(true)}
      aria-label="Mostrar pesquisa"
      inert={!collapsed || undefined}
      className={`flex h-11 w-11 items-center justify-center rounded-pill text-brand-ink transition-[opacity,background-color] duration-200 hover:bg-brand-cyan-50 hover:text-brand-cyan-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/40 motion-reduce:transition-none ${
        collapsed ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      data-testid="nav-search-toggle"
    >
      <Search className="h-[21px] w-[21px]" />
    </button>
  )
}
