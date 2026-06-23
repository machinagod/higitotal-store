/**
 * Minimal Cheerio-like `$` stub for scraper unit tests. Not a spec file.
 *
 * - `selectorMap` maps a CSS selector substring → { text?, attrs? } for the
 *   first matched element. `$(sel).first()` returns an element-like object with
 *   `.text()` / `.attr(name)` / `.length`.
 * - `scripts` is the list of JSON-LD strings returned for the script selector's
 *   `.each(cb)` iteration (used by the engine's collectJsonLd).
 */
export function makeCheerio(opts: {
  selectorMap?: Record<string, { text?: string; attrs?: Record<string, string> }>
  scripts?: string[]
  throwOnSelector?: string
} = {}) {
  const { selectorMap = {}, scripts = [], throwOnSelector } = opts
  const $ = (arg: any) => {
    if (arg && typeof arg === "object" && "__txt" in arg) {
      return { text: () => arg.__txt }
    }
    const sel = String(arg)
    if (throwOnSelector && sel.includes(throwOnSelector)) {
      throw new Error("selector boom")
    }
    if (sel.includes('script[type="application/ld+json"]')) {
      return {
        each: (cb: (i: number, el: any) => void) =>
          scripts.forEach((s, i) => cb(i, { __txt: s })),
      }
    }
    const key = Object.keys(selectorMap).find((k) => sel.includes(k))
    const hit = key ? selectorMap[key] : undefined
    const el = {
      length: hit ? 1 : 0,
      text: () => hit?.text ?? "",
      attr: (name: string) => hit?.attrs?.[name],
    }
    return { ...el, first: () => el }
  }
  return $
}
