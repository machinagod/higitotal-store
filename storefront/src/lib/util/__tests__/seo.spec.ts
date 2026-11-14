import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock the data layer so the SEO helpers never touch the network.
vi.mock("@lib/data/regions", () => ({
  listRegions: vi.fn(),
}))

import { listRegions } from "@lib/data/regions"
import {
  absoluteUrl,
  canonicalUrl,
  DEFAULT_OG_IMAGE,
  getCanonicalCountryCode,
  pageMetadata,
} from "../seo"

const mockedListRegions = vi.mocked(listRegions)

const regions = [
  { countries: [{ iso_2: "dk" }, { iso_2: "se" }] },
  { countries: [{ iso_2: "fr" }] },
] as any

describe("absoluteUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://higitotal.test/"
  })
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL
  })

  it("joins a relative path onto the base, trimming a trailing slash", () => {
    expect(absoluteUrl("/store")).toBe("https://higitotal.test/store")
  })

  it("adds a leading slash when missing", () => {
    expect(absoluteUrl("store")).toBe("https://higitotal.test/store")
  })

  it("defaults to the site root", () => {
    expect(absoluteUrl()).toBe("https://higitotal.test/")
  })

  it("falls back to the localhost base when NEXT_PUBLIC_BASE_URL is unset", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL
    expect(absoluteUrl("/x")).toBe("https://localhost:8000/x")
  })
})

describe("getCanonicalCountryCode", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_DEFAULT_REGION
    vi.clearAllMocks()
  })

  it("prefers NEXT_PUBLIC_DEFAULT_REGION when it maps to a real region", async () => {
    process.env.NEXT_PUBLIC_DEFAULT_REGION = "FR"
    mockedListRegions.mockResolvedValue(regions)
    expect(await getCanonicalCountryCode()).toBe("fr")
  })

  it("falls back to the first available country when the default is unknown", async () => {
    process.env.NEXT_PUBLIC_DEFAULT_REGION = "us"
    mockedListRegions.mockResolvedValue(regions)
    expect(await getCanonicalCountryCode()).toBe("dk")
  })

  it("uses the first country when no default is configured", async () => {
    mockedListRegions.mockResolvedValue(regions)
    expect(await getCanonicalCountryCode()).toBe("dk")
  })

  it("falls back to the configured default when the backend throws", async () => {
    process.env.NEXT_PUBLIC_DEFAULT_REGION = "es"
    mockedListRegions.mockRejectedValue(new Error("backend down"))
    expect(await getCanonicalCountryCode()).toBe("es")
  })

  it("falls back to 'dk' when there are no regions and no default", async () => {
    mockedListRegions.mockResolvedValue([] as any)
    expect(await getCanonicalCountryCode()).toBe("dk")
  })

  it("tolerates a null regions response", async () => {
    mockedListRegions.mockResolvedValue(null as any)
    expect(await getCanonicalCountryCode()).toBe("dk")
  })

  it("skips regions that carry no countries", async () => {
    mockedListRegions.mockResolvedValue([
      { countries: undefined },
      { countries: [{ iso_2: "it" }] },
    ] as any)
    expect(await getCanonicalCountryCode()).toBe("it")
  })

  it("falls back to 'dk' when the backend throws and no default is set", async () => {
    mockedListRegions.mockRejectedValue(new Error("boom"))
    expect(await getCanonicalCountryCode()).toBe("dk")
  })
})

describe("canonicalUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://higitotal.test"
    process.env.NEXT_PUBLIC_DEFAULT_REGION = "dk"
    mockedListRegions.mockResolvedValue(regions)
  })
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL
    delete process.env.NEXT_PUBLIC_DEFAULT_REGION
    vi.clearAllMocks()
  })

  it("prefixes the canonical country and strips leading slashes", async () => {
    expect(await canonicalUrl("/products/foo")).toBe(
      "https://higitotal.test/dk/products/foo"
    )
    expect(await canonicalUrl("products/foo")).toBe(
      "https://higitotal.test/dk/products/foo"
    )
  })

  it("returns the country home for an empty path", async () => {
    expect(await canonicalUrl("")).toBe("https://higitotal.test/dk")
  })
})

describe("pageMetadata", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://higitotal.test"
    process.env.NEXT_PUBLIC_DEFAULT_REGION = "dk"
    mockedListRegions.mockResolvedValue(regions)
  })
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL
    delete process.env.NEXT_PUBLIC_DEFAULT_REGION
    vi.clearAllMocks()
  })

  it("builds a self-canonical page with the default social image", async () => {
    const meta = await pageMetadata({
      path: "contact",
      title: "Contactos",
      description: "Fale connosco.",
    })
    expect(meta).toEqual({
      title: { absolute: "Contactos · Higitotal" },
      description: "Fale connosco.",
      alternates: { canonical: "https://higitotal.test/dk/contact" },
      openGraph: {
        type: "website",
        title: "Contactos · Higitotal",
        description: "Fale connosco.",
        url: "https://higitotal.test/dk/contact",
        images: [DEFAULT_OG_IMAGE],
      },
    })
  })

  it("keeps a query in the canonical and the page's own images", async () => {
    const meta = await pageMetadata({
      path: "store?page=2",
      title: "Catálogo — página 2",
      description: "d",
      images: ["https://cdn.test/a.jpg"],
    })
    expect(meta.alternates?.canonical).toBe("https://higitotal.test/dk/store?page=2")
    expect((meta.openGraph as any).images).toEqual(["https://cdn.test/a.jpg"])
  })

  it("drops the site name from a title that would exceed 60 characters", async () => {
    const long = "Máquina de Lavar Loiça de Capota Profissional com Doseador X"
    const meta = await pageMetadata({ path: "products/x", title: long, description: "d" })
    expect(meta.title).toEqual({ absolute: long })
    expect(meta.openGraph?.title).toBe(long)
  })

  it("falls back to the default image for an empty list", async () => {
    const meta = await pageMetadata({ path: "", title: "T", description: "d", images: [] })
    expect((meta.openGraph as any).images).toEqual([DEFAULT_OG_IMAGE])
  })
})
