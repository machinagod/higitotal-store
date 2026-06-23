import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { COMPETITOR_PRICES_MODULE } from "../modules/competitor-prices"

/**
 * Bootstrap the competitor-prices module from the ES+PT discovery pass over our
 * top-100 sellers (see competitor-landscape.md):
 *   • creates the discovered competitors (with a suggested scraper_key + catalog
 *     discovery enabled), and
 *   • creates product_watch rows for the BRANDED top sellers (manufacturer SKUs
 *     a competitor could carry — private-label DC/DL/DA/DB refs are excluded).
 *
 * Idempotent. DRY-RUN by default; pass `commit` to write (DB-mutating — run only
 * against a safe DB / the deployed backend):
 *   npx medusa exec ./src/scripts/seed-competitor-intelligence.ts commit
 */
const COMPETITORS: Array<{
  handle: string
  name: string
  base_url: string
  scraper_key: string
}> = [
  // ── Portugal ──
  { handle: "exaclean-pt", name: "Exaclean (PT)", base_url: "https://www.exaclean.pt", scraper_key: "generic-jsonld" },
  { handle: "progelcone-pt", name: "Progelcone (PT)", base_url: "https://www.progelcone.pt", scraper_key: "config-selectors" },
  { handle: "moreiracarneiro-pt", name: "Moreira & Carneiro (PT)", base_url: "https://moreiracarneiro.pt", scraper_key: "generic-jsonld" },
  { handle: "higienaroma-pt", name: "Higienaroma (PT)", base_url: "https://www.higienaroma.pt", scraper_key: "generic-jsonld" },
  { handle: "grupoapr-pt", name: "Grupo APR (PT)", base_url: "https://grupoapr.eu", scraper_key: "generic-jsonld" },
  { handle: "csh-pt", name: "CSH (PT)", base_url: "https://www.csh.pt", scraper_key: "generic-jsonld" },
  { handle: "lusohigin-pt", name: "Lusohigin (PT)", base_url: "https://www.lusohigin.pt", scraper_key: "config-selectors" },
  { handle: "climprofesional-pt", name: "Clim Profesional (PT)", base_url: "https://www.climprofesional.com/pt", scraper_key: "generic-jsonld" },
  // ── Spain ──
  { handle: "batoy-es", name: "Distribuciones Batoy (ES)", base_url: "https://distribucionesbatoy.com", scraper_key: "prestashop" },
  { handle: "bunzlspain-es", name: "Bunzl Spain (ES)", base_url: "https://store.bunzlspain.com", scraper_key: "generic-jsonld" },
  { handle: "prismasl-es", name: "Prisma SL (ES)", base_url: "https://catalogo.prismasl.com", scraper_key: "config-selectors" },
  { handle: "pedrosa-es", name: "Pedrosa (ES)", base_url: "https://catalogo.pedrosa.net", scraper_key: "config-selectors" },
  { handle: "suministrostorras-es", name: "Suministros Torras (ES)", base_url: "https://www.suministrostorras.com", scraper_key: "generic-jsonld" },
  { handle: "jucarsa-es", name: "Jucarsa (ES)", base_url: "https://jucarsa.es", scraper_key: "generic-jsonld" },
  { handle: "powerval-es", name: "Powerval (ES)", base_url: "https://www.powerval.es", scraper_key: "generic-jsonld" },
  { handle: "agrieuro-es", name: "AgriEuro (ES)", base_url: "https://www.agrieuro.es", scraper_key: "generic-jsonld" },
]

// Branded top-sellers (our variant SKU = Moloni reference). Diversey, Vileda/
// SWEP, Nilfisk/TASKI/Fagor/Sammic + branded paper. Extend as needed.
const WATCH_SKUS: string[] = [
  // Diversey
  "7010074", "7513452", "7518139", "7518140", "6973274", "6973357", "7522295",
  "100882635", "7519274", "7508266", "100940173", "6973310", "7516657",
  "100842643", "100842645", "7512925", "7509166", "7517104", "7514134",
  "7518919", "101101842", "7516659", "7010131", "7522275", "7518898", "7521868",
  "7515206", "7515511", "7508916", "7516997", "100890635",
  // Vileda / SWEP
  "V140695",
  // Machines
  "7524728", "9310217", "M-19058423", "M-19071868", "N58002000", "NU919070",
  "M-1303180",
]

export default async function seedCompetitorIntelligence({
  container,
  args,
}: ExecArgs) {
  const commit = (args ?? []).includes("commit")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const svc: any = container.resolve(COMPETITOR_PRICES_MODULE)

  logger.info(
    `[seed-competitor-intel] ${commit ? "COMMIT" : "DRY-RUN"} — ${COMPETITORS.length} competitors, ${WATCH_SKUS.length} watch SKUs`
  )

  // 1. Competitors.
  let compCreated = 0
  for (const c of COMPETITORS) {
    const [existing] = await svc.listCompetitors({ handle: c.handle })
    if (existing) continue
    if (commit) {
      await svc.createCompetitors({ ...c, catalog_discovery_enabled: true })
    }
    compCreated++
  }
  logger.info(`[seed-competitor-intel] competitors ${commit ? "created" : "to create"}=${compCreated}`)

  // 2. Resolve our products by variant SKU.
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "variants.sku"],
    pagination: { take: 5000, skip: 0 },
  })
  const bySku = new Map<string, any>()
  for (const p of products) {
    for (const v of p.variants ?? []) {
      if (v.sku) bySku.set(v.sku, p)
    }
  }

  // 3. Product watches.
  let watchCreated = 0
  let watchExisted = 0
  let missing = 0
  for (const sku of WATCH_SKUS) {
    const p = bySku.get(sku)
    if (!p) {
      missing++
      logger.warn(`[seed-competitor-intel] no product for SKU ${sku}`)
      continue
    }
    const [w] = await svc.listProductWatches({ product_id: p.id })
    if (w) {
      watchExisted++
      continue
    }
    if (commit) {
      await svc.createProductWatches({
        product_id: p.id,
        product_sku: sku,
        title: p.title,
      })
    }
    watchCreated++
  }
  logger.info(
    `[seed-competitor-intel] watches ${commit ? "created" : "to create"}=${watchCreated} existed=${watchExisted} missing=${missing}`
  )
  if (!commit) {
    logger.info("[seed-competitor-intel] DRY-RUN — pass 'commit' to persist")
  }
}
