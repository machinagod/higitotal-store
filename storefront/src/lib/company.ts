/**
 * Single source of truth for Higitotal's public company details, used by the
 * header, footer, contact/legal pages and forms. Change here, not in JSX.
 */
export const COMPANY = {
  legalName: "Higitotal — Sistemas e Produtos de Higiene, Lda.",
  shortName: "Higitotal",
  nipc: "504297040",
  since: 1999,
  address: {
    street: "Zona Industrial, Rua J, n.º 137",
    postalCode: "5370-565",
    city: "Mirandela",
    country: "Portugal",
  },
  /** Shop/office location, as published on the legacy "A Nossa Loja" page. */
  geo: { latitude: 41.5008095, longitude: -7.164659 },
  /** Opening hours as published on the legacy site (confirm before launch).
   * `hours` is the display text; `openingHours` is the same schedule,
   * structured (schema.org day names, 24h times) for JSON-LD and the per-day
   * list. Keep the two in step — a unit test checks that they agree. */
  hours: "Segunda a sexta, 9h00–12h30 e 14h00–18h30",
  openingHours: [
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "12:30",
    },
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "14:00",
      closes: "18:30",
    },
  ],
  email: "higitotal@higitotal.pt",
  phone: {
    display: "+351 278 262 913",
    href: "tel:+351278262913",
    /** Required next to the number by DL 59/2021. */
    costNote: "Chamada para a rede fixa nacional",
  },
  /** Livro de Reclamações Eletrónico (DL 156/2005, as amended by DL 74/2017). */
  complaintsBookUrl: "https://www.livroreclamacoes.pt/Inicio/",
  /** Consumer dispute resolution (Lei 144/2015) — confirm with counsel. */
  disputeResolution: { name: "CNIACC — Centro Nacional de Informação e Arbitragem de Conflitos de Consumo", url: "https://www.cniacc.pt" },
} as const

/** Whole years of activity since the founding year (avoids hard-coded "27 anos"). */
export function yearsInBusiness(now: Date = new Date()): number {
  return now.getFullYear() - COMPANY.since
}

/** Monday-first week: schema.org day name + pt-PT label. */
export const WEEKDAYS = [
  { id: "Monday", label: "Segunda-feira" },
  { id: "Tuesday", label: "Terça-feira" },
  { id: "Wednesday", label: "Quarta-feira" },
  { id: "Thursday", label: "Quinta-feira" },
  { id: "Friday", label: "Sexta-feira" },
  { id: "Saturday", label: "Sábado" },
  { id: "Sunday", label: "Domingo" },
] as const

export type Weekday = (typeof WEEKDAYS)[number]["id"]

type OpeningSlot = {
  days: ReadonlyArray<string>
  opens: string
  closes: string
}

/** "09:00" → "9h00" (the site's display format for times). */
export function displayTime(time: string): string {
  const [h, m] = time.split(":")
  return `${Number(h)}h${m}`
}

/**
 * The week, one entry per day, with that day's opening slots in display
 * format ("9h00–12h30"); an empty `slots` list means closed.
 */
export function weeklyHours(
  schedule: ReadonlyArray<OpeningSlot> = COMPANY.openingHours
): { id: Weekday; label: string; slots: string[] }[] {
  return WEEKDAYS.map(({ id, label }) => ({
    id,
    label,
    slots: schedule
      .filter((s) => s.days.includes(id))
      .map((s) => `${displayTime(s.opens)}–${displayTime(s.closes)}`),
  }))
}

const COORDS = `${COMPANY.geo.latitude}%2C${COMPANY.geo.longitude}`

/** Google Maps at the shop's coordinates (a plain link — never an embed). */
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${COORDS}`

/** Google Maps directions to the shop from wherever the visitor is. */
export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${COORDS}`
