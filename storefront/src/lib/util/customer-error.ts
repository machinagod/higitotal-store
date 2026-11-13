/**
 * Maps errors thrown by the Medusa SDK during customer flows (login, sign-up,
 * address book) to short pt-PT messages. The raw errors are English and
 * technical ("Error: Invalid email or password"), so they are never shown to
 * the customer as-is.
 */
export const CUSTOMER_ERROR_MESSAGES = {
  invalidCredentials: "E-mail ou palavra-passe incorretos.",
  emailTaken: "Já existe uma conta com este e-mail.",
  generic: "Ocorreu um erro. Tente novamente.",
} as const

export type CustomerErrorContext = "login" | "signup" | "generic"

function errorText(error: unknown): string {
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "")
  }
  return ""
}

function errorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const e = error as { status?: unknown; statusCode?: unknown }
    const s = e.status ?? e.statusCode
    return typeof s === "number" ? s : undefined
  }
  return undefined
}

export function customerErrorMessage(
  error: unknown,
  context: CustomerErrorContext = "generic"
): string {
  const text = errorText(error).toLowerCase()
  const status = errorStatus(error)

  if (/already exists|already registered|duplicate/.test(text)) {
    return CUSTOMER_ERROR_MESSAGES.emailTaken
  }

  if (
    /invalid email or password|invalid credentials|wrong password/.test(text) ||
    (context === "login" && (status === 401 || /unauthori[sz]ed/.test(text)))
  ) {
    return CUSTOMER_ERROR_MESSAGES.invalidCredentials
  }

  return CUSTOMER_ERROR_MESSAGES.generic
}
