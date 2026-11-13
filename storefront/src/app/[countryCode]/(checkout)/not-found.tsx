import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "A página que procura não existe ou foi movida.",
}

export default async function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Página não encontrada</h1>
      <p className="text-small-regular text-ui-fg-base">
        A página a que tentou aceder não existe.
      </p>
      <InteractiveLink href="/">Ir para a página inicial</InteractiveLink>
    </div>
  )
}
