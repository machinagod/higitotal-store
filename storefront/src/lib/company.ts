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
  /** Opening hours as published on the legacy site (confirm before launch). */
  hours: "Segunda a sexta, 9h00–12h30 e 14h00–18h30",
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
