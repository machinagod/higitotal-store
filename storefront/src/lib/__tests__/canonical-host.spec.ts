import { describe, expect, it } from "vitest"

import { canonicalHostRedirect } from "../canonical-host"

const env = { CANONICAL_HOST: "www.higitotal.pt" }

describe("canonicalHostRedirect", () => {
  it("is a no-op until CANONICAL_HOST is set", () => {
    expect(canonicalHostRedirect("store.higitotal.pt", "/pt", {})).toBeNull()
  })

  it("sends the alias hosts to the same path and query on www", () => {
    expect(canonicalHostRedirect("store.higitotal.pt", "/pt/products/x?pedido=1", env)).toBe(
      "https://www.higitotal.pt/pt/products/x?pedido=1"
    )
    expect(canonicalHostRedirect("higitotal.pt", "/base/3-detergentes", env)).toBe(
      "https://www.higitotal.pt/base/3-detergentes"
    )
    expect(canonicalHostRedirect("Store.Higitotal.pt:443", "/", env)).toBe("https://www.higitotal.pt/")
  })

  it("leaves the canonical host, localhost and Railway's own domain alone", () => {
    expect(canonicalHostRedirect("www.higitotal.pt", "/pt", env)).toBeNull()
    expect(canonicalHostRedirect("localhost:8000", "/pt", env)).toBeNull()
    expect(canonicalHostRedirect("storefront-production-5c1d.up.railway.app", "/pt", env)).toBeNull()
  })

  it("honours an explicit alias list", () => {
    const e = { ...env, CANONICAL_REDIRECT_HOSTS: "old.example.pt" }
    expect(canonicalHostRedirect("store.higitotal.pt", "/pt", e)).toBeNull()
    expect(canonicalHostRedirect("old.example.pt", "/pt", e)).toBe("https://www.higitotal.pt/pt")
  })
})
