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

  const { CheerioCrawler, Configuration } = await import("crawlee")

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
    new Configuration({ persistStorage: false })
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
