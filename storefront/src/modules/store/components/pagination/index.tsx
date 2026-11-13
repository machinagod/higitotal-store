"use client"

import { clx } from "@medusajs/ui"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { pageWindow } from "@lib/util/pagination"

const itemCls =
  "flex h-11 min-w-[44px] items-center justify-center rounded-pill px-3 text-sm font-semibold transition-colors"

/**
 * Listing pagination: previous / next plus a compact window of page numbers.
 * Real links (crawlable, open-in-new-tab), 44px tap targets, and the current
 * page marked both visually and with aria-current.
 */
export function Pagination({
  page,
  totalPages,
  "data-testid": dataTestid,
}: {
  page: number
  totalPages: number
  "data-testid"?: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams)
    if (p <= 1) params.delete("page")
    else params.set("page", String(p))
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const current = Math.min(Math.max(page, 1), totalPages)
  const items = pageWindow(current, totalPages)

  const PrevNext = ({ dir }: { dir: "prev" | "next" }) => {
    const target = dir === "prev" ? current - 1 : current + 1
    const disabled = target < 1 || target > totalPages
    const label = dir === "prev" ? "Anterior" : "Seguinte"
    const content = (
      <>
        {dir === "prev" && <ChevronLeft className="h-4 w-4" aria-hidden />}
        <span className="hidden xsmall:inline">{label}</span>
        {dir === "next" && <ChevronRight className="h-4 w-4" aria-hidden />}
      </>
    )
    const cls = clx(
      itemCls,
      "gap-1 border border-hairline bg-white",
      disabled
        ? "cursor-not-allowed text-grey-30"
        : "text-brand-ink hover:border-brand-cyan hover:text-brand-cyan"
    )
    return disabled ? (
      <span className={cls} aria-disabled="true">
        {content}
      </span>
    ) : (
      <Link
        href={hrefFor(target)}
        className={cls}
        aria-label={dir === "prev" ? "Página anterior" : "Página seguinte"}
        rel={dir}
      >
        {content}
      </Link>
    )
  }

  return (
    <nav
      aria-label="Paginação"
      className="mt-12 flex w-full justify-center"
      data-testid={dataTestid}
    >
      <ul className="flex items-center justify-center gap-1.5">
        <li>
          <PrevNext dir="prev" />
        </li>
        {/* Phones: "Página 2 de 8" instead of a row of numbers that would wrap. */}
        <li
          className="flex h-11 items-center whitespace-nowrap px-3 text-sm font-semibold text-brand-ink xsmall:hidden"
          aria-current="page"
        >
          Página {current} de {totalPages}
        </li>
        {items.map((item, i) =>
          item === "gap" ? (
            <li
              key={`gap-${i}`}
              aria-hidden
              className="hidden h-11 w-6 items-center justify-center text-sm text-grey-60 xsmall:flex"
            >
              …
            </li>
          ) : (
            <li key={item} className="hidden xsmall:block">
              {item === current ? (
                <span
                  aria-current="page"
                  aria-label={`Página ${item}, atual`}
                  className={clx(itemCls, "bg-brand-ink text-white")}
                >
                  {item}
                </span>
              ) : (
                <Link
                  href={hrefFor(item)}
                  aria-label={`Página ${item}`}
                  className={clx(
                    itemCls,
                    "text-brand-ink hover:bg-grey-10 hover:text-brand-cyan"
                  )}
                >
                  {item}
                </Link>
              )}
            </li>
          )
        )}
        <li>
          <PrevNext dir="next" />
        </li>
      </ul>
    </nav>
  )
}
