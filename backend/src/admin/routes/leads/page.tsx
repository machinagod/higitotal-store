import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import type { LeadKind, LeadStats } from "../../../lib/lead-stats"
import { sdk } from "../../lib/sdk"

/**
 * "Pedidos (leads)": exact, cookie-independent count of the storefront form
 * submissions (GET /admin/lead-stats — derived from the staff e-mails the
 * backend sends). Counts, kinds and landing page paths only: no personal data.
 */

const KIND_LABELS: Record<LeadKind, string> = {
  produto: "Pedido de produto",
  orcamento: "Lista de orçamento",
  assistencia: "Assistência técnica",
  geral: "Contacto geral",
}

const RANGES = [30, 90, 180, 365] as const

/** Today's calendar date in Lisbon (YYYY-MM-DD), like the backend. */
const lisbonToday = (): string => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  ) as Record<string, string>
  return `${parts.year}-${parts.month}-${parts.day}`
}

const addDays = (date: string, days: number): string => {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** "2026-11-14" → "14/11/2026" (weekday too when asked). */
const ptDate = (date: string, weekday = false): string =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("pt-PT", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(weekday ? { weekday: "short" as const } : {}),
  })

const decodePath = (path: string): string => {
  try {
    return decodeURI(path)
  } catch {
    return path
  }
}

const Change = ({ change, pct }: { change: number; pct: number | null }) => {
  const color = change > 0 ? "green" : change < 0 ? "red" : "grey"
  const sign = change > 0 ? "+" : ""
  return (
    <Badge size="2xsmall" color={color}>
      {sign}
      {change}
      {pct !== null ? ` (${sign}${pct.toLocaleString("pt-PT")}%)` : ""}
    </Badge>
  )
}

const Bar = ({ value, max }: { value: number; max: number }) => (
  <div className="bg-ui-bg-subtle h-2 w-full overflow-hidden rounded-full">
    <div
      className="bg-ui-fg-interactive h-full rounded-full"
      style={{ width: max > 0 ? `${(value / max) * 100}%` : "0%" }}
    />
  </div>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="px-6 py-4">
    <Heading level="h2" className="mb-3">
      {title}
    </Heading>
    {children}
  </div>
)

const LeadsPage = () => {
  const [days, setDays] = useState<(typeof RANGES)[number]>(90)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["lead-stats", days],
    queryFn: () => {
      const to = lisbonToday()
      return sdk.client.fetch<LeadStats>("/admin/lead-stats", {
        query: { from: addDays(to, -(days - 1)), to },
      })
    },
  })

  const maxDay = Math.max(0, ...(data?.by_day ?? []).map((d) => d.leads))
  const maxKind = Math.max(0, ...(data?.by_kind ?? []).map((k) => k.leads))
  const pages = (data?.by_page ?? []).slice(0, 10)
  const maxPage = Math.max(0, ...pages.map((p) => p.leads))

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex flex-col items-start justify-between gap-3 px-6 py-4 md:flex-row md:items-center">
          <div>
            <Heading>Pedidos (leads)</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Pedidos enviados pelos formulários do site (produto, lista de orçamento, contacto,
              assistência). Contados no servidor — não dependem de cookies. Sem dados pessoais.
            </Text>
          </div>
          <div className="flex gap-1">
            {RANGES.map((n) => (
              <Button
                key={n}
                size="small"
                variant={n === days ? "secondary" : "transparent"}
                onClick={() => setDays(n)}
              >
                {n} dias
              </Button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">
              A carregar…
            </Text>
          </div>
        )}
        {isError && (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-error">
              Não foi possível carregar as estatísticas.
            </Text>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3">
            {data.comparisons.map((c) => (
              <div key={c.days} className="bg-ui-bg-subtle rounded-lg p-4">
                <Text size="small" className="text-ui-fg-subtle">
                  Últimos {c.days} dias
                </Text>
                <Heading level="h1" className="my-1">
                  {c.current.leads}
                </Heading>
                <div className="flex flex-wrap items-center gap-2">
                  <Change change={c.change} pct={c.change_pct} />
                  <Text size="xsmall" className="text-ui-fg-muted">
                    vs. {c.days} dias anteriores ({c.previous.leads})
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {data && (
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">
              {ptDate(data.range.from)} – {ptDate(data.range.to)} ({data.range.days} dias, hora de
              Lisboa): <strong>{data.totals.leads}</strong> pedidos, dos quais{" "}
              {data.totals.quote_lists} listas de orçamento com {data.totals.quote_lines} linhas.
            </Text>
            {data.totals.failed > 0 && (
              <Text size="small" className="text-ui-fg-error mt-1">
                {data.totals.failed} pedido(s) não chegaram ao e-mail (falha de envio) — não contados
                acima.
              </Text>
            )}
          </div>

          <Section title="Por tipo">
            <div className="flex flex-col gap-2">
              {data.by_kind.map((k) => (
                <div key={k.kind} className="grid grid-cols-[180px_1fr_40px] items-center gap-3">
                  <Text size="small">{KIND_LABELS[k.kind]}</Text>
                  <Bar value={k.leads} max={maxKind} />
                  <Text size="small" className="text-right tabular-nums">
                    {k.leads}
                  </Text>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Páginas de origem (top 10)">
            {pages.length === 0 ? (
              <Text size="small" className="text-ui-fg-subtle">
                Sem pedidos neste período.
              </Text>
            ) : (
              <div className="flex flex-col gap-2">
                {pages.map((p) => (
                  <div
                    key={p.path ?? "-"}
                    className="grid grid-cols-[minmax(0,2fr)_1fr_40px] items-center gap-3"
                  >
                    <Text size="small" className="truncate font-mono" title={p.path ?? undefined}>
                      {p.path ? decodePath(p.path) : "(desconhecida)"}
                    </Text>
                    <Bar value={p.leads} max={maxPage} />
                    <Text size="small" className="text-right tabular-nums">
                      {p.leads}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Por dia">
            <div className="flex flex-col gap-1">
              {[...data.by_day].reverse().map((d) => (
                <div key={d.date} className="grid grid-cols-[120px_1fr_40px] items-center gap-3">
                  <Text size="xsmall" className="text-ui-fg-subtle tabular-nums">
                    {ptDate(d.date, true)}
                  </Text>
                  <Bar value={d.leads} max={maxDay} />
                  <Text size="xsmall" className="text-right tabular-nums">
                    {d.leads}
                  </Text>
                </div>
              ))}
            </div>
          </Section>
        </Container>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Pedidos (leads)",
  icon: ChartBar,
})

export default LeadsPage
