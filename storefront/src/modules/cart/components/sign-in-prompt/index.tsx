import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-hairline bg-[#f7f9fb] p-5 small:flex-row small:items-center small:justify-between">
      <div>
        <Heading level="h2" className="text-lg font-semibold text-brand-ink">
          Já tem conta?
        </Heading>
        <Text className="txt-medium text-ui-fg-subtle mt-1">
          Inicie sessão para uma melhor experiência.
        </Text>
      </div>
      <div className="shrink-0">
        <LocalizedClientLink href="/account">
          <Button
            variant="secondary"
            className="btn-brand-secondary h-11 w-full small:w-auto"
            data-testid="sign-in-button"
          >
            Iniciar sessão
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
