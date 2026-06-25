import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Buildings } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Select, Text } from "@medusajs/ui"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

const PAGE = 50

type Item = {
  id: string
  competitor_handle: string | null
  competitor_name: string | null
  country: string | null
  url: string | null
  title: string | null
  brand: string | null
  sku: string | null
  discovered_at: string | null
}
type Resp = { count: number; limit: number; offset: number; items: Item[] }
type Competitor = { id: string; handle: string; name?: string | null }

/**
 * Competitor Catalog — the "assortment gap": products competitors sell that we
 * don't carry (`catalog_only`), discovered by the catalog crawl but not matched
 * to our assortment. Read-only, paginated, filterable by competitor.
 */
const CompetitorCatalogPage = () => {
  const [offset, setOffset] = useState(0)
  const [competitorId, setCompetitorId] = useState("")

  const { data: comps } = useQuery({
    queryKey: ["competitors-list"],
    queryFn: () => sdk.client.fetch<{ competitors: Competitor[] }>("/admin/competitors", { method: "GET" }),
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["catalog-items", offset, competitorId],
    queryFn: () => {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(offset) })
      if (competitorId) params.set("competitor_id", competitorId)
      return sdk.client.fetch<Resp>(`/admin/competitor-prices/catalog-items?${params.toString()}`, {
        method: "GET",
      })
    },
    placeholderData: keepPreviousData,
  })

  const items = data?.items ?? []
  const count = data?.count ?? 0
  const competitors = [...(comps?.competitors ?? [])].sort((a, b) =>
    (a.name ?? a.handle).localeCompare(b.name ?? b.handle)
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-y-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <Heading>Competitor Catalog</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Products competitors sell that we don’t carry — discovered by the catalog crawl, not matched to our
            assortment.
          </Text>
        </div>
        <Select
          value={competitorId || "all"}
          onValueChange={(v) => {
            setCompetitorId(v === "all" ? "" : v)
            setOffset(0)
          }}
        >
          <Select.Trigger className="w-full md:w-64">
            <Select.Value placeholder="All competitors" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All competitors</Select.Item>
            {competitors.map((c) => (
              <Select.Item key={c.id} value={c.id}>
                {c.name ?? c.handle}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <div className="flex items-center justify-between px-4 py-2 md:px-6">
        <Text size="small" className="text-ui-fg-subtle">
          {count.toLocaleString()} catalog-only listing{count === 1 ? "" : "s"}
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
      {!isLoading && items.length === 0 && (
        <div className="px-4 py-6 md:px-6">
          <Text size="small" className="text-ui-fg-subtle">
            No catalog-only listings.
          </Text>
        </div>
      )}

      {items.map((it) => (
        <div key={it.id} className="flex items-center justify-between gap-x-3 px-4 py-2.5 md:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-x-1.5">
              <Text size="small" weight="plus" className="truncate">
                {it.competitor_name ?? it.competitor_handle ?? "—"}
              </Text>
              {it.country ? <Badge size="2xsmall">{it.country}</Badge> : null}
              {it.brand ? (
                <Badge size="2xsmall" color="grey">
                  {it.brand}
                </Badge>
              ) : null}
            </div>
            {it.url ? (
              <a
                href={it.url}
                target="_blank"
                rel="noreferrer"
                className="text-ui-fg-interactive line-clamp-1 text-xs"
              >
                {it.title || it.url}
              </a>
            ) : (
              <Text size="xsmall" className="text-ui-fg-subtle line-clamp-1">
                {it.title || "—"}
              </Text>
            )}
          </div>
          {it.sku ? (
            <Badge size="2xsmall" className="shrink-0">
              {it.sku}
            </Badge>
          ) : null}
        </div>
      ))}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Competitor Catalog",
  icon: Buildings,
})

export default CompetitorCatalogPage
