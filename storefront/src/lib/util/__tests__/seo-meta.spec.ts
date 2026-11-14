import { describe, expect, it } from "vitest"
import {
  categoryLabel,
  categoryMetaDescription,
  categoryParentLabel,
  categorySeoTitle,
  collectionCategoryTwin,
  collectionsWithoutCategoryTwin,
  listingCanonicalPath,
  listingPageTitle,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  plainText,
  productMetaDescription,
  titleWithSiteName,
  truncateAtWord,
} from "../seo-meta"

describe("titleWithSiteName", () => {
  it("appends the site name when the result fits in 60 characters", () => {
    expect(titleWithSiteName("Doseador Crema")).toBe("Doseador Crema · Higitotal")
  })

  it("keeps a title of exactly 60 characters with the suffix", () => {
    const title = "x".repeat(MAX_TITLE_LENGTH - " · Higitotal".length)
    expect(titleWithSiteName(title)).toBe(`${title} · Higitotal`)
    expect(titleWithSiteName(title).length).toBe(MAX_TITLE_LENGTH)
  })

  it("drops the suffix — never truncating the name — when it would not fit", () => {
    const long =
      "Suma Auto Oven 2em1 DA9.10 Detergente Desengordurante para Fornos (2x5L)"
    expect(titleWithSiteName(long)).toBe(long)
    const justOver = "x".repeat(MAX_TITLE_LENGTH - " · Higitotal".length + 1)
    expect(titleWithSiteName(justOver)).toBe(justOver)
  })

  it("trims and falls back to the site name for an empty title", () => {
    expect(titleWithSiteName("  Papel  ")).toBe("Papel · Higitotal")
    expect(titleWithSiteName("   ")).toBe("Higitotal")
  })
})

describe("plainText", () => {
  it("strips tags and entities and collapses whitespace", () => {
    expect(plainText("<p>Limpa&nbsp;e <b>desinfeta</b></p>\n\n  &amp; mais &#233;")).toBe(
      "Limpa e desinfeta & mais é"
    )
    expect(plainText(null)).toBe("")
    expect(plainText("a &unknown; b")).toBe("a &unknown; b")
  })
})

describe("truncateAtWord", () => {
  it("leaves short text alone", () => {
    expect(truncateAtWord("curto", 10)).toBe("curto")
  })

  it("cuts on a word boundary and adds an ellipsis within the limit", () => {
    const out = truncateAtWord("um dois três quatro cinco", 14)
    expect(out).toBe("um dois três…")
    expect(out.length).toBeLessThanOrEqual(14)
  })

  it("keeps a complete last word when the cut lands before a space", () => {
    expect(truncateAtWord("abc def ghi", 8)).toBe("abc def…")
  })

  it("drops trailing punctuation before the ellipsis", () => {
    expect(truncateAtWord("um, dois, três", 9)).toBe("um, dois…")
  })

  it("hard-cuts a single word longer than the limit", () => {
    expect(truncateAtWord("abcdefghij", 5)).toBe("abcd…")
  })
})

describe("productMetaDescription", () => {
  const long =
    "Detergente desengordurante concentrado para a limpeza diária de fornos e grelhadores em cozinhas profissionais, com dosagem automática e embalagem de 5 litros."

  it("uses a description of 70+ characters, trimmed to 155", () => {
    const out = productMetaDescription({ title: "Oven", description: long })
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH)
    expect(out.endsWith("…")).toBe(true)
    expect(long.startsWith(out.slice(0, -1))).toBe(true)
  })

  it("uses a 70+ character description as-is when it fits", () => {
    const text = "Esfregona de microfibra para pavimentos, lavável a 95 °C, uso profissional."
    expect(productMetaDescription({ title: "X", description: `<p>${text}</p>` })).toBe(text)
  })

  it("falls back to the subtitle when the description is thin", () => {
    const subtitle =
      "Tablets para máquinas de lavar loiça profissionais, tudo em um, sem fosfatos."
    expect(
      productMetaDescription({ title: "Sun", description: "curta", subtitle })
    ).toBe(subtitle)
  })

  it("builds title — brand, category for a thin product", () => {
    expect(
      productMetaDescription({
        title: "R5.1-plus (2x1,5L)",
        description: null,
        categories: [
          { name: "Taski", handle: "taski-7584831", parent_category: { name: "Diversey" } },
        ],
      })
    ).toBe(
      "R5.1-plus (2x1,5L) — Taski. Uso profissional. Peça orçamento à Higitotal, Mirandela."
    )
  })

  it("names both brand and category when they differ", () => {
    expect(
      productMetaDescription({
        title: "Optimum Grill (5L)",
        categories: [
          { name: "Cozinha", handle: "cozinha", parent_category: { name: "Diversey" } },
        ],
      })
    ).toBe(
      "Optimum Grill (5L) — Diversey, Cozinha. Uso profissional. Peça orçamento à Higitotal, Mirandela."
    )
  })

  it("skips the brand when the title already names it", () => {
    expect(
      productMetaDescription({
        title: "Skip Profissional Líquido 100 Doses (7,5L)",
        collection: { title: "Unilever", handle: "unilever" },
        categories: [{ name: "Unilever", handle: "unilever", parent_category: null }],
      })
    ).toBe(
      "Skip Profissional Líquido 100 Doses (7,5L) — Unilever. Uso profissional. Peça orçamento à Higitotal, Mirandela."
    )
    expect(
      productMetaDescription({
        title: "Esfregona Vileda Ultramax",
        collection: { title: "Vileda", handle: "vileda" },
      })
    ).toBe("Esfregona Vileda Ultramax. Uso profissional. Peça orçamento à Higitotal, Mirandela.")
  })

  it("works with nothing but a title", () => {
    expect(productMetaDescription({ title: "Doseador Crema." })).toBe(
      "Doseador Crema. Uso profissional. Peça orçamento à Higitotal, Mirandela."
    )
  })

  it("stays within 155 characters for a very long title", () => {
    const out = productMetaDescription({ title: "Palavra ".repeat(30).trim() })
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH)
    expect(out.endsWith("…")).toBe(true)
  })
})

describe("category titles", () => {
  const diversey = { name: "Diversey", handle: "diversey", parent_category: null }
  const detergentes = { name: "Detergentes", handle: "detergentes", parent_category: null }

  it("leaves root categories alone", () => {
    expect(categorySeoTitle({ name: "Lavandaria", handle: "lavandaria-10426983" })).toBe(
      "Lavandaria"
    )
    expect(categorySeoTitle(diversey)).toBe("Diversey")
    expect(categoryParentLabel(diversey)).toBeNull()
  })

  it("makes same-named sub-categories unique with the parent", () => {
    const titles = [
      { name: "Lavandaria", handle: "lavandaria", parent_category: detergentes },
      { name: "Lavandaria", handle: "lavandaria-7584815", parent_category: diversey },
      { name: "Lavandaria", handle: "lavandaria-10426983", parent_category: null },
    ].map(categorySeoTitle)
    expect(titles).toEqual([
      "Lavandaria — Detergentes",
      "Lavandaria — Diversey",
      "Lavandaria",
    ])
    expect(new Set(titles).size).toBe(3)
  })

  it("uses the brand's casing for brand parents and brand categories", () => {
    expect(
      categorySeoTitle({
        name: "Papel",
        handle: "papel-7584826",
        parent_category: { name: "Diversey", handle: "diversey" },
      })
    ).toBe("Papel — Diversey")
    expect(
      categorySeoTitle({
        name: "Taski",
        handle: "taski-7584831",
        parent_category: diversey,
      })
    ).toBe("Taski — Diversey")
    expect(
      categorySeoTitle({
        name: "Detergentes",
        handle: "detergentes-10638353",
        parent_category: { name: "Equipamento Hoteleiro", handle: "equipamento-hoteleiro" },
      })
    ).toBe("Detergentes — Equipamento Hoteleiro")
  })

  it("does not repeat a parent the display name already carries", () => {
    expect(
      categorySeoTitle({ name: "Outros", handle: "outros", parent_category: detergentes })
    ).toBe("Outros detergentes")
    expect(
      categorySeoTitle({
        name: "Outros",
        handle: "outros-10085254",
        parent_category: { name: "Papel", handle: "papel" },
      })
    ).toBe("Outros produtos de papel")
    expect(
      categorySeoTitle({
        name: "Produtos",
        handle: "produtos-7585786",
        parent_category: { name: "SCJohnson (DEB)", handle: "scjohnson-(deb)" },
      })
    ).toBe("Produtos SC Johnson")
    expect(
      categoryLabel({
        name: "Acessórios e Complementos",
        parent_category: diversey,
      })
    ).toBe("Acessórios e Complementos Diversey")
  })

  it("ignores internal parents (bookkeeping codes or hidden in Medusa)", () => {
    expect(
      categoryParentLabel({ name: "Fornos", parent_category: { name: "EQ_Máquinas" } })
    ).toBeNull()
    expect(
      categorySeoTitle({
        name: "Lavandaria",
        handle: "lavandaria-10426983",
        parent_category: { name: "Proquimia", is_internal: true },
      })
    ).toBe("Lavandaria")
  })
})

describe("categoryMetaDescription", () => {
  it("keeps the plain template without parent or count", () => {
    expect(categoryMetaDescription("Papel")).toBe(
      "Papel para uso profissional — catálogo Higitotal. Peça preço e disponibilidade."
    )
  })

  it("names the parent and the product count", () => {
    expect(categoryMetaDescription("Lavandaria", { parent: "Diversey", count: 24 })).toBe(
      "Lavandaria (Diversey): 24 produtos para uso profissional no catálogo Higitotal. Peça preço e disponibilidade."
    )
    expect(categoryMetaDescription("Taski", { count: 1 })).toBe(
      "Taski: 1 produto para uso profissional no catálogo Higitotal. Peça preço e disponibilidade."
    )
  })

  it("omits a zero/unknown count", () => {
    expect(categoryMetaDescription("Papel", { parent: "Diversey", count: 0 })).toBe(
      "Papel (Diversey) para uso profissional — catálogo Higitotal. Peça preço e disponibilidade."
    )
    expect(categoryMetaDescription("Papel", { count: null })).toBe(
      categoryMetaDescription("Papel")
    )
  })

  it("stays within 155 characters", () => {
    const out = categoryMetaDescription("Dispensadores de Rolos de Marquesa", {
      parent: "Suportes e Dispensadores",
      count: 1234,
    })
    expect(out.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH)
  })
})

describe("listing canonicals and titles", () => {
  it("page 1 (missing, 1, garbage) is the clean path", () => {
    expect(listingCanonicalPath("store")).toBe("store")
    expect(listingCanonicalPath("store", "1")).toBe("store")
    expect(listingCanonicalPath("store", "abc")).toBe("store")
    expect(listingCanonicalPath("store", null)).toBe("store")
  })

  it("later pages keep ?page=N", () => {
    expect(listingCanonicalPath("store", "3")).toBe("store?page=3")
    expect(listingCanonicalPath("categories/papel", ["2", "5"])).toBe(
      "categories/papel?page=2"
    )
  })

  it("marks later pages in the title", () => {
    expect(listingPageTitle("Catálogo")).toBe("Catálogo")
    expect(listingPageTitle("Catálogo", "1")).toBe("Catálogo")
    expect(listingPageTitle("Catálogo", "2")).toBe("Catálogo — página 2")
    expect(listingPageTitle("Catálogo", ["4"])).toBe("Catálogo — página 4")
  })
})

describe("collection ↔ category duplicates", () => {
  const categories = [
    { handle: "diversey", name: "Diversey" },
    { handle: "vileda", name: "Vileda" },
    { handle: "maquinas-de-limpeza", name: "Máquinas de Limpeza" },
    { handle: "unilever", name: "Unilever" },
    { handle: "eq-maquinas", name: "EQ_Máquinas" },
    { handle: "taski-7584831", name: "Taski" },
  ]

  it("finds the same-handle category", () => {
    expect(collectionCategoryTwin("diversey", categories)?.handle).toBe("diversey")
    expect(collectionCategoryTwin("Vileda", categories)?.handle).toBe("vileda")
  })

  it("has no twin without an exact handle match", () => {
    expect(collectionCategoryTwin("fornos-profissionais", categories)).toBeUndefined()
    expect(collectionCategoryTwin("taski", categories)).toBeUndefined()
    expect(collectionCategoryTwin("", categories)).toBeUndefined()
    expect(collectionCategoryTwin(null, categories)).toBeUndefined()
    expect(collectionCategoryTwin("diversey", null)).toBeUndefined()
  })

  it("never treats an internal category as the twin", () => {
    expect(collectionCategoryTwin("eq-maquinas", categories)).toBeUndefined()
  })

  it("keeps only collections without a twin for the sitemap", () => {
    const collections = [
      { handle: "vileda" },
      { handle: "unilever" },
      { handle: "diversey" },
      { handle: "maquinas-de-limpeza" },
      { handle: "fornos-profissionais" },
      { handle: "eq-maquinas" },
    ]
    expect(
      collectionsWithoutCategoryTwin(collections, categories).map((c) => c.handle)
    ).toEqual(["fornos-profissionais", "eq-maquinas"])
    expect(collectionsWithoutCategoryTwin(collections, [])).toHaveLength(6)
    expect(collectionsWithoutCategoryTwin(null, categories)).toEqual([])
  })
})
