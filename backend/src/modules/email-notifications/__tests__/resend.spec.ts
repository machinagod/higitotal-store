const send = jest.fn()
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
}))

// Template rendering (React Email) is out of scope here — keep the real data guard.
jest.mock("../templates", () => {
  const { MedusaError } = jest.requireActual("@medusajs/framework/utils")
  return {
    generateEmailTemplate: (key: string, data: any) => {
      if (typeof data?.name !== "string" || typeof data?.email !== "string") {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${key}"`)
      }
      return "<email />"
    },
  }
})

import { ResendNotificationService } from "../services/resend"

const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), info: jest.fn() } as any
const service = () =>
  new ResendNotificationService({ logger }, { api_key: "re_test", from: "loja@higitotal.pt" } as any)

const contactRequest = (data: Record<string, unknown> = {}) =>
  ({
    to: "vendas@higitotal.pt",
    channel: "email",
    template: "contact-request",
    data: { name: "Ana", email: "ana@example.pt", message: "Olá", ...data },
  }) as any

describe("ResendNotificationService.send", () => {
  it("sends when the caller passes no emailOptions (contact-request route)", async () => {
    send.mockResolvedValue({ data: { id: "em_1" }, error: null })
    await expect(service().send(contactRequest())).resolves.toEqual({ id: "em_1" })
    const msg = send.mock.calls[0][0]
    expect(msg.to).toBe("vendas@higitotal.pt")
    expect(msg.from).toBe("loja@higitotal.pt")
    expect(msg.subject).toBe("You have a new notification")
  })

  it("uses the caller's subject and reply-to", async () => {
    send.mockResolvedValue({ data: { id: "em_2" }, error: null })
    await service().send(
      contactRequest({ emailOptions: { subject: "Pedido de contacto — Ana", replyTo: "ana@example.pt" } })
    )
    const msg = send.mock.calls[0][0]
    expect(msg.subject).toBe("Pedido de contacto — Ana")
    expect(msg.replyTo).toBe("ana@example.pt")
  })

  it("fails when Resend returns an API error instead of throwing", async () => {
    send.mockResolvedValue({ data: null, error: { name: "validation_error", message: "domain not verified" } })
    await expect(service().send(contactRequest())).rejects.toThrow(/domain not verified/)
    expect(logger.log).not.toHaveBeenCalled()
  })

  it("fails on network errors", async () => {
    send.mockRejectedValue(new Error("ECONNRESET"))
    await expect(service().send(contactRequest())).rejects.toThrow(/ECONNRESET/)
  })

  it("rejects template data that doesn't match", async () => {
    await expect(service().send({ ...contactRequest(), data: {} })).rejects.toThrow(/Invalid data/)
    expect(send).not.toHaveBeenCalled()
  })
})
