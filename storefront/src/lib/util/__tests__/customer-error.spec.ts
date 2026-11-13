import { describe, expect, it } from "vitest"

import {
  CUSTOMER_ERROR_MESSAGES as M,
  customerErrorMessage,
} from "../customer-error"

describe("customerErrorMessage", () => {
  it("maps Medusa's invalid-credentials error", () => {
    expect(customerErrorMessage(new Error("Invalid email or password"), "login")).toBe(
      M.invalidCredentials
    )
  })

  it("treats a 401 on login as invalid credentials", () => {
    const err = Object.assign(new Error("Unauthorized"), { status: 401 })
    expect(customerErrorMessage(err, "login")).toBe(M.invalidCredentials)
  })

  it("does not call a 401 outside login a credentials error", () => {
    const err = Object.assign(new Error("Unauthorized"), { status: 401 })
    expect(customerErrorMessage(err)).toBe(M.generic)
  })

  it("maps duplicate-identity and duplicate-customer errors", () => {
    expect(
      customerErrorMessage(new Error("Identity with email already exists"), "signup")
    ).toBe(M.emailTaken)
    expect(
      customerErrorMessage(
        new Error("Customer with email: a@b.pt, already exists."),
        "signup"
      )
    ).toBe(M.emailTaken)
  })

  it("accepts strings and plain objects", () => {
    expect(customerErrorMessage("Error: Invalid email or password")).toBe(
      M.invalidCredentials
    )
    expect(customerErrorMessage({ message: "already exists" })).toBe(M.emailTaken)
  })

  it("falls back to a generic message", () => {
    expect(customerErrorMessage(new Error("fetch failed"))).toBe(M.generic)
    expect(customerErrorMessage(undefined)).toBe(M.generic)
    expect(customerErrorMessage(null, "signup")).toBe(M.generic)
    expect(customerErrorMessage({ message: 42 })).toBe(M.generic)
  })

  it("never leaks the raw English text", () => {
    const out = customerErrorMessage(new Error("Error: Something odd happened"))
    expect(out).not.toMatch(/Error|Something/)
  })
})
