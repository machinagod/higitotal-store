import { useFormState } from "react-dom"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

/** Shared look for the sign-in / register submit button (brand cyan pill). */
export const ACCOUNT_SUBMIT_CLASS =
  "mt-6 h-12 w-full !rounded-pill !font-sans !border-0 !bg-brand-cyan text-[13px] font-bold uppercase tracking-[0.04em] !text-white !shadow-none transition-colors hover:!bg-brand-cyan-ink disabled:!opacity-60"

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(login, null)

  return (
    <div className="flex w-full flex-col" data-testid="login-page">
      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-brand-cyan">
        <span className="ind" />
        Área de cliente
      </span>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink">
        Iniciar sessão
      </h1>
      <p className="mb-7 mt-2 text-[15px] leading-relaxed text-grey-60">
        Aceda à sua área de cliente.
      </p>
      <form
        className="w-full [&_input]:!font-sans [&_label]:!font-sans"
        action={formAction}
      >
        <div className="flex w-full flex-col gap-y-3">
          <Input
            label="E-mail"
            name="email"
            type="email"
            title="Introduza um endereço de e-mail válido."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Palavra-passe"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton
          variant="transparent"
          data-testid="sign-in-button"
          className={ACCOUNT_SUBMIT_CLASS}
        >
          Iniciar sessão
        </SubmitButton>
      </form>
      <p className="mt-6 border-t border-hairline pt-5 text-center text-sm text-grey-60">
        Ainda não tem conta?{" "}
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="font-semibold text-brand-cyan-ink underline-offset-2 hover:underline"
          data-testid="register-button"
        >
          Criar conta
        </button>
      </p>
    </div>
  )
}

export default Login
