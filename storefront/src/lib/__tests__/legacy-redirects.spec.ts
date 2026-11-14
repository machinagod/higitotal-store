import { describe, expect, it } from "vitest"
import { legacyRedirect } from "../legacy-redirects"
import { LEGACY_ATTACHMENTS, LEGACY_PRODUCTS } from "../legacy-redirects-data"

const r = (url: string) => {
  const u = new URL(url, "https://www.higitotal.pt")
  return legacyRedirect(u.pathname, u.searchParams)
}

describe("legacyRedirect", () => {
  it("ignores non-legacy paths", () => {
    expect(r("/pt/store")).toBeNull()
    expect(r("/basement")).toBeNull()
  })
  it("maps old product URLs (with/without category, with EAN) to the same product", () => {
    expect(r("/base/detergentes/2-drip-floor-ultraconcentrado-2l-8436536083804.html")).toBe(
      "/pt/products/dx1002-159978153"
    )
    expect(r("/base/2-drip-floor.html")).toBe("/pt/products/dx1002-159978153")
    expect(r("/base/index.php?id_product=2&controller=product")).toBe("/pt/products/dx1002-159978153")
  })
  it("maps the old pages Google still ranks to the matching product, not a category", () => {
    const cases: Record<string, string> = {
      // Same reference / model
      "maquinas-de-limpeza/35-injeccaoextraccao-nilfisk-ax-14.html": "nes1512405101-211763059",
      "maquinas-de-limpeza/34-aspirador-de-po-nilfisk-vp300-eco.html": "n107421144-216053201",
      "equipamento-hoteleiro/19-maquina-de-secar-a-roupa-electrica-fagor-16kg-sr-16-e.html": "m-19071868-159979806",
      "equipamento-hoteleiro/55-maquina-de-lavar-a-roupa-la-14-tp-2-e-fagor.html": "m-19058420-159979804",
      "detergentes/5-drip-toilet-ultraconcentrado-2l-8436536083835.html": "dx1005-159978163",
      "home/38-esfregao-preto-em-rolo-14x600cm-1-rolo.html": "v100086-159982561",
      // Successor / same model family
      "maquinas-de-limpeza/26-aspirador-de-po-e-liquidos-viper-lsu-135.html": "n50000111-159981006",
      "maquinas-de-limpeza/53-injeccaoextraccao-nilfisk-ax-410.html": "nes1512405101-211763059",
      "equipamento-hoteleiro/58-maquina-de-lavar-a-roupa-la-18-tp-e.html": "m-19058420-159979804",
      "equipamento-hoteleiro/18-maquina-de-lavar-roupa-electrica-fagor-18kg-la-18-tpe.html": "m-19058420-159979804",
      "equipamento-hoteleiro/21-triturador-sammic-tr-550-bl.html": "m-3030690-159980158",
      "detergentes/1-drip-quat-ultraconcentrado-2l-8436536083798.html": "dx1004-159978161",
      "utensilios-de-limpeza/40-pano-quickstar-micro-azul-40x38cm-5-panos.html": "v152105-159983126",
      "utensilios-de-limpeza/11-carro-2x25l-com-prensa-vertical.html": "v149092-159983111",
      // Inactive on the old site, same product on the new one
      "utensilios-de-limpeza/160-papel-higienico-domestico-renova-2f-96-rolos.html": "pb3010-159981433",
      "x/230-clax-100-22a1-20l.html": "7518139-159977048",
    }
    for (const [old, handle] of Object.entries(cases)) {
      expect(r(`/base/${old}`), old).toBe(`/pt/products/${handle}`)
    }
  })
  it("keeps the category fallback when nothing equivalent is on sale, unknown ids → the catalogue", () => {
    expect(r("/base/equipamento-hoteleiro/23-fogao-com-forno-a-gas-fagor-cg9-61h.html")).toBe(
      "/pt/categories/equipamento-hoteleiro"
    )
    expect(r("/base/maquinas-de-limpeza/32-rotativa-monodisco-nilfisk-fm-400-l.html")).toBe(
      "/pt/categories/maquinas-de-limpeza"
    )
    expect(r("/base/x/99999-nada.html")).toBe("/pt/store")
    expect(r("/base/index.php?id_product=99999&controller=product")).toBe("/pt/store")
  })
  it("maps old attachment (technical sheet) URLs to the product they belonged to", () => {
    const a = (id: number) => r(`/base/index.php?controller=attachment&id_attachment=${id}`)
    expect(a(41)).toBe("/pt/products/n107421144-216053201") // VP300 ECO
    expect(a(51)).toBe("/pt/products/v152105-159983126") // QuickStar Micro azul → MicronQuick
    expect(a(71)).toBe("/pt/products/v122956-159982909") // Recarga esfregona MicroCott
    expect(a(27)).toBe("/pt/products/v121564-159982874") // Origo 100 FX
    expect(a(80)).toBe("/pt/products/m-19058420-159979804") // LA-18 TP E
    expect(a(56)).toBe("/pt/products/v145631-162696645") // Seca Mais
    // An attachment we cannot place → the catalogue, not the home page.
    expect(a(9999)).toBe("/pt/store")
    expect(r("/base/index.php?controller=attachment")).toBe("/pt/store")
  })
  it("maps categories, CMS and system pages", () => {
    expect(r("/base/3-detergentes")).toBe("/pt/categories/detergentes")
    expect(r("/base/16-carros-de-limpeza")).toBe("/pt/categories/utensilios-limpeza")
    expect(r("/base/index.php?id_category=15&controller=category")).toBe("/pt/categories/maquinas-de-limpeza")
    expect(r("/base/content/4-about-us")).toBe("/pt/sobre-nos")
    expect(r("/base/index.php?id_cms=4&controller=cms")).toBe("/pt/sobre-nos")
    expect(r("/base/content/3-terms-and-conditions-of-use")).toBe("/pt/content/terms-of-use")
    expect(r("/base/contact-us")).toBe("/pt/contact")
    expect(r("/base/stores")).toBe("/pt/a-nossa-loja")
    expect(r("/base/stores/")).toBe("/pt/a-nossa-loja")
    expect(r("/base/lojas")).toBe("/pt/a-nossa-loja")
    expect(r("/base/index.php?controller=stores")).toBe("/pt/a-nossa-loja")
    expect(r("/base/login")).toBe("/pt/account")
    expect(r("/base/")).toBe("/pt")
    expect(r("/base")).toBe("/pt")
    expect(r("/base/index.php?controller=contact")).toBe("/pt/contact")
    expect(r("/base/module/productcontact/interest")).toBe("/pt/contact")
  })
  it("maps brand (manufacturer/supplier) pages to the brand pages", () => {
    expect(r("/base/manufacturer")).toBe("/pt/marcas")
    expect(r("/base/fabricantes")).toBe("/pt/marcas")
    expect(r("/base/index.php?controller=manufacturer")).toBe("/pt/marcas")
    expect(r("/base/index.php?id_manufacturer=3&controller=manufacturer")).toBe("/pt/marcas")
    expect(r("/base/index.php?id_supplier=2&controller=supplier")).toBe("/pt/marcas")
    expect(r("/base/2_fagor")).toBe("/pt/marcas/fagor")
    expect(r("/base/7_vileda_swep")).toBe("/pt/marcas/vileda-swep")
    expect(r("/base/1__diversey")).toBe("/pt/marcas/diversey")
    // An unknown brand → the brand index, never the catalogue search.
    expect(r("/base/9_tork")).toBe("/pt/marcas")
    // Categories ({id}-{slug}) are unaffected.
    expect(r("/base/3-detergentes")).toBe("/pt/categories/detergentes")
  })
  it("maps searches and falls back to the catalogue", () => {
    expect(r("/base/search?search_query=luvas+nitrilo")).toBe("/pt/results/luvas%20nitrilo")
    expect(r("/base/something/odd")).toBe("/pt/store")
  })
  it("covers every product of the crawl (70 active + 104 inactive + 1 deleted)", () => {
    expect(Object.keys(LEGACY_PRODUCTS).length).toBe(175)
    for (const path of Object.values(LEGACY_PRODUCTS)) {
      expect(path).toMatch(/^\/(products|categories)\/[a-z0-9-]+$/)
    }
    for (const id of Object.values(LEGACY_ATTACHMENTS)) {
      expect(LEGACY_PRODUCTS[id]).toBeDefined()
    }
  })
})
