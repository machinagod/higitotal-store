import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { parseContactRequest, sendContactRequest } from "./handler"
import {
  CAPTCHA_ERROR_MESSAGE,
  captchaConfigFromEnv,
  clientIp,
  verifyCaptcha,
} from "./captcha"

/**
 * Public enquiry / contact / assistência submission from the storefront.
 * E-mails the sales inbox via the configured notification provider (Resend),
 * then sends the customer an acknowledgement. Requires the publishable key
 * (store route). Quietly succeeds on honeypot hits so bots get no signal.
 *
 * Body (all strings unless noted): name*, email*, phone, message (phone or
 * message required), empresa, localidade, quantidadeEstimada, contactPref,
 * kind ("produto" | "assistencia" | "geral", inferred when absent),
 * productTitle, sku, quantity (number), productUrl, company (honeypot),
 * items (quote list: up to 100 × { sku, title, quantity 1–9999, note, url },
 * sanitised — see parseQuoteItems), hcaptchaToken.
 *
 * hCaptcha (see ./captcha): with HCAPTCHA_SECRET set, a token is verified
 * BEFORE any e-mail is sent and an invalid one gets 400 { message: "captcha" };
 * a missing token is rejected only when HCAPTCHA_REQUIRED=true (rollout
 * switch); an hCaptcha outage fails open.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const parsed = parseContactRequest(req.body)

  if (parsed.status === "invalid") {
    return res.status(400).json({ message: parsed.message })
  }
  if (parsed.status === "honeypot") {
    // honeypot tripped — pretend success
    return res.json({ ok: true })
  }

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  const captcha = await verifyCaptcha(
    parsed.captchaToken,
    captchaConfigFromEnv(process.env),
    { logger, remoteip: clientIp(req.headers["x-forwarded-for"]) }
  )
  if (!captcha.ok) {
    return res.status(400).json({ message: CAPTCHA_ERROR_MESSAGE })
  }

  const to =
    process.env.CONTACT_REQUEST_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "higitotal@higitotal.pt"

  const outcome = await sendContactRequest(parsed.request, {
    notification: req.scope.resolve(Modules.NOTIFICATION),
    logger,
    to,
  })

  // Surface a failed staff e-mail so the form tells the customer to try again
  // / call, rather than "sent".
  if (!outcome.ok) {
    return res.status(502).json({ message: "could not send the request email" })
  }

  res.json({ ok: true })
}
