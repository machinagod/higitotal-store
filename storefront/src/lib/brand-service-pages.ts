import { COMPANY } from "@lib/company"
import { organizationSchema } from "@lib/util/structured-data"
import { SITE_NAME } from "@lib/util/seo"

/**
 * Per-brand technical-assistance landing pages
 * (`/[countryCode]/assistencia-tecnica/[marca]`) — the brands our repair
 * records show we service most: Fagor, Sammic, Nilfisk and Viper.
 *
 * Copy rule: every claim here must already be on the main Assistência Técnica
 * page or in {@link COMPANY} (services, "no local ou em oficina", peças
 * originais, orçamento sem compromisso, contract benefits, "resposta
 * prioritária no Norte", the other-brands line). The per-brand equipment lists
 * are each manufacturer's well-known product categories — no response times,
 * certifications, "serviço oficial" status, prices or coverage figures.
 */

export type BrandServiceSlug = "fagor" | "sammic" | "nilfisk" | "viper"

export type EquipmentType = {
  title: string
  body: string
}

export type Faq = {
  question: string
  answer: string
}

export type BrandServicePage = {
  slug: BrandServiceSlug
  /** Display name, with the brand's own casing (matches `@lib/brands`). */
  brand: string
  /** Segment the brand belongs to, for the eyebrow and copy. */
  segment: string
  /** pt-PT intro paragraph under the H1. */
  intro: string
  /** Equipment-type cards. */
  equipment: EquipmentType[]
  /** Short form of the equipment, for the meta description / Service JSON-LD. */
  equipmentSummary: string
  /** Placeholder for the request form's description field. */
  messagePlaceholder: string
}

/** Priority-response radius around Mirandela (confirmed by Higitotal; the
 * main page's hero shows the same "≈200 km"). */
export const SERVICE_RADIUS_KM = 200

/**
 * Towns within the radius (straight-line distance from Mirandela, all
 * ≤ 190 km), grouped by region, nearest first. Confirmed by Higitotal as
 * served; edit here to change the pages, FAQ and Service JSON-LD.
 */
export const SERVICE_TOWNS: { region: string; towns: string[] }[] = [
  {
    region: "Trás-os-Montes",
    towns: [
      "Mirandela",
      "Valpaços",
      "Macedo de Cavaleiros",
      "Torre de Moncorvo",
      "Chaves",
      "Vinhais",
      "Mogadouro",
      "Bragança",
      "Vila Real",
      "Miranda do Douro",
    ],
  },
  { region: "Douro", towns: ["Peso da Régua", "Lamego"] },
  {
    region: "Minho e Porto",
    towns: ["Guimarães", "Braga", "Porto", "Viana do Castelo"],
  },
  {
    region: "Beiras",
    towns: ["Guarda", "Viseu", "Covilhã", "Aveiro", "Coimbra", "Castelo Branco"],
  },
]

/** Every served town, flat. */
export const SERVICE_TOWN_NAMES = SERVICE_TOWNS.flatMap((r) => r.towns)

/** Service-area line shown under the intro. */
export const SERVICE_AREA = `A partir de Mirandela, num raio de cerca de ${SERVICE_RADIUS_KM} km: Trás-os-Montes, Douro, Minho, Porto e Beiras`

const PAGES: BrandServicePage[] = [
  {
    slug: "fagor",
    brand: "Fagor",
    segment: "Cozinha industrial e lavandaria",
    intro:
      "Instalamos, reparamos e mantemos equipamento Fagor Professional (antiga Fagor Industrial) de cozinha profissional e lavandaria: fornos mistos, máquinas de lavar louça, fritadeiras e confeção, refrigeração e máquinas de lavandaria. Técnicos especializados, sediados em Mirandela, com resposta prioritária no Norte.",
    equipment: [
      {
        title: "Fornos mistos",
        body: "Fornos combinados de convecção e vapor, elétricos e a gás.",
      },
      {
        title: "Máquinas de lavar louça",
        body: "Máquinas de lavar copos, de lavar louça de carga frontal, de capota e de túnel.",
      },
      {
        title: "Fritadeiras e confeção",
        body: "Fritadeiras, fogões, placas, fry-tops e restante equipamento de confeção.",
      },
      {
        title: "Refrigeração",
        body: "Armários e bancadas refrigeradas e máquinas de gelo.",
      },
      {
        title: "Lavandaria",
        body: "Máquinas de lavar roupa, secadores e calandras.",
      },
    ],
    equipmentSummary: "fornos mistos, máquinas de lavar louça e lavandaria",
    messagePlaceholder:
      "Ex.: o forno misto Fagor dá erro e não gera vapor.",
  },
  {
    slug: "sammic",
    brand: "Sammic",
    segment: "Lavagem de louça e preparação de alimentos",
    intro:
      "Instalamos, reparamos e mantemos equipamento Sammic de hotelaria e restauração: máquinas de lavar louça e copos e equipamento de preparação de alimentos, como cortadoras de legumes, descascadoras, cutters e fatiadoras. Técnicos especializados, sediados em Mirandela, com resposta prioritária no Norte.",
    equipment: [
      {
        title: "Máquinas de lavar louça e copos",
        body: "Máquinas de lavar copos, de lavar louça de carga frontal e de capota.",
      },
      {
        title: "Cortadoras de legumes",
        body: "Cortadoras e processadoras de legumes.",
      },
      {
        title: "Descascadoras",
        body: "Descascadoras de batata e de legumes.",
      },
      {
        title: "Cutters e trituradoras",
        body: "Cutters, trituradoras e varinhas.",
      },
      {
        title: "Fatiadoras",
        body: "Fatiadoras para carnes, enchidos e queijos.",
      },
      {
        title: "Embalamento a vácuo",
        body: "Embaladoras de vácuo e equipamento de cozinha sous-vide.",
      },
    ],
    equipmentSummary: "máquinas de lavar louça e preparação de alimentos",
    messagePlaceholder:
      "Ex.: a máquina de lavar louça Sammic não aquece a água.",
  },
  {
    slug: "nilfisk",
    brand: "Nilfisk",
    segment: "Máquinas de limpeza profissional",
    intro:
      "Instalamos, reparamos e mantemos máquinas de limpeza profissional Nilfisk: lavadoras de pavimentos, varredoras, aspiradores, máquinas de alta pressão e monodiscos. Técnicos especializados, sediados em Mirandela, com resposta prioritária no Norte.",
    equipment: [
      {
        title: "Lavadoras de pavimentos",
        body: "Lavadoras-secadoras de condutor apeado e de condutor sentado.",
      },
      {
        title: "Varredoras",
        body: "Varredoras de pavimentos para interior e exterior.",
      },
      {
        title: "Aspiradores",
        body: "Aspiradores de pó e aspiradores de pó e líquidos.",
      },
      {
        title: "Máquinas de alta pressão",
        body: "Máquinas de lavar de alta pressão, de água fria e de água quente.",
      },
      {
        title: "Monodiscos",
        body: "Máquinas monodisco para lavagem e tratamento de pavimentos.",
      },
    ],
    equipmentSummary: "lavadoras de pavimentos, aspiradores e alta pressão",
    messagePlaceholder:
      "Ex.: a lavadora de pavimentos Nilfisk não aspira a água.",
  },
  {
    slug: "viper",
    brand: "Viper",
    segment: "Máquinas de limpeza profissional",
    intro:
      "Instalamos, reparamos e mantemos máquinas de limpeza profissional Viper: lavadoras de pavimentos, monodiscos, aspiradores e extratoras de alcatifas. Técnicos especializados, sediados em Mirandela, com resposta prioritária no Norte.",
    equipment: [
      {
        title: "Lavadoras de pavimentos",
        body: "Lavadoras-secadoras de condutor apeado e de condutor sentado.",
      },
      {
        title: "Monodiscos",
        body: "Máquinas monodisco para lavagem, decapagem e polimento de pavimentos.",
      },
      {
        title: "Aspiradores",
        body: "Aspiradores de pó e aspiradores de pó e líquidos.",
      },
      {
        title: "Extratoras de alcatifas",
        body: "Máquinas de injeção-extração para alcatifas e estofos.",
      },
    ],
    equipmentSummary: "lavadoras de pavimentos, monodiscos e aspiradores",
    messagePlaceholder:
      "Ex.: a monodisco Viper liga mas a escova não roda.",
  },
]

export const BRAND_SERVICE_PAGES: readonly BrandServicePage[] = PAGES

export const BRAND_SERVICE_SLUGS: readonly BrandServiceSlug[] = PAGES.map(
  (p) => p.slug
)

/** Path of a brand service page, without the country prefix. */
export const brandServicePath = (slug: string) =>
  `/assistencia-tecnica/${slug}`

/** Path of the brand's product page (built by the /marcas route). */
export const brandProductsPath = (slug: string) => `/marcas/${slug}`

/** The page for a slug (case-insensitive), or undefined for an unknown one. */
export function getBrandServicePage(
  slug: string | undefined | null
): BrandServicePage | undefined {
  const key = (slug ?? "").trim().toLowerCase()
  return PAGES.find((p) => p.slug === key)
}

/** The page whose brand name matches (e.g. the main page's brand chips). */
export function getBrandServicePageByName(
  name: string
): BrandServicePage | undefined {
  const key = name.trim().toLowerCase()
  return PAGES.find((p) => p.brand.toLowerCase() === key)
}

/** `generateStaticParams` rows: every country code × every brand slug. */
export function brandServiceStaticParams(
  countryCodes: readonly string[]
): { countryCode: string; marca: string }[] {
  return countryCodes.flatMap((countryCode) =>
    PAGES.map((p) => ({ countryCode, marca: p.slug }))
  )
}

export const brandServiceH1 = (page: BrandServicePage) =>
  `Assistência técnica ${page.brand}`

/** Full document title (the layout's "%s · Higitotal" template, made explicit). */
export const brandServiceTitle = (page: BrandServicePage) =>
  `${brandServiceH1(page)} · ${SITE_NAME}`

/** Meta description (≤ 155 characters, mentions Mirandela and the North). */
export const brandServiceDescription = (page: BrandServicePage) =>
  `Instalação, reparação e manutenção ${page.brand}: ${page.equipmentSummary}. Técnicos em Mirandela, resposta prioritária no Norte.`

/** Next.js metadata for a brand service page; `canonical` is its own URL. */
export function brandServiceMetadata(page: BrandServicePage, canonical: string) {
  const title = brandServiceTitle(page)
  const description = brandServiceDescription(page)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website" as const,
      locale: "pt_PT",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
    },
  }
}

/** Shared FAQ, with the brand's name where it reads naturally. */
export function brandServiceFaqs(page: BrandServicePage): Faq[] {
  const others = PAGES.filter((p) => p.slug !== page.slug).map((p) => p.brand)
  const othersText = `${others.slice(0, -1).join(", ")} e ${others[others.length - 1]}`
  return [
    {
      question: `Fazem contratos de manutenção para equipamento ${page.brand}?`,
      answer:
        "Sim. O contrato de manutenção inclui visitas periódicas programadas de manutenção preventiva, prioridade no atendimento e o registo de cada intervenção e do estado de cada máquina, num plano anual adaptado ao seu equipamento.",
    },
    {
      question: "Que informação devo enviar no pedido de assistência?",
      answer: `A marca e o modelo do equipamento, o número de série (consta da chapa de características), uma descrição da avaria e a localidade. Se puder, envie também uma fotografia da chapa e do problema para ${COMPANY.email}.`,
    },
    {
      question: "A reparação é feita no local?",
      answer:
        "Fazemos o diagnóstico e a reparação no local ou em oficina, com peças originais. O orçamento é sem compromisso e o serviço tem garantia.",
    },
    {
      question: `Trabalham com outras marcas além da ${page.brand}?`,
      answer: `Sim. Damos também assistência a equipamento ${othersText}, e reparamos equipamento de refrigeração, de confeção a gás e de lavandaria de outras marcas.`,
    },
    {
      question: "Onde estão e que zona servem?",
      answer: `A nossa equipa técnica está sediada em ${COMPANY.address.city} (${COMPANY.address.street}), em Trás-os-Montes, com resposta prioritária num raio de cerca de ${SERVICE_RADIUS_KM} km: ${SERVICE_TOWNS.map((r) => `${r.region} (${r.towns.filter((t) => t !== COMPANY.address.city).join(", ")})`).join("; ")}. Indique a localidade no pedido ou ligue para ${COMPANY.phone.display}.`,
    },
  ]
}

/** The three services (main page "O que fazemos"), worded for the brand. */
export function brandServiceOffers(
  page: BrandServicePage
): { id: "instalacao" | "reparacao" | "manutencao"; title: string; body: string }[] {
  return [
    {
      id: "instalacao",
      title: "Instalação",
      body: `Instalação e arranque de equipamento ${page.brand}, com configuração e formação à sua equipa.`,
    },
    {
      id: "reparacao",
      title: "Reparação",
      body: "Diagnóstico e reparação no local ou em oficina, com peças originais. Orçamento sem compromisso e serviço com garantia.",
    },
    {
      id: "manutencao",
      title: "Contratos de manutenção",
      body: "Manutenção preventiva planeada que reduz avarias, prolonga o equipamento e evita paragens, com prioridade no atendimento.",
    },
  ]
}

/** "Como funciona" — the process, from the main page's facts. */
export const HOW_IT_WORKS: readonly { title: string; body: string }[] = [
  {
    title: "Envie o pedido",
    body: `Pelo formulário abaixo ou por telefone, para ${COMPANY.phone.display}. A nossa equipa responde em dias úteis.`,
  },
  {
    title: "Diagnóstico",
    body: "Avaliamos o equipamento no local ou em oficina e apresentamos um orçamento sem compromisso.",
  },
  {
    title: "Reparação",
    body: "Reparamos com peças originais. Serviço com garantia.",
  },
  {
    title: "Manutenção",
    body: "Com um contrato de manutenção, visitas periódicas programadas e prioridade no atendimento.",
  },
]

type Json = Record<string, any>

/** schema.org Service for the page; `url` is its canonical URL. */
export function brandServiceSchema(page: BrandServicePage, url: string): Json {
  const provider = organizationSchema()
  delete provider["@context"]
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: brandServiceH1(page),
    serviceType: brandServiceH1(page),
    description: brandServiceDescription(page),
    url,
    inLanguage: "pt-PT",
    brand: { "@type": "Brand", name: page.brand },
    category: page.segment,
    provider,
    areaServed: [
      {
        "@type": "GeoCircle",
        geoMidpoint: {
          "@type": "GeoCoordinates",
          latitude: COMPANY.geo.latitude,
          longitude: COMPANY.geo.longitude,
        },
        geoRadius: SERVICE_RADIUS_KM * 1000,
      },
      ...SERVICE_TOWN_NAMES.map((name) => ({
        "@type": "City",
        name,
        containedInPlace: { "@type": "Country", name: "Portugal" },
      })),
    ],
  }
}

/** schema.org FAQPage for the brand's FAQ. */
export function brandServiceFaqSchema(page: BrandServicePage): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: brandServiceFaqs(page).map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  }
}

/**
 * Breadcrumb trail (Início › Assistência técnica › {Marca}). `baseUrl` is the
 * absolute, country-prefixed site root (e.g. `https://www.higitotal.pt/pt`).
 */
export function brandServiceBreadcrumbs(
  page: BrandServicePage,
  baseUrl: string
): { name: string; url: string }[] {
  const base = baseUrl.replace(/\/+$/, "")
  return [
    { name: "Início", url: base },
    { name: "Assistência técnica", url: `${base}/assistencia-tecnica` },
    { name: page.brand, url: `${base}${brandServicePath(page.slug)}` },
  ]
}

/**
 * Sitemap rows for the brand service pages. `baseUrl` is the absolute,
 * country-prefixed site root (e.g. `https://www.higitotal.pt/pt`).
 */
export function serviceSitemapEntries(
  baseUrl: string,
  now: Date = new Date()
): {
  url: string
  lastModified: Date
  changeFrequency: "monthly"
  priority: number
}[] {
  const base = baseUrl.replace(/\/+$/, "")
  return PAGES.map((p) => ({
    url: `${base}${brandServicePath(p.slug)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))
}
