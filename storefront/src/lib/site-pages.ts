/**
 * Curated list of static/content pages surfaced in the header predictive
 * search (the "Páginas" section). These are fixed routes — not catalog data —
 * so they live in code and are filtered client-side by title + keywords,
 * mirroring how categories are matched. Keep keywords lowercase/unaccented
 * where helpful so partial queries still match.
 */
export type SitePage = {
  name: string
  href: string
  description: string
  /** Extra search terms (synonyms, accent-free variants) that should match. */
  keywords?: string[]
}

export const SITE_PAGES: SitePage[] = [
  {
    name: "Assistência Técnica",
    href: "/assistencia-tecnica",
    description: "Instalação, reparação e manutenção",
    keywords: [
      "assistencia",
      "tecnica",
      "reparação",
      "reparacao",
      "manutenção",
      "manutencao",
      "instalação",
      "instalacao",
      "avaria",
      "técnico",
      "tecnico",
      "contrato",
      "fagor",
      "sammic",
      "nilfisk",
    ],
  },
  {
    name: "Catálogo",
    href: "/store",
    description: "Ver todos os produtos",
    keywords: ["catalogo", "catálogo", "loja", "produtos", "store"],
  },
  {
    name: "Apoio ao Cliente",
    href: "/customer-service",
    description: "Pedidos, orçamentos e pós-venda",
    keywords: [
      "apoio",
      "cliente",
      "ajuda",
      "suporte",
      "orçamento",
      "orcamento",
      "pedidos",
      "encomendas",
      "pós-venda",
      "pos-venda",
      "devoluções",
      "devolucoes",
      "contacto",
    ],
  },
  {
    name: "Contactos",
    href: "/contact",
    description: "Morada, telefone e e-mail",
    keywords: [
      "contacto",
      "contactos",
      "morada",
      "telefone",
      "email",
      "mirandela",
    ],
  },
  {
    name: "Sobre nós",
    href: "/sobre-nos",
    description: "A empresa, as marcas e a forma como trabalhamos",
    keywords: [
      "sobre",
      "nos",
      "empresa",
      "higitotal",
      "quem somos",
      "historia",
      "história",
      "marcas",
    ],
  },
  {
    name: "A nossa loja",
    href: "/a-nossa-loja",
    description: "Morada, horário e direções",
    keywords: [
      "loja",
      "lojas",
      "morada",
      "horario",
      "horário",
      "direcoes",
      "direções",
      "mapa",
      "gps",
      "mirandela",
      "visitar",
    ],
  },
  {
    name: "A minha conta",
    href: "/account",
    description: "Encomendas e dados pessoais",
    keywords: ["conta", "encomendas", "login", "sessão", "sessao", "perfil", "registo"],
  },
  {
    name: "Política de Privacidade",
    href: "/content/privacy-policy",
    description: "Como tratamos os seus dados",
    keywords: ["privacidade", "rgpd", "dados", "politica", "política"],
  },
  {
    name: "Termos de Utilização",
    href: "/content/terms-of-use",
    description: "Condições de utilização do site",
    keywords: [
      "termos",
      "condições",
      "condicoes",
      "utilização",
      "utilizacao",
      "legal",
      "litígios",
      "reclamações",
    ],
  },
  {
    name: "Política de Cookies",
    href: "/content/cookie-policy",
    description: "Cookies e gestão do consentimento",
    keywords: ["cookies", "consentimento", "rgpd", "politica", "política"],
  },
]
