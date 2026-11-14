"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/**
 * Thin top progress bar for page navigations. Server-rendered pages take a
 * moment to arrive and most routes have no loading state, so without this a
 * click (e.g. on the logo) looks ignored until the new page swaps in.
 *
 * Starts on a plain left-click of a same-origin link to a different URL;
 * finishes when the pathname/search changes. Ignores new-tab/modified clicks,
 * downloads, hash-only links and `target` links. Self-cancels after 10s.
 */
export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")
  const timers = useRef<number[]>([])

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  // Route changed → finish and fade out.
  useEffect(() => {
    setState((s) => {
      if (s !== "loading") return s
      clear()
      timers.current.push(window.setTimeout(() => setState("idle"), 350))
      return "done"
    })
  }, [pathname, searchParams])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a")
      if (!a || !a.href || a.target || a.hasAttribute("download")) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin) return
      const here = window.location
      if (url.pathname === here.pathname && url.search === here.search) return
      clear()
      setState("loading")
      timers.current.push(window.setTimeout(() => setState("idle"), 10000))
    }
    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      clear()
    }
  }, [])

  return (
    <div
      aria-hidden={state === "idle"}
      role="progressbar"
      aria-label="A carregar a página"
      aria-busy={state === "loading"}
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]"
      style={{ top: "env(safe-area-inset-top, 0px)" }}
    >
      <div
        className={`h-full bg-brand-cyan shadow-[0_0_8px_rgba(0,116,179,0.6)] ${
          state === "idle"
            ? "w-0 opacity-0 transition-none"
            : state === "loading"
            ? "w-[85%] opacity-100 transition-[width] duration-[2500ms] ease-out motion-reduce:transition-none"
            : "w-full opacity-0 transition-[width,opacity] duration-300 ease-out"
        }`}
      />
    </div>
  )
}
