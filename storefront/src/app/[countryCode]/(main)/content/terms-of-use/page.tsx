import { Metadata } from "next"

import { COMPANY } from "@lib/company"
import { isCatalogMode } from "@lib/util/catalog-mode"
import {
  CompanyContacts,
  CompanyIdentification,
  LegalLink,
  LegalPage,
  type LegalSection,
} from "../_components/legal-page"

export const metadata: Metadata = {
  title: "Termos de Utilização",
  description: "Termos de utilização do site Higitotal.",
}

export default function TermsOfUsePage() {
  const catalog = isCatalogMode()

  const sections: (LegalSection | false)[] = [
    {
      id: "identificacao",
      title: "Identificação",
      body: (
        <>
          <p>
            Este site é gerido pela <CompanyIdentification />, matriculada na
            Conservatória do Registo Comercial sob o NIPC {COMPANY.nipc}, com o
            capital social de 120 000 €.
          </p>
          <p>
            Contactos: <CompanyContacts />.
          </p>
        </>
      ),
    },
    {
      id: "natureza-do-site",
      title: "Natureza do site",
      body: catalog ? (
        <>
          <p>
            Este site é um catálogo informativo. Os preços, a disponibilidade e
            as condições comerciais são indicados mediante pedido e confirmados
            por proposta ou orçamento escrito.
          </p>
          <p>
            Não é celebrado nenhum contrato de compra e venda ou de prestação de
            serviços através do site. A relação comercial só se forma com a
            aceitação, por ambas as partes, de uma proposta ou orçamento escrito
            emitido pela Higitotal.
          </p>
        </>
      ) : (
        <>
          <p>
            Este site apresenta o catálogo de produtos da Higitotal e permite
            efetuar encomendas online, nas condições descritas na secção
            «Condições de venda online».
          </p>
          <p>
            Para artigos ou quantidades que exijam condições específicas, os
            preços e prazos podem ser confirmados por proposta ou orçamento
            escrito.
          </p>
        </>
      ),
    },
    {
      id: "informacao-de-produtos",
      title: "Informação de produtos",
      body: (
        <>
          <p>
            As imagens são meramente ilustrativas e as características
            técnicas são indicativas, podendo ser alteradas pelo fabricante sem
            aviso prévio. Antes de decidir, confirme connosco as
            características relevantes para a sua utilização.
          </p>
          <p>
            As marcas, os logótipos e as designações comerciais de terceiros
            apresentados no site pertencem aos respetivos titulares e são
            utilizados apenas para identificar os produtos.
          </p>
        </>
      ),
    },
    {
      id: "propriedade-intelectual",
      title: "Propriedade intelectual",
      body: (
        <p>
          Os conteúdos do site — textos, imagens, grafismo, logótipo e
          organização — pertencem à Higitotal ou aos respetivos licenciantes e
          estão protegidos pela legislação aplicável. É permitida a sua
          consulta e impressão para uso pessoal ou interno da sua empresa; a
          reprodução, distribuição ou alteração para outros fins exige
          autorização prévia e escrita.
        </p>
      ),
    },
    {
      id: "pedidos",
      title: "Pedidos de orçamento e assistência",
      body: (
        <>
          <p>
            Os formulários «Pedir orçamento» e «Pedir assistência» enviam o seu
            pedido à nossa equipa comercial ou técnica, que o analisa e responde
            pelo meio de contacto indicado, em dias úteis. O envio de um pedido
            não obriga nenhuma das partes.
          </p>
          <p>
            As propostas e os orçamentos indicam os preços, as condições, os
            prazos e a respetiva validade. Agradecemos que os dados que nos
            transmite sejam corretos e completos, para podermos responder
            adequadamente.
          </p>
          <p>
            Os dados pessoais enviados são tratados nos termos da{" "}
            <LegalLink href="/content/privacy-policy">
              Política de Privacidade
            </LegalLink>
            .
          </p>
        </>
      ),
    },
    !catalog && {
      id: "condicoes-de-venda",
      title: "Condições de venda online",
      body: (
        <>
          <p>
            <span className="font-semibold text-brand-ink">Preços.</span> Os
            preços apresentados não incluem IVA, que é acrescentado à taxa
            legal em vigor. Os portes e outros encargos, quando existam, são
            indicados antes da confirmação da encomenda.
          </p>
          <p>
            <span className="font-semibold text-brand-ink">Encomendas.</span>{" "}
            A encomenda considera-se aceite após confirmação pela Higitotal e
            está sujeita à disponibilidade dos artigos. Quando um artigo não
            estiver em stock, informamo-lo do prazo previsto ou da alternativa
            disponível antes de prosseguir.
          </p>
          <p>
            <span className="font-semibold text-brand-ink">
              Pagamento e entrega.
            </span>{" "}
            O pagamento é efetuado pelos meios disponibilizados no momento da
            encomenda. As entregas são realizadas em Portugal Continental; os
            prazos e custos de envio são indicados durante a finalização da
            encomenda.
          </p>
          <p>
            <span className="font-semibold text-brand-ink">
              Devoluções e garantia.
            </span>{" "}
            Aos consumidores aplicam-se os direitos previstos na lei, incluindo,
            quando aplicável, o direito de livre resolução no prazo de 14 dias
            (Decreto-Lei n.º 24/2014) e a garantia legal de conformidade
            (Decreto-Lei n.º 84/2021). Para iniciar uma devolução ou troca,
            contacte a nossa equipa através dos contactos indicados na secção
            1.
          </p>
        </>
      ),
    },
    {
      id: "responsabilidade",
      title: "Responsabilidade",
      body: (
        <>
          <p>
            Procuramos manter a informação do site correta e atualizada, mas
            podem existir erros ou omissões, que corrigiremos logo que
            detetados. A Higitotal não se responsabiliza por interrupções ou
            falhas técnicas do site, nem pelo conteúdo de sites de terceiros
            para os quais existam ligações.
          </p>
          <p>
            Esta limitação não prejudica os direitos que a lei atribui aos
            consumidores, nem a responsabilidade que não possa ser legalmente
            excluída.
          </p>
        </>
      ),
    },
    {
      id: "lei-aplicavel",
      title: "Lei aplicável e resolução de litígios",
      body: (
        <>
          <p>Estes termos regem-se pela lei portuguesa.</p>
          <p>
            Em caso de litígio de consumo, o consumidor pode recorrer a uma
            entidade de resolução alternativa de litígios, nomeadamente ao{" "}
            <LegalLink href={COMPANY.disputeResolution.url}>
              {COMPANY.disputeResolution.name}
            </LegalLink>{" "}
            (www.cniacc.pt). Encontra mais informação sobre as entidades de
            resolução alternativa de litígios no Portal do Consumidor (
            <LegalLink href="https://www.consumidor.gov.pt">
              www.consumidor.gov.pt
            </LegalLink>
            ).
          </p>
          <p>
            Pode ainda apresentar reclamação no{" "}
            <LegalLink href={COMPANY.complaintsBookUrl}>
              Livro de Reclamações Eletrónico
            </LegalLink>
            .
          </p>
        </>
      ),
    },
    {
      id: "alteracoes",
      title: "Alterações",
      body: (
        <p>
          A Higitotal pode atualizar estes termos a qualquer momento. A versão
          em vigor é a publicada nesta página, com a data da última
          atualização indicada no topo.
        </p>
      ),
    },
  ]

  return (
    <LegalPage
      title="Termos de Utilização"
      current="/content/terms-of-use"
      intro={
        <p>
          Ao utilizar este site, aceita os termos seguintes. Leia-os com
          atenção.
        </p>
      }
      sections={sections.filter((s): s is LegalSection => Boolean(s))}
    />
  )
}
