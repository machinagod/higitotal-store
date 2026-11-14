import {
  BRANDS,
  BRANDS_PATH,
  brandHref,
  brandKey,
  brandSlug,
  type Brand,
} from "@lib/brands"
import { DEFAULT_OG_IMAGE, SITE_LOCALE, SITE_NAME } from "@lib/util/seo"
import { breadcrumbSchema } from "@lib/util/structured-data"

/**
 * Copy for the brand pages (`/marcas` and `/marcas/{slug}`), keyed by the
 * brand's name in {@link BRANDS}. pt-PT. Keep claims factual and general —
 * what the brand makes and what we supply from it (our catalogue); no
 * certifications, stock levels, "distribuidor oficial", delivery times or
 * figures.
 */
export type BrandPageCopy = {
  /** One line for the /marcas index card. */
  tagline: string
  /** The page's intro, one paragraph per entry (2–4 sentences in all). */
  intro: string[]
  /** Meta description, ≤ 155 characters. */
  description: string
  /**
   * We also service this brand's equipment (from our repair records): the
   * page gets an "Assistência técnica {Marca}" section linking to
   * `/assistencia-tecnica/{slug}`.
   */
  service?: boolean
}

export const BRAND_PAGES: Record<string, BrandPageCopy> = {
  Fagor: {
    tagline: "Fornos, lavagem de loiça, frio e lavandaria",
    intro: [
      "A Fagor Professional fabrica equipamento para cozinhas profissionais e lavandarias: fornos, máquinas de lavar loiça, frio comercial e máquinas de lavar e secar roupa.",
      "Na Higitotal encontra fornos convectores e mistos, máquinas de lavar loiça, armários frigoríficos e máquinas de lavar e secar roupa Fagor, bem como pastilhas de detergente e abrilhantador para os fornos. Fazemos também a instalação e a assistência técnica deste equipamento.",
    ],
    description:
      "Equipamento Fagor Professional: fornos convectores e mistos, lavagem de loiça, frio e lavandaria, com instalação e assistência técnica. Peça orçamento.",
    service: true,
  },
  Sammic: {
    tagline: "Lavagem de loiça e preparação de alimentos",
    intro: [
      "A Sammic é um fabricante espanhol de equipamento para hotelaria e restauração, conhecido pelas máquinas de lavar loiça e pelo equipamento de preparação de alimentos.",
      "Na Higitotal encontra máquinas de lavar loiça, trituradores, descascadoras de batatas e cortadoras de legumes e de fiambre Sammic, além de acessórios como cestos de talheres e cuvetes. Damos também assistência técnica a equipamento Sammic.",
    ],
    description:
      "Equipamento Sammic para hotelaria: máquinas de lavar loiça, trituradores, descascadoras e cortadoras, com assistência técnica. Peça orçamento à Higitotal.",
    service: true,
  },
  Nilfisk: {
    tagline: "Aspiradores, varredoras e lavadoras de pavimento",
    intro: [
      "A Nilfisk é um fabricante dinamarquês de equipamento de limpeza profissional, com aspiradores, lavadoras de pavimento, varredoras e máquinas de alta pressão.",
      "Na Higitotal encontra aspiradores de pó e de líquidos, aspiradores verticais, varredoras e máquinas de injeção-extração Nilfisk, para hotelaria, serviços de limpeza e indústria. Damos também assistência técnica a máquinas Nilfisk.",
    ],
    description:
      "Máquinas de limpeza Nilfisk: aspiradores, varredoras, lavadoras de pavimento e injeção-extração, com assistência técnica. Peça orçamento à Higitotal.",
    service: true,
  },
  Viper: {
    tagline: "Lavadoras de pavimento, monodiscos e aspiradores",
    intro: [
      "A Viper é uma marca de máquinas de limpeza profissional do grupo Nilfisk: lavadoras-secadoras de pavimento, máquinas monodisco e aspiradores de sólidos e líquidos.",
      "Na Higitotal encontra lavadoras de pavimento, monodiscos e aspiradores Viper para a limpeza de pavimentos em espaços comerciais, de hotelaria e industriais. Damos também assistência técnica a máquinas Viper.",
    ],
    description:
      "Máquinas de limpeza Viper: lavadoras-secadoras de pavimento, monodiscos e aspiradores de sólidos e líquidos, com assistência técnica. Peça orçamento.",
    service: true,
  },
  Diversey: {
    tagline: "Suma, Taski, Clax, Soft Care e mais",
    intro: [
      "A Diversey desenvolve produtos e sistemas de higiene e limpeza para hotelaria, restauração, saúde, lavandaria e indústria alimentar, com gamas como Suma (cozinha), Taski (pavimentos e superfícies), Clax (lavandaria) e Soft Care (higiene das mãos). Faz parte do grupo Solenis desde 2023.",
      "Na Higitotal encontra detergentes concentrados, produtos para a lavagem de loiça e de roupa, desinfetantes e produtos de higiene pessoal Diversey, bem como doseadores e acessórios.",
    ],
    description:
      "Produtos Diversey para uso profissional: Suma, Taski, Clax e Soft Care — cozinha, lavandaria, pavimentos e higiene das mãos. Peça orçamento à Higitotal.",
  },
  Taski: {
    tagline: "Limpeza e manutenção de pavimentos e edifícios",
    intro: [
      "Taski é a marca da Diversey para a limpeza e manutenção de pavimentos e edifícios, com linhas de detergentes como Jontec (cuidado de pavimentos) e Sprint (limpeza de superfícies).",
      "Na Higitotal encontra detergentes Taski para pavimentos, multiusos e desengordurantes, ceras e protetores de pavimento e produtos de higiene sanitária, em embalagens de 5 L e em sistemas de doseamento concentrado (QuattroSelect e SmartDose).",
    ],
    description:
      "Detergentes Taski (Diversey): Jontec para pavimentos, Sprint para superfícies, ceras e higiene sanitária, também em doseamento concentrado. Peça orçamento.",
  },
  Unilever: {
    tagline: "Cif, Domestos, Skip, Sun e outras marcas",
    intro: [
      "A Unilever produz algumas das marcas de limpeza e de cuidado da roupa mais conhecidas, com versões profissionais para hotelaria, restauração e serviços de limpeza.",
      "Na Higitotal encontra produtos profissionais Cif, Domestos, Skip, Sun, Omo e Sunlight: multiusos e cremes de limpeza, limpeza de fornos e de casas de banho, detergentes para a roupa e para a loiça.",
    ],
    description:
      "Produtos profissionais Unilever — Cif, Domestos, Skip, Sun, Omo e Sunlight — para limpeza de superfícies, roupa e loiça. Peça orçamento à Higitotal.",
  },
  Vileda: {
    tagline: "Panos, mopas, esfregões, luvas e utensílios",
    intro: [
      "A Vileda Professional, do grupo Freudenberg, fabrica utensílios e sistemas de limpeza para profissionais: panos de microfibra, mopas, esfregões, luvas, baldes e carros de limpeza.",
      "Na Higitotal encontra uma gama alargada Vileda: panos, esfregões e salva-unhas, luvas, mopas e cabos, sistemas de limpeza de vidros, tapetes e discos para máquinas de pavimento.",
    ],
    description:
      "Utensílios de limpeza Vileda Professional: panos de microfibra, mopas, esfregões, luvas, limpeza de vidros e discos. Peça orçamento à Higitotal.",
  },
  "Vileda Swep": {
    tagline: "Sistema de mopas planas para pavimentos",
    intro: [
      "Swep é o sistema de mopas planas da Vileda Professional para a lavagem de pavimentos, com mopas de microfibra em versões Single e Duo e os respetivos suportes.",
      "Na Higitotal encontra mopas e recargas Swep — MicroTech, MicroCombi, SafetyPlus, HygienePlus e SaniTech — e os suportes Swep Duo.",
    ],
    description:
      "Vileda Swep: mopas planas de microfibra (MicroTech, MicroCombi, SafetyPlus, HygienePlus, SaniTech) e suportes Swep Duo. Peça orçamento à Higitotal.",
  },
  "SC Johnson (Deb)": {
    tagline: "Higiene e proteção da pele no trabalho",
    intro: [
      "A SC Johnson Professional, que integrou o grupo Deb, reúne marcas de higiene e proteção da pele no trabalho como Deb, Stokolan, Swarfega, Solopol e Kresto.",
      "Na Higitotal encontra sabonetes em espuma e em loção, desinfetantes de mãos, limpadores de mãos para sujidade industrial, cremes de cuidado e os respetivos doseadores, para casas de banho, cozinhas e oficinas.",
    ],
    description:
      "SC Johnson Professional (Deb): sabonetes, desinfetantes de mãos, limpadores de mãos industriais (Swarfega, Solopol) e doseadores. Peça orçamento.",
  },
  Celea: {
    tagline: "Papel, guardanapos e esfregões",
    intro: [
      "Celea é uma marca de consumíveis de higiene e limpeza para uso profissional, sobretudo papel e descartáveis.",
      "Na Higitotal encontra papel higiénico, rolos industriais, papel de chaminé, toalhas de mãos e guardanapos Celea, além de esfregões, salva-unhas e outros produtos de limpeza.",
    ],
    description:
      "Consumíveis Celea para uso profissional: papel higiénico e industrial, toalhas de mãos, guardanapos e esfregões. Peça orçamento à Higitotal.",
  },
}

/** Copy for the `/marcas` index. */
export const BRANDS_INDEX_COPY = {
  /** The site title template appends " · Higitotal". */
  title: "Marcas de higiene e equipamento profissional",
  heading: "Marcas",
  intro:
    "As marcas de higiene profissional, utensílios de limpeza e equipamento para hotelaria com que trabalhamos. Escolha uma marca para ver os produtos que temos no catálogo e peça orçamento.",
  description:
    "Diversey, Taski, Vileda, Unilever, Fagor, Sammic, Nilfisk, Viper e outras marcas de higiene e equipamento profissional no catálogo Higitotal.",
}

/** Fallback copy for a brand added to BRANDS without an entry above. */
function defaultCopy(name: string): BrandPageCopy {
  return {
    tagline: "Produtos para uso profissional",
    intro: [
      `Produtos ${name} para uso profissional no catálogo Higitotal. Peça orçamento para preço e disponibilidade.`,
    ],
    description: `Produtos ${name} para uso profissional no catálogo Higitotal. Peça orçamento para preço e disponibilidade.`,
  }
}

/** The page copy for a brand (a generic fallback when it has none). */
export function brandPageCopy(brand: Pick<Brand, "name">): BrandPageCopy {
  return BRAND_PAGES[brand.name] ?? defaultCopy(brand.name)
}

/** The site title template (root layout) appends this. */
const TITLE_SUFFIX = " · Higitotal"
const TITLE_MAX = 60

/**
 * `<title>` for a brand page: "{Marca} — produtos profissionais · Higitotal",
 * or without the site suffix when that would pass 60 characters.
 */
export function brandPageTitle(name: string): string | { absolute: string } {
  const title = `${name} — produtos profissionais`
  return title.length + TITLE_SUFFIX.length <= TITLE_MAX
    ? title
    : { absolute: title }
}

/**
 * Service page for a brand we also repair (`/assistencia-tecnica/{slug}`),
 * else undefined.
 */
export function brandServicePath(brand: Pick<Brand, "name">): string | undefined {
  if (!brandPageCopy(brand).service) return undefined
  return `/assistencia-tecnica/${brandSlug(brand.name)}`
}

/**
 * Open Graph for the brand pages. A page-level `openGraph` replaces the root
 * layout's, so the site name,
 * locale and the site's default share image are restated here — the brand
 * logos are SVG, which most link previews do not render.
 */
export function brandOpenGraph({
  title,
  description,
  url,
}: {
  title: string
  description: string
  url: string
}) {
  return {
    type: "website" as const,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    title,
    description,
    url,
    images: [DEFAULT_OG_IMAGE],
  }
}

/** A search hit, as far as the brand filter reads it. */
export type BrandSearchHit = {
  title?: string | null
  subtitle?: string | null
  description?: string | null
  collection?: { title?: string | null } | null
  categories?: { name?: string | null }[] | null
}

/** Lower-case, accent-free text with every non-alphanumeric run as a space. */
const words = (value: string | null | undefined) =>
  ` ${(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")} `

/**
 * Whether a search hit really is the brand's: its name appears as a whole
 * word in the title, subtitle, description, collection or categories.
 * Catalogue search is typo-tolerant ("Celea" also finds "Clean…"), which is
 * right for the search box but not for a brand page.
 */
export function hitMentionsBrand(
  brand: Pick<Brand, "name" | "wordmark">,
  hit: BrandSearchHit
): boolean {
  const haystack = [
    hit.title,
    hit.subtitle,
    hit.description,
    hit.collection?.title,
    ...(hit.categories ?? []).map((c) => c?.name),
  ]
    .map(words)
    .join(" ")
  const needles = [brand.name, brand.wordmark]
    .filter((n): n is string => !!n && !!brandKey(n))
    .map(words)
  return needles.some((n) => haystack.includes(n))
}

/** Sitemap entry shape (subset of Next's `MetadataRoute.Sitemap` item). */
type SitemapEntry = {
  url: string
  changeFrequency: "weekly" | "monthly"
  priority: number
}

/**
 * Sitemap entries for `/marcas` and every brand page (every {@link BRANDS}
 * entry has one). `baseUrl` is the
 * absolute, country-prefixed site root (e.g. "https://www.higitotal.pt/pt").
 */
export function brandSitemapEntries(baseUrl: string): SitemapEntry[] {
  const base = baseUrl.replace(/\/+$/, "")
  return [
    { url: `${base}${BRANDS_PATH}`, changeFrequency: "monthly", priority: 0.6 },
    ...BRANDS.map((b) => ({
      url: `${base}${brandHref(b)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]
}

type Json = Record<string, any>

/**
 * JSON-LD for a brand page: a CollectionPage about the Brand (logo included),
 * plus the Início › Marcas › {Marca} BreadcrumbList. URLs are absolute.
 */
export function brandPageSchema({
  brand,
  url,
  homeUrl,
  indexUrl,
  logoUrl,
  description,
}: {
  brand: Pick<Brand, "name">
  url: string
  homeUrl: string
  indexUrl: string
  logoUrl?: string
  description: string
}): Json[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: `${brand.name} — produtos profissionais`,
      description,
      inLanguage: "pt-PT",
      about: {
        "@type": "Brand",
        name: brand.name,
        ...(logoUrl ? { logo: logoUrl } : {}),
      },
    },
    breadcrumbSchema([
      { name: "Início", url: homeUrl },
      { name: "Marcas", url: indexUrl },
      { name: brand.name, url },
    ]),
  ]
}

/**
 * JSON-LD for the /marcas index: a CollectionPage whose ItemList names every
 * brand page, plus the Início › Marcas BreadcrumbList.
 */
export function brandIndexSchema({
  url,
  homeUrl,
  description,
  items,
}: {
  url: string
  homeUrl: string
  description: string
  items: { name: string; url: string }[]
}): Json[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${url}#page`,
      url,
      name: "Marcas",
      description,
      inLanguage: "pt-PT",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          url: item.url,
        })),
      },
    },
    breadcrumbSchema([
      { name: "Início", url: homeUrl },
      { name: "Marcas", url },
    ]),
  ]
}
