import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  title: "404",
  description: "Página não encontrada",
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Página não encontrada</h1>
      <p className="text-small-regular text-ui-fg-base">
        O carrinho a que tentou aceder não existe. Limpe os cookies e tente
        novamente.
      </p>
      <InteractiveLink href="/">Ir para a página inicial</InteractiveLink>
    </div>
  )
}
