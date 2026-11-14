import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * tailwind.config.js scans only the @medusajs/ui components the storefront
 * renders (not the whole kit), to keep unused utilities out of the global
 * stylesheet. This guards that list: a component imported from
 * "@medusajs/ui" in src/ — or one it imports internally — that is missing
 * from the content glob would silently render unstyled.
 */
const root = path.resolve(__dirname, "../../..")
const require = createRequire(__filename)
const uiEsm = path.join(root, "node_modules/@medusajs/ui/dist/esm")

function scannedComponents(): string[] {
  const config = require(path.join(root, "tailwind.config.js"))
  const glob = (config.content as string[]).find((g) =>
    g.includes("@medusajs/ui/dist/esm/components/")
  )
  expect(glob, "tailwind content glob for @medusajs/ui").toBeDefined()
  const list = glob!.match(/components\/\{([^}]+)\}/)?.[1]
  expect(list, glob).toBeDefined()
  return list!.split(",")
}

/** Value imports (not `import type`) from "@medusajs/ui" anywhere in src/. */
function importedNames(): Set<string> {
  const names = new Set<string>()
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== "__tests__") walk(p)
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        const src = fs.readFileSync(p, "utf8")
        for (const m of Array.from(
          src.matchAll(
            /import\s+(type\s+)?\{([^}]*)\}\s*from\s*["']@medusajs\/ui["']/g
          )
        )) {
          if (m[1]) continue
          for (const spec of m[2].split(",")) {
            const name = spec.trim().split(/\s+as\s+/)[0]
            if (name && !name.startsWith("type ")) names.add(name)
          }
        }
      }
    }
  }
  walk(path.join(root, "src"))
  return names
}

/** Component directories the given ones import (relative imports), transitively. */
function componentClosure(start: string[]): Set<string> {
  const seen = new Set<string>()
  const queue = [...start]
  while (queue.length) {
    const dir = queue.pop()!
    if (seen.has(dir)) continue
    seen.add(dir)
    const abs = path.join(uiEsm, "components", dir)
    for (const f of fs.readdirSync(abs).filter((f) => f.endsWith(".js"))) {
      const src = fs.readFileSync(path.join(abs, f), "utf8")
      for (const m of Array.from(
        src.matchAll(/from\s*"\.\.\/([a-z-]+)(?:\/[^"]*)?"/g)
      )) {
        if (fs.existsSync(path.join(uiEsm, "components", m[1]))) queue.push(m[1])
      }
    }
  }
  return seen
}

describe("tailwind content: @medusajs/ui components", () => {
  it("scans every component the storefront uses, and their internal deps", () => {
    // Exported name → component directory, from the esm barrel.
    const index = fs.readFileSync(path.join(uiEsm, "index.js"), "utf8")
    const dirOf = new Map<string, string>()
    for (const m of Array.from(
      index.matchAll(
        /export\s*\{([^}]+)\}\s*from\s*"\.\/components\/([a-z-]+)"/g
      )
    )) {
      for (const n of m[1].split(",")) dirOf.set(n.trim(), m[2])
    }

    const used = Array.from(importedNames())
      .map((n) => dirOf.get(n))
      .filter((d): d is string => !!d)
    expect(used.length).toBeGreaterThan(0)

    const scanned = new Set(scannedComponents())
    const missing = Array.from(componentClosure(used)).filter((d) => !scanned.has(d))
    expect(missing, "add these to MEDUSA_UI_COMPONENTS in tailwind.config.js").toEqual([])
  })

  it("lists only component directories that exist", () => {
    for (const dir of scannedComponents()) {
      expect(fs.existsSync(path.join(uiEsm, "components", dir)), dir).toBe(true)
    }
  })
})
