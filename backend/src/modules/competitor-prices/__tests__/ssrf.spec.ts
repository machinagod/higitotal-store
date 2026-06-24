import { isBlockedAddress, assertPublicUrl, type DnsResolver } from "../scrapers/ssrf"

const resolveTo =
  (...addresses: string[]): DnsResolver =>
  async () =>
    addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 }))

describe("isBlockedAddress", () => {
  it("blocks IPv4 private / loopback / link-local / CGNAT ranges", () => {
    for (const ip of [
      "0.0.0.0",
      "10.1.2.3",
      "127.0.0.1",
      "169.254.169.254", // cloud metadata
      "172.16.5.5",
      "172.31.255.255",
      "192.168.1.1",
      "100.64.0.1",
    ]) {
      expect(isBlockedAddress(ip)).toBe(true)
    }
  })

  it("allows a public IPv4 address", () => {
    expect(isBlockedAddress("93.184.216.34")).toBe(false)
    expect(isBlockedAddress("172.32.0.1")).toBe(false) // just outside 172.16/12
    expect(isBlockedAddress("100.63.0.1")).toBe(false) // just outside 100.64/10
  })

  it("blocks IPv6 loopback / unspecified / ULA / link-local and mapped v4", () => {
    for (const ip of ["::1", "::", "fc00::1", "fd12::1", "fe80::1", "::ffff:127.0.0.1"]) {
      expect(isBlockedAddress(ip)).toBe(true)
    }
  })

  it("allows a public IPv6 address (incl. mapped public v4)", () => {
    expect(isBlockedAddress("2606:2800:220:1:248:1893:25c8:1946")).toBe(false)
    expect(isBlockedAddress("::ffff:93.184.216.34")).toBe(false)
  })

  it("blocks anything that isn't a parseable IP", () => {
    expect(isBlockedAddress("not-an-ip")).toBe(true)
  })
})

describe("assertPublicUrl", () => {
  it("rejects a non-http(s) scheme", async () => {
    await expect(assertPublicUrl("file:///etc/passwd", resolveTo("1.2.3.4"))).rejects.toThrow(
      "blocked scheme"
    )
  })

  it("rejects a malformed URL", async () => {
    await expect(assertPublicUrl("http://", resolveTo("1.2.3.4"))).rejects.toThrow("invalid URL")
  })

  it("rejects a literal private-IP host without a DNS lookup", async () => {
    const resolver = jest.fn()
    await expect(assertPublicUrl("http://127.0.0.1/admin", resolver as any)).rejects.toThrow(
      "blocked address"
    )
    expect(resolver).not.toHaveBeenCalled()
  })

  it("passes a literal public-IP host", async () => {
    const u = await assertPublicUrl("https://93.184.216.34/p", resolveTo())
    expect(u.hostname).toBe("93.184.216.34")
  })

  it("rejects a bracketed IPv6 loopback literal", async () => {
    await expect(assertPublicUrl("http://[::1]:9000/", resolveTo())).rejects.toThrow(
      "blocked address"
    )
  })

  it("rejects a hostname that resolves to a private address", async () => {
    await expect(
      assertPublicUrl("http://evil.example/sitemap.xml", resolveTo("10.0.0.5"))
    ).rejects.toThrow("blocked address")
  })

  it("rejects a hostname with no DNS records", async () => {
    await expect(assertPublicUrl("http://void.example/", resolveTo())).rejects.toThrow(
      "no DNS records"
    )
  })

  it("passes a hostname that resolves to a public address", async () => {
    const u = await assertPublicUrl("https://store.es/sitemap.xml", resolveTo("93.184.216.34"))
    expect(u.pathname).toBe("/sitemap.xml")
  })
})
