"use client"

import { useEffect, useRef } from "react"

/**
 * The chip list: one scrollable row on phones, wrapping on desktop. On mount,
 * scrolls the active chip (aria-current) into view horizontally — without
 * moving the page — so a leaf's own chip isn't hidden off-screen.
 */
export default function ChipScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = ref.current
    const active = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !active || list.scrollWidth <= list.clientWidth) return
    const li = active.parentElement ?? active
    const target = li.offsetLeft - (list.clientWidth - li.offsetWidth) / 2
    list.scrollLeft = Math.max(0, target)
  }, [])

  return (
    <ul
      ref={ref}
      // Bleeds into the content-container gutter (px-6) so chips scroll edge to edge.
      className="no-scrollbar relative -mx-6 flex snap-x snap-proximity scroll-px-6 gap-2 overflow-x-auto px-6 small:mx-0 small:snap-none small:flex-wrap small:overflow-visible small:px-0"
    >
      {children}
    </ul>
  )
}
