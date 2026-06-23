import { DiscoveryAgent } from "./types"

/**
 * Holder for the active discovery agent. Defaults to a no-op so the discovery
 * jobs are inert until a real agent (e.g. the Anthropic skeleton, or a Claude
 * Agent SDK routine) is wired in from a module loader via `setDiscoveryAgent`.
 */
export const noopDiscoveryAgent: DiscoveryAgent = {
  key: "noop",
  async findStoresForProduct() {
    return []
  },
  async discoverCatalog() {
    return []
  },
  async generateParser() {
    return null
  },
}

let active: DiscoveryAgent = noopDiscoveryAgent

export function setDiscoveryAgent(agent: DiscoveryAgent): void {
  active = agent
}

export function getDiscoveryAgent(): DiscoveryAgent {
  return active
}

export function isDiscoveryConfigured(): boolean {
  return active.key !== "noop"
}
