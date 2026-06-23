import {
  CatalogDiscoveryInput,
  DiscoveredListing,
  DiscoveryAgent,
  GeneratedParser,
  ParserGenerationInput,
  ProductDiscoveryInput,
} from "./types"

/**
 * Claude-backed discovery agent (SKELETON). Uses the Anthropic Messages API with
 * the server-side web_search tool to (a) find stores selling a product, (b) find
 * a competitor's product listings, and (c) synthesize a CSS-selector spec for a
 * new site that the `config-selectors` scraper can run.
 *
 * Wire it from a module loader (only when ANTHROPIC_API_KEY is set):
 *
 *   import { setDiscoveryAgent } from "../modules/competitor-prices"
 *   import { createAnthropicDiscoveryAgent } from "../modules/competitor-prices/discovery/anthropic"
 *   if (process.env.ANTHROPIC_API_KEY) {
 *     setDiscoveryAgent(createAnthropicDiscoveryAgent({ apiKey: process.env.ANTHROPIC_API_KEY }))
 *   }
 *
 * Prompts here are intentionally minimal — treat this as the integration point
 * to harden (validation, retries, cost caps, allow-listing competitor domains).
 */
export function createAnthropicDiscoveryAgent(opts: {
  apiKey: string
  model?: string
  maxResults?: number
}): DiscoveryAgent {
  const model = opts.model ?? "claude-sonnet-4-6"
  const maxResults = opts.maxResults ?? 8

  async function ask(prompt: string, useWebSearch = true): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
        ...(useWebSearch
          ? { tools: [{ type: "web_search_20250305", name: "web_search" }] }
          : {}),
      }),
      signal: AbortSignal.timeout(120_000),
    })
    if (!res.ok) {
      throw new Error(`anthropic ${res.status}: ${await res.text()}`)
    }
    const data: any = await res.json()
    return (data.content ?? [])
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n")
  }

  /** Pull the last JSON array/object out of a model response. */
  function extractJson<T>(text: string): T | null {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    const candidate = m ? m[1] : text
    const start = candidate.search(/[[{]/)
    if (start < 0) return null
    try {
      return JSON.parse(candidate.slice(start)) as T
    } catch {
      return null
    }
  }

  return {
    key: "anthropic",

    async findStoresForProduct(
      input: ProductDiscoveryInput
    ): Promise<DiscoveredListing[]> {
      const text = await ask(
        `You are a B2B price-research assistant for a Portuguese professional-hygiene distributor.\n` +
          `Find online stores (prefer Portugal/EU) selling this exact product:\n` +
          `- Title: ${input.title}\n- Brand: ${input.brand ?? "?"}\n- Reference/SKU: ${input.sku ?? "?"}\n- EAN: ${input.ean ?? "?"}\n` +
          `Return ONLY a JSON array (max ${maxResults}) of objects with keys: ` +
          `competitorHandle, competitorName, competitorBaseUrl, url, title, price (decimal string), currencyCode, confidence (0-100), characteristics (object).`
      )
      const rows = extractJson<any[]>(text) ?? []
      return rows.map(normalizeListing)
    },

    async discoverCatalog(
      input: CatalogDiscoveryInput
    ): Promise<DiscoveredListing[]> {
      const text = await ask(
        `Browse the competitor store "${input.competitorHandle}" (${input.baseUrl ?? ""}) and list product listings, ` +
          `prioritising items likely NOT already known. Exclude these known URLs:\n${input.knownUrls.slice(0, 50).join("\n")}\n` +
          `Return ONLY a JSON array (max ${maxResults}) of objects with keys: url, title, brand, sku, ean, price (decimal string), currencyCode, characteristics (object).`
      )
      const rows = extractJson<any[]>(text) ?? []
      return rows.map((r) =>
        normalizeListing({ ...r, competitorHandle: input.competitorHandle, competitorBaseUrl: input.baseUrl })
      )
    },

    async generateParser(
      input: ParserGenerationInput
    ): Promise<GeneratedParser | null> {
      const text = await ask(
        `Given this competitor product page, produce CSS selectors to extract price and metadata for a generic scraper.\n` +
          `URL: ${input.sampleUrl}\n` +
          (input.sampleHtml ? `HTML (truncated):\n${input.sampleHtml.slice(0, 12_000)}\n` : "") +
          `Return ONLY a JSON object: { scraperKey: "config-selectors", hints: { price, originalPrice?, title?, availability?, sku?, ean?, attr?: "text"|"content", currency? }, notes? }.`,
        !input.sampleHtml
      )
      const parsed = extractJson<GeneratedParser>(text)
      if (!parsed?.hints?.price) return null
      return { scraperKey: parsed.scraperKey || "config-selectors", hints: parsed.hints, notes: parsed.notes }
    },
  }

  function normalizeListing(r: any): DiscoveredListing {
    return {
      competitorHandle: String(r.competitorHandle ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      competitorName: r.competitorName,
      competitorBaseUrl: r.competitorBaseUrl,
      url: r.url,
      title: r.title,
      brand: r.brand,
      sku: r.sku,
      ean: r.ean,
      // Price normalization to minor units happens at ingest time.
      price: r.price ?? null,
      currencyCode: r.currencyCode ?? "EUR",
      characteristics: r.characteristics ?? undefined,
      confidence: typeof r.confidence === "number" ? r.confidence : undefined,
    }
  }
}
