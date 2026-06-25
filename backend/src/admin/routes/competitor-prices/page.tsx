import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowPath, Check, CurrencyDollar, EllipsisHorizontal, Trash, XMark } from "@medusajs/icons"
import { Badge, Button, Container, DropdownMenu, Heading, IconButton, Input, Select, Text } from "@medusajs/ui"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

const PAGE = 50 // product groups per page

type Price = {
  price?: number | null
  unit_price?: number | null
  our_price?: number | null
  currency_code?: string
  status?: string
  scraped_at?: string
}
type Row = {
  id: string
  product_id?: string | null
  competitor?: { name?: string; price_tax_basis?: "incl" | "excl" | null } | null
  title?: string | null
  product_sku?: string | null
  competitor_url?: string | null
  match_status?: string
  match_score?: number | null
  pack_label?: string | null
  last_error?: string | null
  latest_price?: Price | null
}
type Product = {
  title: string
  sku: string | null
  pvp1: number | null
  pvp2: number | null
  cost: number | null
  vat: number | null
}
type Competitor = { id: string; handle: string; name?: string | null }

// Override actions (apply to ANY match — confirmed or proposal), threaded down.
type Actions = {
  confirm: (id: string) => void
  reject: (id: string) => void
  reassign: (id: string, productId: string) => void
  remove: (id: string) => void
  insert: (productId: string, competitorId: string, url: string) => void
  pending: boolean
}

const money = (minor?: number | null, cur = "EUR") =>
  minor == null ? "—" : `${(minor / 100).toFixed(2)} ${cur}`

// Compare competitors against PVP2, falling back to PVP1 when PVP2 is absent.
const deltaBasis = (p?: Product, fallback?: number | null): number | null =>
  p?.pvp2 ?? p?.pvp1 ?? fallback ?? null

const PriceTag = ({
  label,
  value,
  strong,
  muted,
}: {
  label: string
  value?: number | null
  strong?: boolean
  muted?: boolean
}) => (
  <div className="text-right">
    <Text size="xsmall" className="text-ui-fg-muted">
      {label}
    </Text>
    <Text size="small" weight={strong ? "plus" : "regular"} className={muted ? "text-ui-fg-subtle" : undefined}>
      {value == null ? "—" : `${(value / 100).toFixed(2)}`}
    </Text>
  </div>
)

type Group = { product_id: string; product?: Product; rows: Row[]; ourPrice: number | null }

const CompetitorPricesPage = () => {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("") // debounced, server-side
  const [offset, setOffset] = useState(0)
  const [reviewOnly, setReviewOnly] = useState(false) // focus on fuzzy proposals

  // Debounce the search box → server query; reset to the first page on change.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim())
      setOffset(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["competitor-products", q, offset, reviewOnly],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(offset) })
      if (q) params.set("q", q)
      if (reviewOnly) params.set("match_status", "fuzzy")
      return sdk.client.fetch<{ competitor_products: Row[]; products: Record<string, Product>; count: number }>(
        `/admin/competitor-products?${params.toString()}`,
        { method: "GET" }
      )
    },
    placeholderData: keepPreviousData,
  })

  const { data: hist } = useQuery({
    queryKey: ["competitor-price-history"],
    queryFn: () =>
      sdk.client.fetch<{ history: Record<string, { ours: [number, number][]; market: [number, number][] }> }>(
        "/admin/competitor-prices/price-history",
        { method: "GET" }
      ),
  })

  const { data: comps } = useQuery({
    queryKey: ["competitors-list"],
    queryFn: () => sdk.client.fetch<{ competitors: Competitor[] }>("/admin/competitors", { method: "GET" }),
  })
  const competitors = useMemo(
    () => [...(comps?.competitors ?? [])].sort((a, b) => (a.name ?? a.handle).localeCompare(b.name ?? b.handle)),
    [comps]
  )

  const invalidate = () => qc.invalidateQueries({ queryKey: ["competitor-products"] })
  const resolveM = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      sdk.client.fetch("/admin/competitor-prices/match/resolve", { method: "POST", body }),
    onSuccess: invalidate,
  })
  const removeM = useMutation({
    mutationFn: (id: string) => sdk.client.fetch(`/admin/competitor-products/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })
  const insertM = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      sdk.client.fetch("/admin/competitor-products", { method: "POST", body }),
    onSuccess: invalidate,
  })
  const actions: Actions = {
    confirm: (id) => resolveM.mutate({ mapping_id: id, action: "confirm", by: "human" }),
    reject: (id) => resolveM.mutate({ mapping_id: id, action: "reject", by: "human" }),
    reassign: (id, productId) => resolveM.mutate({ mapping_id: id, action: "reassign", product_id: productId, by: "human" }),
    remove: (id) => removeM.mutate(id),
    insert: (productId, competitorId, url) =>
      insertM.mutate({ product_id: productId, competitor_id: competitorId, competitor_url: url }),
    pending: resolveM.isPending || removeM.isPending || insertM.isPending,
  }

  const count = data?.count ?? 0
  const groups = useMemo<Group[]>(() => {
    const rows = data?.competitor_products ?? []
    const products = data?.products ?? {}
    const byProduct = new Map<string, Row[]>()
    for (const r of rows) {
      const key = r.product_id ?? "_unmatched"
      if (!byProduct.has(key)) byProduct.set(key, [])
      byProduct.get(key)!.push(r)
    }
    const gs: Group[] = [...byProduct.entries()].map(([product_id, rs]) => {
      const product = products[product_id]
      const fallback = rs.find((r) => r.latest_price?.our_price != null)?.latest_price?.our_price
      return { product_id, product, rows: rs, ourPrice: deltaBasis(product, fallback) }
    })
    return gs.sort((a, b) => (a.product?.title ?? "").localeCompare(b.product?.title ?? ""))
  }, [data])

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-y-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <Heading>Competitor Prices</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Listings grouped by our product. Confirmed prices are live; fuzzy proposals are reviewed inline.
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            size="small"
            variant={reviewOnly ? "primary" : "secondary"}
            onClick={() => {
              setReviewOnly((v) => !v)
              setOffset(0)
            }}
          >
            {reviewOnly ? "Reviewing proposals" : "Needs review"}
          </Button>
          <Input
            type="search"
            placeholder="Search product / SKU / competitor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
      </div>

      {/* Pagination bar: pages BY PRODUCT GROUP so a product's competitors never split. */}
      <div className="flex items-center justify-between px-4 py-2 md:px-6">
        <Text size="small" className="text-ui-fg-subtle">
          {count.toLocaleString()} {reviewOnly ? "product(s) to review" : "product(s)"}
          {isFetching ? " · updating…" : ""}
        </Text>
        <div className="flex items-center gap-x-2">
          <Text size="small" className="text-ui-fg-subtle">
            {count === 0 ? "0" : `${offset + 1}–${Math.min(offset + PAGE, count)}`}
          </Text>
          <Button size="small" variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
            Prev
          </Button>
          <Button size="small" variant="secondary" disabled={offset + PAGE >= count} onClick={() => setOffset(offset + PAGE)}>
            Next
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="px-4 py-6 md:px-6">
          <Text size="small">Loading…</Text>
        </div>
      )}
      {!isLoading && groups.length === 0 && (
        <div className="px-4 py-6 md:px-6">
          <Text size="small" className="text-ui-fg-subtle">
            {q ? "No products match your search." : reviewOnly ? "Nothing to review 🎉" : "No competitor prices yet."}
          </Text>
        </div>
      )}

      {groups.map((g) => (
        <ProductGroup
          key={g.product_id}
          group={g}
          series={hist?.history?.[g.product_id]}
          competitors={competitors}
          actions={actions}
        />
      ))}
    </Container>
  )
}

type Point = [number, number] // [timestamp ms, minor units]
type Series = { ours: Point[]; market: Point[] }

/** Tiny price-evolution sparkline: our price (ink) vs competitor per-unit (faint red). */
const Sparkline = ({ series, w = 132, h = 28 }: { series?: Series; w?: number; h?: number }) => {
  const ours = series?.ours ?? []
  const market = series?.market ?? []
  const all = [...ours, ...market]
  if (all.length === 0) return null
  const xs = all.map((p) => p[0])
  const ys = all.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const pad = 2
  const sx = (t: number) => (maxX === minX ? w / 2 : pad + ((t - minX) / (maxX - minX)) * (w - 2 * pad))
  const sy = (v: number) => (maxY === minY ? h / 2 : h - pad - ((v - minY) / (maxY - minY)) * (h - 2 * pad))
  const line = (pts: Point[]) => pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label="price history">
      {market.length > 1 ? <path d={line(market)} fill="none" stroke="#e11d48" strokeWidth={1} opacity={0.45} /> : null}
      {market.map((p, i) => (
        <circle key={`m${i}`} cx={sx(p[0])} cy={sy(p[1])} r={1} fill="#e11d48" opacity={0.5} />
      ))}
      {ours.length > 1 ? (
        <path d={line(ours)} fill="none" stroke="currentColor" strokeWidth={1.25} />
      ) : (
        ours.map((p, i) => <circle key={`o${i}`} cx={sx(p[0])} cy={sy(p[1])} r={1.6} fill="currentColor" />)
      )}
    </svg>
  )
}

const ProductGroup = ({
  group,
  series,
  competitors,
  actions,
}: {
  group: Group
  series?: Series
  competitors: Competitor[]
  actions: Actions
}) => {
  const { product, rows, ourPrice } = group
  const title = product?.title ?? rows[0]?.title ?? group.product_id
  const sku = product?.sku ?? rows[0]?.product_sku
  const reviewCount = rows.filter((r) => r.match_status === "fuzzy").length
  const [adding, setAdding] = useState(false)
  return (
    <div className="px-4 py-4 md:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Text weight="plus" className="truncate">
            {title}
          </Text>
          {sku ? <Badge size="2xsmall">{sku}</Badge> : null}
          {reviewCount > 0 ? (
            <Badge size="2xsmall" color="orange">
              {reviewCount} to review
            </Badge>
          ) : null}
        </div>
        <div className="flex items-baseline gap-x-3 whitespace-nowrap">
          <PriceTag label="PVP1" value={product?.pvp1} />
          <PriceTag label="PVP2" value={product?.pvp2} strong />
          <PriceTag label="Cost" value={product?.cost} muted />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Text size="xsmall" className="text-ui-fg-subtle">
          {rows.length} competitor{rows.length === 1 ? "" : "s"} · Δ vs {product?.pvp2 != null ? "PVP2" : "PVP1"}
        </Text>
        <Sparkline series={series} />
      </div>

      <div className="mt-2">
        {rows
          .slice()
          .sort((a, b) => deltaOf(a, ourPrice, product?.vat) - deltaOf(b, ourPrice, product?.vat))
          .map((r) => (
            <CompetitorRow
              key={r.id}
              row={r}
              pvp1={product?.pvp1 ?? null}
              pvp2={product?.pvp2 ?? null}
              vat={product?.vat ?? null}
              actions={actions}
            />
          ))}
      </div>

      {/* Override: manually attach a competitor listing to THIS product. */}
      {adding ? (
        <InsertListing
          competitors={competitors}
          disabled={actions.pending}
          onCancel={() => setAdding(false)}
          onAdd={(competitorId, url) => {
            actions.insert(group.product_id, competitorId, url)
            setAdding(false)
          }}
        />
      ) : (
        <button
          className="text-ui-fg-interactive mt-1 text-xs hover:underline"
          onClick={() => setAdding(true)}
          disabled={!product}
        >
          + add competitor listing
        </button>
      )}
    </div>
  )
}

const InsertListing = ({
  competitors,
  disabled,
  onAdd,
  onCancel,
}: {
  competitors: Competitor[]
  disabled: boolean
  onAdd: (competitorId: string, url: string) => void
  onCancel: () => void
}) => {
  const [competitorId, setCompetitorId] = useState("")
  const [url, setUrl] = useState("")
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-ui-border-base p-2 sm:flex-row sm:items-center">
      <Select value={competitorId} onValueChange={setCompetitorId}>
        <Select.Trigger className="w-full sm:w-48">
          <Select.Value placeholder="Competitor…" />
        </Select.Trigger>
        <Select.Content>
          {competitors.map((c) => (
            <Select.Item key={c.id} value={c.id}>
              {c.name ?? c.handle}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      <Input
        placeholder="https://competitor/product…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1"
      />
      <div className="flex gap-x-2">
        <Button size="small" disabled={disabled || !competitorId || !/^https?:\/\//.test(url)} onClick={() => onAdd(competitorId, url.trim())}>
          Add
        </Button>
        <Button size="small" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

const compOf = (r: Row): number | null => {
  const lp = r.latest_price
  return lp?.status === "ok" ? lp.unit_price ?? lp.price ?? null : null
}
// Our prices are net (ex-VAT). Convert an incl-VAT competitor down to net so the
// comparison is apples-to-apples (excl / unknown → as-is).
const toNet = (v: number | null, basis?: string | null, vat?: number | null): number | null =>
  v == null ? null : basis === "incl" && vat ? Math.round(v / (1 + vat)) : v
const compNetOf = (r: Row, vat?: number | null): number | null =>
  toNet(compOf(r), r.competitor?.price_tax_basis, vat)
const deltaOf = (r: Row, basis: number | null, vat?: number | null): number => {
  const comp = compNetOf(r, vat)
  if (comp == null || !basis) return Number.POSITIVE_INFINITY
  return ((comp - basis) / basis) * 100
}

const DeltaTag = ({ label, comp, base }: { label: string; comp: number | null; base: number | null }) => {
  if (comp == null || !base) return null
  const d = ((comp - base) / base) * 100
  return (
    <Text size="xsmall" weight="plus" className={d > 0 ? "text-ui-tag-green-text" : "text-ui-tag-red-text"}>
      {label} {d > 0 ? "+" : ""}
      {d.toFixed(0)}%
    </Text>
  )
}

const CompetitorRow = ({
  row,
  pvp1,
  pvp2,
  vat,
  actions,
}: {
  row: Row
  pvp1: number | null
  pvp2: number | null
  vat: number | null
  actions: Actions
}) => {
  const lp = row.latest_price
  const comp = compNetOf(row, vat) // net (ex-VAT) — comparable to our prices
  const basis = row.competitor?.price_tax_basis
  const isReview = row.match_status === "fuzzy"
  const [reassigning, setReassigning] = useState(false)
  return (
    <div className={`border-t border-ui-border-base py-2 first:border-t-0 ${isReview ? "bg-ui-bg-subtle -mx-2 rounded px-2" : ""}`}>
      <div className="flex items-center justify-between gap-x-3">
        {/* Left: competitor + listing */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-x-1.5">
            <Text size="small" weight="plus" className="truncate">
              {row.competitor?.name ?? "—"}
            </Text>
            <Badge size="2xsmall" color={isReview ? "orange" : "grey"} className="shrink-0">
              {isReview ? `review${row.match_score != null ? ` ${row.match_score}` : ""}` : "confirmed"}
            </Badge>
            {basis ? (
              <Badge size="2xsmall" color={basis === "incl" ? "orange" : "green"} className="shrink-0">
                {basis === "incl" ? "inc-VAT" : "ex-VAT"}
              </Badge>
            ) : null}
          </div>
          {row.competitor_url ? (
            <a href={row.competitor_url} target="_blank" rel="noreferrer" className="text-ui-fg-interactive line-clamp-1 text-xs">
              {row.title || row.competitor_url}
            </a>
          ) : (
            <Text size="xsmall" className="text-ui-fg-subtle line-clamp-1">
              {row.title || "—"}
            </Text>
          )}
          {row.last_error && comp == null ? (
            <Text size="xsmall" className="text-ui-fg-error line-clamp-1">
              {row.last_error}
            </Text>
          ) : null}
        </div>

        {/* Right: price + Δ (confirmed only) + per-row override menu (any match) */}
        <div className="flex shrink-0 items-center gap-x-2">
          {isReview ? (
            <Button size="small" disabled={actions.pending} onClick={() => actions.confirm(row.id)}>
              Confirm
            </Button>
          ) : (
            <div className="text-right">
              <Text size="small" weight="plus">
                {money(comp, lp?.currency_code)}
              </Text>
              {comp == null ? (
                <Text size="xsmall" className="text-ui-fg-muted">
                  {row.pack_label ?? "—"}
                </Text>
              ) : (
                <div className="flex items-baseline justify-end gap-x-2">
                  <DeltaTag label="P1" comp={comp} base={pvp1} />
                  <DeltaTag label="P2" comp={comp} base={pvp2} />
                </div>
              )}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <IconButton size="small" variant="transparent" disabled={actions.pending}>
                <EllipsisHorizontal />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              {isReview ? (
                <DropdownMenu.Item onClick={() => actions.confirm(row.id)}>
                  <Check className="text-ui-fg-subtle mr-2" />
                  Confirm match
                </DropdownMenu.Item>
              ) : null}
              <DropdownMenu.Item onClick={() => setReassigning((v) => !v)}>
                <ArrowPath className="text-ui-fg-subtle mr-2" />
                Reassign to another product…
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => actions.reject(row.id)}>
                <XMark className="text-ui-fg-subtle mr-2" />
                Reject (not our product)
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onClick={() => actions.remove(row.id)}>
                <Trash className="text-ui-fg-error mr-2" />
                Delete listing
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>

      {reassigning ? (
        <ReassignPicker
          disabled={actions.pending}
          onCancel={() => setReassigning(false)}
          onPick={(productId) => {
            actions.reassign(row.id, productId)
            setReassigning(false)
          }}
        />
      ) : null}
    </div>
  )
}

const ReassignPicker = ({
  disabled,
  onPick,
  onCancel,
}: {
  disabled: boolean
  onPick: (productId: string) => void
  onCancel: () => void
}) => {
  const [term, setTerm] = useState("")
  const [debounced, setDebounced] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 300)
    return () => clearTimeout(t)
  }, [term])
  const { data } = useQuery({
    queryKey: ["product-search", debounced],
    enabled: debounced.length >= 2,
    queryFn: () =>
      sdk.client.fetch<{ products: { id: string; title: string }[] }>(
        `/admin/products?limit=8&fields=id,title&q=${encodeURIComponent(debounced)}`,
        { method: "GET" }
      ),
  })
  const results = data?.products ?? []
  return (
    <div className="mt-2 rounded-md border border-ui-border-base p-2">
      <div className="flex items-center gap-x-2">
        <Input autoFocus placeholder="Search our products to reassign…" value={term} onChange={(e) => setTerm(e.target.value)} className="flex-1" />
        <Button size="small" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      {results.length > 0 ? (
        <div className="mt-1 max-h-40 overflow-auto">
          {results.map((p) => (
            <button
              key={p.id}
              disabled={disabled}
              onClick={() => onPick(p.id)}
              className="hover:bg-ui-bg-base-hover block w-full truncate rounded px-2 py-1 text-left text-xs"
            >
              {p.title}
            </button>
          ))}
        </div>
      ) : debounced.length >= 2 ? (
        <Text size="xsmall" className="text-ui-fg-subtle mt-1 px-2">
          No products found.
        </Text>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Competitor Prices",
  icon: CurrencyDollar,
})

export default CompetitorPricesPage
