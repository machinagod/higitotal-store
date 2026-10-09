import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const loadConfig = () => import("../config")

describe("config", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("uses NEXT_PUBLIC_MEDUSA_BACKEND_URL when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDUSA_BACKEND_URL", "https://backend.example.test")

    const { MEDUSA_BACKEND_URL } = await loadConfig()

    expect(MEDUSA_BACKEND_URL).toBe("https://backend.example.test")
  })

  it("falls back to the local Medusa port when unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDUSA_BACKEND_URL", "")

    const { MEDUSA_BACKEND_URL } = await loadConfig()

    expect(MEDUSA_BACKEND_URL).toBe("http://localhost:9000")
  })

  it("points the SDK at the resolved backend URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_MEDUSA_BACKEND_URL", "https://backend.example.test")

    const { sdk } = await loadConfig()

    expect(sdk.client).toBeDefined()
    expect(sdk.store).toBeDefined()
  })
})
