"use client"

import { useParams, useRouter } from "next/navigation"
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { Search, Loader2, FileText, Tag, CornerDownRight, Hash } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { search } from "@modules/search/actions"
import { SITE_PAGES, type SitePage } from "@lib/site-pages"
import {
  MIN_QUERY,
  matchByName,
  moveActive,
  toProductHit,
  type ProductHit,
  type SearchBrand,
  type SearchCategory,
} from "./suggestions"

export type { SearchBrand, SearchCategory } from "./suggestions"

/** One keyboard-reachable suggestion (rendered as a link, or the "all" button). */
type Option = {
  key: string
  group: "categorias" | "marcas" | "paginas" | "produtos" | "todos"
  href?: string
  render: (active: boolean) => ReactNode
}

const GROUP_LABEL: Record<Exclude<Option["group"], "todos">, string> = {
  categorias: "Categorias",
  marcas: "Marcas",
  paginas: "Páginas",
  produtos: "Produtos",
}

/**
 * Header search with a predictive dropdown, built as an ARIA 1.2 combobox:
 * the input owns a listbox of grouped options (categories/subcategories and
 * brands matched client-side, static site pages, and product hits from the
 * backend search). Focus stays in the input; ArrowUp/Down move the active
 * option (`aria-activedescendant`), Enter opens it (or runs the full search
 * when none is active), Escape closes the list. Products show their Moloni
 * reference ("Ref.ª"), the identifier customers search by.
 */
const SearchBox = ({
  categories = [],
  brands = [],
  pages = SITE_PAGES,
}: {
  categories?: SearchCategory[]
  brands?: SearchBrand[]
  pages?: SitePage[]
}) => {
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode?: string }
  const cc = countryCode || process.env.NEXT_PUBLIC_DEFAULT_REGION || "dk"

  const uid = useId()
  const listboxId = `${uid}-listbox`
  const statusId = `${uid}-status`
  const optionId = (i: number) => `${uid}-opt-${i}`

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [products, setProducts] = useState<ProductHit[]>([])
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const q = query.trim()

  const catMatches = useMemo(() => matchByName(categories, q, 5), [q, categories])
  const brandMatches = useMemo(() => matchByName(brands, q, 4), [q, brands])
  // Static site pages (Assistência Técnica, Contactos, …) matched by title or
  // keyword — accent-insensitive so "assistencia"/"reparacao" both hit.
  const pageMatches = useMemo(() => matchByName(pages, q, 4), [q, pages])

  // Debounced product search (backend /store/search via the server action).
  useEffect(() => {
    if (q.length < MIN_QUERY) {
      setProducts([])
      setLoading(false)
      return
    }
    setLoading(true)
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const hits = await search(q)
        if (!cancelled) setProducts((hits || []).slice(0, 6).map(toProductHit))
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [q])

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const goToResults = () => {
    if (!q) return
    setOpen(false)
    router.push(`/${cc}/results/${encodeURIComponent(q)}`)
  }

  const close = () => {
    setOpen(false)
    setActive(-1)
    setQuery("")
  }

  const hasResults =
    catMatches.length > 0 ||
    brandMatches.length > 0 ||
    pageMatches.length > 0 ||
    products.length > 0

  const iconBox =
    "flex h-9 w-9 flex-none items-center justify-center rounded-btn bg-brand-cyan-50 text-brand-cyan-ink"
  const titleCls = "block text-sm font-medium leading-snug text-brand-ink"
  const metaCls = "block text-xs text-grey-50"

  // Flat, ordered option list — the order the keyboard walks through.
  const options: Option[] = useMemo(() => {
    const out: Option[] = []
    for (const c of catMatches) {
      out.push({
        key: `cat-${c.type}-${c.handle}`,
        group: "categorias",
        href: `/categories/${c.handle}`,
        render: () => (
          <>
            <span className={iconBox} aria-hidden>
              {c.type === "subcategory" ? (
                <CornerDownRight className="h-4 w-4" />
              ) : (
                <Hash className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0">
              <span className={`${titleCls} truncate`}>{c.name}</span>
              <span className={metaCls}>
                {c.type === "subcategory"
                  ? `Subcategoria${c.parent ? ` · ${c.parent}` : ""}`
                  : "Categoria"}
              </span>
            </span>
          </>
        ),
      })
    }
    for (const b of brandMatches) {
      out.push({
        key: `brand-${b.href}`,
        group: "marcas",
        href: b.href,
        render: () => (
          <>
            <span className={iconBox} aria-hidden>
              <Tag className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className={`${titleCls} truncate`}>{b.name}</span>
              <span className={metaCls}>Marca · ver produtos</span>
            </span>
          </>
        ),
      })
    }
    for (const p of pageMatches) {
      out.push({
        key: `page-${p.href}`,
        group: "paginas",
        href: p.href,
        render: () => (
          <>
            <span className={iconBox} aria-hidden>
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className={`${titleCls} truncate`}>{p.name}</span>
              <span className={`${metaCls} truncate`}>{p.description}</span>
            </span>
          </>
        ),
      })
    }
    for (const p of products) {
      out.push({
        key: `prod-${p.id}`,
        group: "produtos",
        href: `/products/${p.handle}`,
        render: () => (
          <>
            {p.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.thumbnail}
                alt=""
                className="h-11 w-11 flex-none rounded-btn bg-[#f5f7f9] object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="h-11 w-11 flex-none rounded-btn bg-[#f5f7f9]"
              />
            )}
            <span className="min-w-0">
              {/* Two lines: variants of one range differ only at the end. */}
              <span className={`${titleCls} line-clamp-2`}>{p.title}</span>
              {(p.sku || p.category) && (
                <span className={`${metaCls} truncate`}>
                  {p.sku && (
                    <>
                      Ref.ª <span className="font-semibold text-grey-60">{p.sku}</span>
                    </>
                  )}
                  {p.sku && p.category && " · "}
                  {p.category}
                </span>
              )}
            </span>
          </>
        ),
      })
    }
    if (hasResults) {
      out.push({
        key: "all",
        group: "todos",
        render: () => <>Ver todos os resultados para “{q}”</>,
      })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catMatches, brandMatches, pageMatches, products, hasResults, q])

  const showDropdown = open && q.length >= MIN_QUERY
  const expanded = showDropdown && options.length > 0

  // A new result set invalidates the active option.
  useEffect(() => {
    setActive(-1)
  }, [options])

  // Keep the active option visible inside the scrollable panel.
  useEffect(() => {
    if (active < 0) return
    document
      .getElementById(optionId(active))
      ?.scrollIntoView({ block: "nearest" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault()
        if (!open) setOpen(true)
        setActive((i) =>
          moveActive(i, e.key === "ArrowDown" ? 1 : -1, options.length)
        )
        break
      }
      case "Enter": {
        if (expanded && active >= 0) {
          e.preventDefault()
          document.getElementById(optionId(active))?.click()
        }
        break
      }
      case "Escape": {
        if (expanded) {
          e.preventDefault()
          setOpen(false)
          setActive(-1)
        } else if (query) {
          e.preventDefault()
          setQuery("")
        }
        break
      }
      case "Tab": {
        setOpen(false)
        setActive(-1)
        break
      }
    }
  }

  const optionCls = (isActive: boolean) =>
    `flex w-full items-center gap-3 rounded-btn px-2 py-2 text-left transition-colors hover:bg-[#f1f4f7] ${
      isActive ? "bg-[#eef2f5] ring-2 ring-inset ring-brand-cyan/40" : ""
    }`
  const headingCls =
    "px-2 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7580]"

  // Render the options grouped, keeping their flat index for ids/keyboard.
  const groups: { group: Option["group"]; items: { opt: Option; i: number }[] }[] = []
  options.forEach((opt, i) => {
    const last = groups[groups.length - 1]
    if (last && last.group === opt.group) last.items.push({ opt, i })
    else groups.push({ group: opt.group, items: [{ opt, i }] })
  })

  const status = !showDropdown
    ? ""
    : loading && !hasResults
    ? "A pesquisar…"
    : hasResults
    ? `${options.length - 1} sugestões. Use as setas para navegar.`
    : `Sem resultados para “${q}”.`

  return (
    <div ref={boxRef} className="relative flex-1 min-w-0">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          goToResults()
        }}
        role="search"
        data-testid="nav-search-form"
        className="flex items-center gap-x-2.5 rounded-pill border-[1.5px] border-hairline bg-white pl-5 pr-1.5 py-1.5 transition-colors focus-within:border-brand-cyan focus-within:shadow-[0_0_0_4px_rgba(0,173,239,0.12)]"
      >
        <input
          type="search"
          role="combobox"
          aria-label="Pesquisar produtos, categorias ou marcas"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listboxId}
          aria-activedescendant={
            expanded && active >= 0 ? optionId(active) : undefined
          }
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Pesquisar produtos ou marcas…"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-brand-ink outline-none placeholder:text-[#7a838c] [&::-webkit-search-cancel-button]:appearance-none"
        />
        <button
          type="submit"
          aria-label="Pesquisar"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-pill bg-brand-cyan text-white transition-colors hover:bg-brand-cyan-ink"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
      </form>

      {/* Announces result counts / "no results" to screen readers. */}
      <span id={statusId} role="status" className="sr-only">
        {status}
      </span>

      {showDropdown && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-card border border-hairline bg-white shadow-[0_18px_40px_rgba(16,24,40,0.16)]">
          {options.length > 0 && (
            <div id={listboxId} role="listbox" aria-label="Sugestões de pesquisa">
              {groups.map(({ group, items }, gi) => {
                if (group === "todos") {
                  const { opt, i } = items[0]
                  return (
                    <div key={opt.key} role="group" aria-label="Todos os resultados">
                      <button
                        type="button"
                        id={optionId(i)}
                        role="option"
                        aria-selected={active === i}
                        tabIndex={-1}
                        onMouseEnter={() => setActive(i)}
                        onClick={goToResults}
                        className={`block w-full border-t border-hairline px-4 py-3 text-left text-sm font-bold text-brand-cyan-ink transition-colors hover:bg-[#f1f4f7] ${
                          active === i ? "bg-[#eef2f5]" : ""
                        }`}
                      >
                        {opt.render(active === i)}
                      </button>
                    </div>
                  )
                }
                const headingId = `${uid}-g-${group}`
                return (
                  <div
                    key={group}
                    role="group"
                    aria-labelledby={headingId}
                    className={`p-2 ${gi > 0 ? "border-t border-hairline" : ""}`}
                  >
                    <div id={headingId} role="presentation" className={headingCls}>
                      {GROUP_LABEL[group]}
                    </div>
                    {items.map(({ opt, i }) => (
                      <LocalizedClientLink
                        key={opt.key}
                        id={optionId(i)}
                        href={opt.href!}
                        role="option"
                        aria-selected={active === i}
                        tabIndex={-1}
                        onMouseEnter={() => setActive(i)}
                        onClick={close}
                        className={optionCls(active === i)}
                      >
                        {opt.render(active === i)}
                      </LocalizedClientLink>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {!hasResults &&
            (loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-grey-50">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> A
                pesquisar…
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-grey-50">
                Sem resultados para “{q}”.
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default SearchBox
