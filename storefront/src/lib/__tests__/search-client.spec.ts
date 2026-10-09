import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Stub the adapter so the tests assert how it is wired without any HTTP.
const fakeClient = {
  search: vi.fn(),
  searchForFacetValues: vi.fn(),
  clearCache: vi.fn(),
}
const createInstantSearchAdapter = vi.fn(() => ({ searchClient: fakeClient }))

vi.mock("@medusajs/instantsearch-adapter", () => ({
  createInstantSearchAdapter,
}))

const loadSearchClient = () => import("../search-client")

describe("search-client", () => {
  beforeEach(() => {
    vi.resetModules()
    createInstantSearchAdapter.mockClear()
    vi.stubEnv("NEXT_PUBLIC_MEDUSA_BACKEND_URL", "https://backend.example.test")
    vi.stubEnv("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY", "pk_test_search")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("routes InstantSearch through the backend's POST /store/search", async () => {
    await loadSearchClient()

    expect(createInstantSearchAdapter).toHaveBeenCalledTimes(1)
    expect(createInstantSearchAdapter).toHaveBeenCalledWith({
      baseUrl: "https://backend.example.test",
      path: "/store/search",
      publishableApiKey: "pk_test_search",
    })
  })

  it("exposes the adapter's client for server actions and InstantSearch", async () => {
    const { searchClient, instantSearchClient } = await loadSearchClient()

    expect(searchClient).toBe(fakeClient)
    expect(instantSearchClient).toBe(fakeClient)
  })

  it("queries the logical products index", async () => {
    const { SEARCH_INDEX_NAME } = await loadSearchClient()

    expect(SEARCH_INDEX_NAME).toBe("products")
  })
})
