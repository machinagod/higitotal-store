import os from "os"
import path from "path"
import { getScraper } from "./registry"
import { ScrapeResult, ScrapeTarget } from "./types"

export type CrawlOptions = {
  concurrency?: number
  maxRetries?: number
  requestTimeoutSecs?: number
}

/**
 * Crawl a batch of targets with Crawlee's CheerioCrawler — it handles
 * concurrency, retries, session rotation and (if configured) proxies for us, so
 * the module only owns *scheduling* (which URLs are due) and *parsing* (per-site
 * scraper strategies). Crawlee is ESM-only, so it's pulled in via dynamic
 * import (this module compiles to CJS, `module: node16`). Storage is kept
 * in-memory (`persistStorage: false`) — we don't want a crawl queue on disk in
 * the server process.
 *
 * For JS-rendered competitors, swap CheerioCrawler for PlaywrightCrawler here
 * (same handler shape) and gate it per-competitor via a scraper key.
 *
 * Returns a map of competitorProductId → ScrapeResult.
 */
export async function crawlTargets(
  targets: ScrapeTarget[],
  opts: CrawlOptions = {}
): Promise<Map<string, ScrapeResult>> {
  const results = new Map<string, ScrapeResult>()
  if (!targets.length) return results

  // Container hardening: keep Crawlee's storage in a writable tmp dir and never
  // purge on start — the app dir is read-only / non-writable in the prod image,
  // and the on-disk default would otherwise throw at startup.
  if (!process.env.CRAWLEE_STORAGE_DIR) {
    process.env.CRAWLEE_STORAGE_DIR = path.join(os.tmpdir(), "crawlee-storage")
  }
  if (process.env.CRAWLEE_PURGE_ON_START == null) {
    process.env.CRAWLEE_PURGE_ON_START = "false"
  }

  // Record an error for every target not already resolved, so a setup failure
  // surfaces as a stored observation (visible in the admin) instead of a 500.
  const failAll = (msg: string) => {
    for (const t of targets) {
      if (!results.has(t.competitorProductId)) {
        results.set(t.competitorProductId, { status: "error", errorMessage: msg })
      }
    }
  }

  let crawlee: typeof import("crawlee")
  try {
    crawlee = await import("crawlee")
  } catch (e: any) {
    failAll(`scrape engine unavailable: ${e?.message ?? e}`)
    return results
  }
  const { CheerioCrawler, Configuration } = crawlee

  try {
    const crawler = new CheerioCrawler(
    {
      maxConcurrency: opts.concurrency ?? 4,
      maxRequestRetries: opts.maxRetries ?? 2,
      requestHandlerTimeoutSecs: opts.requestTimeoutSecs ?? 30,
      // Be a polite citizen by default.
      maxRequestsPerMinute: 120,
      async requestHandler({ request, $, body }) {
        const cpId = request.userData.competitorProductId as string
        const scraper = getScraper(request.userData.scraperKey as string)
        const html =
          typeof body === "string"
            ? body
            : Buffer.isBuffer(body)
            ? body.toString("utf-8")
            : ""
        const jsonLd = collectJsonLd($)
        try {
          results.set(
            cpId,
            await scraper.parse({
              url: request.url,
              html,
              jsonLd,
              $,
              hints: request.userData.hints as Record<string, any> | undefined,
            })
          )
        } catch (e: any) {
          results.set(cpId, {
            status: "error",
            errorMessage: e?.message ?? "parse failed",
          })
        }
      },
      failedRequestHandler({ request }, error) {
        const cpId = request.userData.competitorProductId as string
        results.set(cpId, {
          status: "error",
          errorMessage: (error as Error)?.message ?? "request failed",
        })
      },
    },
    new Configuration({ persistStorage: false, purgeOnStart: false })
  )

    await crawler.run(
      targets.map((t) => ({
        url: t.url,
        uniqueKey: `${t.competitorProductId}:${t.url}`,
        userData: {
          competitorProductId: t.competitorProductId,
          scraperKey: t.scraperKey,
          hints: t.hints,
        },
      }))
    )
    // Release Crawlee's autoscaled pool/event listeners between ticks.
    await crawler.teardown()
  } catch (e: any) {
    failAll(`scrape engine error: ${e?.message ?? e}`)
  }

  return results
}

function collectJsonLd($: any): any[] {
  const out: any[] = []
  try {
    $('script[type="application/ld+json"]').each((_: number, el: any) => {
      const txt = $(el).text()
      if (!txt) return
      try {
        out.push(JSON.parse(txt))
      } catch {
        /* ignore malformed JSON-LD blocks */
      }
    })
  } catch {
    /* no cheerio context */
  }
  return out
}
