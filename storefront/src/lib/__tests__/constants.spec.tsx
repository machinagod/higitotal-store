import { describe, expect, it } from "vitest"

import {
  isManual,
  isPaypal,
  isStripe,
  noDivisionCurrencies,
  paymentInfoMap,
} from "../constants"

describe("paymentInfoMap", () => {
  it("has a title and icon for every configured provider", () => {
    const providers = Object.keys(paymentInfoMap)

    expect(providers).toEqual(
      expect.arrayContaining([
        "pp_stripe_stripe",
        "pp_stripe-ideal_stripe",
        "pp_stripe-bancontact_stripe",
        "pp_paypal_paypal",
        "pp_system_default",
      ])
    )
    for (const provider of providers) {
      expect(paymentInfoMap[provider].title).toEqual(expect.any(String))
      expect(paymentInfoMap[provider].icon).toBeTruthy()
    }
  })
})

describe("provider predicates", () => {
  it("isStripe matches native Stripe card payments only", () => {
    expect(isStripe("pp_stripe_stripe")).toBe(true)
    expect(isStripe("pp_stripe-ideal_stripe")).toBe(false)
    expect(isStripe(undefined)).toBeUndefined()
  })

  it("isPaypal matches PayPal providers", () => {
    expect(isPaypal("pp_paypal_paypal")).toBe(true)
    expect(isPaypal("pp_stripe_stripe")).toBe(false)
    expect(isPaypal(undefined)).toBeUndefined()
  })

  it("isManual matches the system default provider", () => {
    expect(isManual("pp_system_default")).toBe(true)
    expect(isManual("pp_stripe_stripe")).toBe(false)
    expect(isManual(undefined)).toBeUndefined()
  })
})

describe("noDivisionCurrencies", () => {
  it("lists zero-decimal currencies in lowercase ISO codes", () => {
    expect(noDivisionCurrencies).toContain("jpy")
    expect(noDivisionCurrencies).not.toContain("eur")
    for (const code of noDivisionCurrencies) {
      expect(code).toMatch(/^[a-z]{3}$/)
    }
  })
})
