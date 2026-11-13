"use client"

import { useFormState } from "react-dom"

import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import { ACCOUNT_SUBMIT_CLASS } from "@modules/account/components/login"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(signup, null)

  return (
    <div className="flex w-full flex-col" data-testid="register-page">
      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-brand-cyan">
        <span className="ind" />
        Área de cliente
      </span>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-brand-ink">
        Criar conta
      </h1>
      <p className="mb-7 mt-2 text-[15px] leading-relaxed text-grey-60">
        Registe-se para guardar os seus dados e agilizar os pedidos de
        informação.
      </p>
      <form
        className="flex w-full flex-col [&_input]:!font-sans [&_label]:!font-sans"
        action={formAction}
      >
        <div className="flex w-full flex-col gap-y-3">
          <Input
            label="Nome próprio"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Apelido"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="E-mail"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Telefone"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Palavra-passe"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={typeof message === "string" ? message : null}
          data-testid="register-error"
        />
        <p className="mt-5 text-xs leading-relaxed text-grey-60">
          Ao criar uma conta, aceita os{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="font-semibold text-brand-ink underline underline-offset-2 hover:text-brand-cyan"
          >
            Termos de Utilização
          </LocalizedClientLink>{" "}
          e declara ter tomado conhecimento da{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="font-semibold text-brand-ink underline underline-offset-2 hover:text-brand-cyan"
          >
            Política de Privacidade
          </LocalizedClientLink>
          .
        </p>
        <SubmitButton
          variant="transparent"
          className={ACCOUNT_SUBMIT_CLASS}
          data-testid="register-button"
        >
          Criar conta
        </SubmitButton>
      </form>
      <p className="mt-6 border-t border-hairline pt-5 text-center text-sm text-grey-60">
        Já tem conta?{" "}
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="font-semibold text-brand-cyan-ink underline-offset-2 hover:underline"
        >
          Iniciar sessão
        </button>
      </p>
    </div>
  )
}

export default Register
