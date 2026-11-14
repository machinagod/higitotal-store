import { readdirSync, readFileSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { SECTORS } from "@lib/sectors"
import {
  SECTOR_IMAGES,
  sectorImage,
  sectorOgImage,
} from "@modules/sectors/sector-images"

const ASSETS = fileURLToPath(new URL("../assets", import.meta.url))
const MAX_BYTES = 250 * 1024

/** Every image file under assets/ (relative paths, e.g. "og/hotelaria.jpg"). */
function assetFiles(dir = ASSETS, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix + entry.name
    if (entry.isDirectory()) return assetFiles(join(dir, entry.name), `${rel}/`)
    return /\.(webp|jpe?g|png|avif)$/i.test(entry.name) ? [rel] : []
  })
}

describe("sector images", () => {
  it("gives every sector a photo, an OG crop and a non-empty alt", () => {
    for (const s of SECTORS) {
      const image = sectorImage(s.slug)
      expect(image, s.slug).toBeDefined()
      expect(image!.src, s.slug).toBeTruthy()
      expect(image!.og, s.slug).toBeTruthy()
      expect(image!.alt.trim().length, s.slug).toBeGreaterThan(10)
      expect(image!.position, s.slug).toMatch(/^\d{1,3}% \d{1,3}%$/)
    }
  })

  it("has no image for an unknown sector", () => {
    expect(sectorImage("nope")).toBeUndefined()
    expect(sectorOgImage("nope")).toBeUndefined()
  })

  it("only maps known sectors", () => {
    const slugs = new Set(SECTORS.map((s) => s.slug))
    for (const slug of Object.keys(SECTOR_IMAGES)) {
      expect(slugs.has(slug), slug).toBe(true)
    }
  })

  it("ships a 3:2 photo and a 1200×630 OG crop per sector, each under 250 KB", () => {
    const files = new Set(assetFiles())
    for (const s of SECTORS) {
      for (const rel of [`${s.slug}.webp`, `og/${s.slug}.jpg`]) {
        expect(files.has(rel), rel).toBe(true)
      }
    }
    for (const rel of files) {
      expect(statSync(join(ASSETS, rel)).size, rel).toBeLessThan(MAX_BYTES)
    }
  })

  it("credits every asset in CREDITS.md", () => {
    const credits = readFileSync(join(ASSETS, "CREDITS.md"), "utf8")
    for (const rel of assetFiles()) {
      expect(credits, rel).toContain(`\`${rel}\``)
    }
    // Each row names its source page and licence.
    for (const s of SECTORS) {
      const row = credits.split("\n").find((l) => l.includes(`\`${s.slug}.webp\``))
      expect(row, s.slug).toMatch(/https:\/\/(unsplash\.com\/photos|www\.pexels\.com\/photo)\//)
      expect(row, s.slug).toMatch(/(Unsplash|Pexels) License/)
    }
  })
})
