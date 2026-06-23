import {
  getDiscoveryAgent,
  setDiscoveryAgent,
  isDiscoveryConfigured,
  noopDiscoveryAgent,
} from "../discovery/registry"

describe("discovery agent registry", () => {
  afterEach(() => setDiscoveryAgent(noopDiscoveryAgent))

  it("defaults to the no-op agent", async () => {
    expect(getDiscoveryAgent().key).toBe("noop")
    expect(isDiscoveryConfigured()).toBe(false)
    expect(await noopDiscoveryAgent.findStoresForProduct({} as any)).toEqual([])
    expect(await noopDiscoveryAgent.discoverCatalog({} as any)).toEqual([])
    expect(await noopDiscoveryAgent.generateParser({} as any)).toBeNull()
  })

  it("activates a configured agent", () => {
    const agent = {
      key: "test",
      findStoresForProduct: jest.fn(),
      discoverCatalog: jest.fn(),
      generateParser: jest.fn(),
    }
    setDiscoveryAgent(agent)
    expect(getDiscoveryAgent()).toBe(agent)
    expect(isDiscoveryConfigured()).toBe(true)
  })
})
