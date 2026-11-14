"use client"

import dynamic from "next/dynamic"
import { useEffect, useId, useState, type ReactNode } from "react"

import { HttpTypes } from "@medusajs/types"

type NavLink = { label: string; href: string; icon?: string }

const loadPanel = () => import("./panel")
let panelRequested = false
/** Fetch (once) the dialog's chunk ahead of the first tap. */
function preloadPanel() {
  if (panelRequested) return
  panelRequested = true
  loadPanel().catch(() => {
    panelRequested = false
  })
}

// The dialog (Headless UI Dialog + Transition, every menu row, the country
// selector) is only needed once the menu opens, so it is not part of the
// layout bundle every page loads and hydrates.
const SideMenuPanel = dynamic(loadPanel, { ssr: false })

/**
 * Mobile menu trigger (the hamburger). The menu itself — a modal dialog — is
 * ./panel, loaded on first use: preloaded when the browser is idle after the
 * page load, or as soon as the pointer / focus reaches the button.
 */
const SideMenu = ({
  regions,
  categories = [],
  categoryIcons = {},
  brands = [],
  catalogMode = false,
}: {
  regions: HttpTypes.StoreRegion[] | null
  categories?: NavLink[]
  /** Each category's icon, rendered on the server (keyed by href). */
  categoryIcons?: Record<string, ReactNode>
  brands?: NavLink[]
  /** Catalog mode has no prices/cart → no account, cart or country selector. */
  catalogMode?: boolean
}) => {
  const [open, setOpen] = useState(false)
  // Mounted from the first open on, so the close transition can run.
  const [mounted, setMounted] = useState(false)
  const uid = useId()
  const panelId = `${uid}-menu`

  useEffect(() => {
    const idle = () => {
      // The hamburger only shows below `small`; desktop loads it on demand.
      if (!window.matchMedia("(max-width: 1023.98px)").matches) return
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(preloadPanel, { timeout: 4000 })
      } else {
        setTimeout(preloadPanel, 2000)
      }
    }
    if (document.readyState === "complete") idle()
    else window.addEventListener("load", idle, { once: true })
    return () => window.removeEventListener("load", idle)
  }, [])

  return (
    <>
      <button
        type="button"
        data-testid="nav-menu-button"
        aria-label="Abrir menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          setMounted(true)
          setOpen(true)
        }}
        // Warm the panel chunk as soon as the visitor heads for the button.
        onPointerEnter={preloadPanel}
        onTouchStart={preloadPanel}
        onFocus={preloadPanel}
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

      {mounted && (
        <SideMenuPanel
          open={open}
          onClose={() => setOpen(false)}
          panelId={panelId}
          uid={uid}
          regions={regions}
          categories={categories}
          categoryIcons={categoryIcons}
          brands={brands}
          catalogMode={catalogMode}
        />
      )}
    </>
  )
}

export default SideMenu
