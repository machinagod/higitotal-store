import { Metadata } from "next"

import { COMPANY } from "@lib/company"
import { isCatalogMode } from "@lib/util/catalog-mode"
import { HCAPTCHA_PRIVACY_URL } from "@lib/util/hcaptcha"
import {
  CompanyContacts,
  CompanyIdentification,
  LegalLink,
  LegalList,
  LegalPage,
  type LegalSection,
} from "../_components/legal-page"
import { pageMetadata } from "@lib/util/seo"

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    path: "content/privacy-policy",
    title: "Política de Privacidade",
    description:
      "Como a Higitotal recolhe, utiliza e protege os seus dados pessoais.",
  })
}

const B = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold text-brand-ink">{children}</span>
)

export default function PrivacyPolicyPage() {
  const catalog = isCatalogMode()

  const sections: LegalSection[] = [
    {
      id: "responsavel",
      title: "Responsável pelo tratamento",
      body: (
        <>
          <p>
            A <CompanyIdentification />, é a responsável pelo tratamento dos
            dados pessoais recolhidos através deste site.
          </p>
          <p>
            Para qualquer questão sobre os seus dados pessoais, contacte-nos:{" "}
            <CompanyContacts />.
          </p>
        </>
      ),
    },
    {
      id: "dados",
      title: "Que dados recolhemos",
      body: (
        <LegalList>
          <li>
            <B>Pedidos de orçamento, informação e assistência técnica:</B>{" "}
            nome, e-mail, telefone, empresa, localidade e a mensagem que nos
            envia; nos pedidos de assistência, também o tipo de serviço, o
            equipamento ou marca e a forma de contacto preferida.
          </li>
          <li>
            <B>Verificação anti-spam dos formulários (hCaptcha):</B> dados
            técnicos do dispositivo, do navegador e da interação com o
            formulário, incluindo o endereço IP, tratados pelo hCaptcha quando
            um formulário é apresentado.
          </li>
          <li>
            <B>Área de cliente:</B> nome, e-mail, telefone, palavra-passe e as
            moradas que guardar na sua conta.
          </li>
          {!catalog && (
            <li>
              <B>Encomendas online:</B> moradas de entrega e faturação, artigos
              encomendados e informação de pagamento necessária ao
              processamento da encomenda.
            </li>
          )}
          <li>
            <B>Dados de navegação:</B> cookies e informação técnica, conforme
            descrito na{" "}
            <LegalLink href="/content/cookie-policy">
              Política de Cookies
            </LegalLink>
            .
          </li>
        </LegalList>
      ),
    },
    {
      id: "finalidades",
      title: "Finalidades e fundamento jurídico",
      body: (
        <LegalList>
          <li>
            <B>Responder a pedidos de orçamento, informação e assistência</B> —
            diligências pré-contratuais a pedido do titular dos dados (art. 6.º,
            n.º 1, al. b), do RGPD).
          </li>
          <li>
            <B>Gerir a sua área de cliente</B> — execução do contrato de
            utilização da conta (art. 6.º, n.º 1, al. b), do RGPD).
          </li>
          <li>
            <B>
              {catalog
                ? "Executar contratos e cumprir obrigações fiscais e contabilísticas, quando aplicável"
                : "Processar, entregar e faturar encomendas"}
            </B>{" "}
            — execução do contrato e cumprimento de obrigações legais (art.
            6.º, n.º 1, als. b) e c), do RGPD).
          </li>
          <li>
            <B>Estatísticas de utilização do site</B> (Google Analytics) —
            apenas com o seu consentimento (art. 6.º, n.º 1, al. a), do RGPD),
            através do Google Tag Manager. O site não utiliza cookies de
            publicidade nem de marketing. Ver a{" "}
            <LegalLink href="/content/cookie-policy">
              Política de Cookies
            </LegalLink>
            .
          </li>
          <li>
            <B>Proteção dos formulários contra envios automáticos (spam)</B>{" "}
            (hCaptcha) — interesse legítimo da Higitotal (art. 6.º, n.º 1, al.
            f), do RGPD). É estritamente necessário para enviar os formulários
            e só é carregado nas páginas com um formulário.
          </li>
          <li>
            <B>Segurança e funcionamento do site</B> — interesse legítimo da
            Higitotal (art. 6.º, n.º 1, al. f), do RGPD).
          </li>
        </LegalList>
      ),
    },
    {
      id: "destinatarios",
      title: "Subcontratantes e destinatários",
      body: (
        <>
          <p>
            Não vendemos os seus dados pessoais. Para o funcionamento do site
            recorremos aos seguintes subcontratantes, que tratam dados apenas
            por nossa conta e segundo as nossas instruções:
          </p>
          <LegalList>
            <li>
              <B>Railway</B> — alojamento do site e da base de dados.
            </li>
            <li>
              <B>Resend</B> — envio dos e-mails gerados pelos formulários e
              pela área de cliente.
            </li>
            <li>
              <B>Google Ireland Limited</B> (Google Tag Manager e Google
              Analytics) — estatísticas de utilização, apenas se der o seu
              consentimento aos cookies de estatística.
            </li>
            <li>
              <B>Intuition Machines, Inc.</B> (hCaptcha) — proteção dos
              formulários contra envios automáticos (spam), com fundamento no
              interesse legítimo; estritamente necessário para os formulários e
              carregado apenas nas páginas com um formulário. Ver a{" "}
              <LegalLink href={HCAPTCHA_PRIVACY_URL}>
                política de privacidade do hCaptcha
              </LegalLink>{" "}
              e a{" "}
              <LegalLink href="/content/cookie-policy">
                Política de Cookies
              </LegalLink>
              .
            </li>
          </LegalList>
          <p>
            A Railway e a Resend podem tratar dados fora do Espaço Económico
            Europeu, nomeadamente nos Estados Unidos. Essas transferências
            assentam em Cláusulas Contratuais-Tipo aprovadas pela Comissão
            Europeia (art. 46.º do RGPD). A Intuition Machines, Inc.
            (hCaptcha) está sediada nos Estados Unidos e pode tratar dados fora
            do Espaço Económico Europeu, nos termos da sua política de
            privacidade.
          </p>
          <p>
            Os dados podem ainda ser comunicados a autoridades públicas quando
            a lei o exija.
          </p>
        </>
      ),
    },
    {
      id: "conservacao",
      title: "Conservação",
      body: (
        <LegalList>
          <li>
            Os pedidos de orçamento, informação e assistência são conservados
            até 24 meses após o último contacto, salvo se derem origem a um
            contrato.
          </li>
          <li>
            Havendo contrato, os dados são conservados durante a sua vigência
            e pelos prazos legais aplicáveis, nomeadamente em matéria
            contabilística e fiscal.
          </li>
          <li>
            Os dados da área de cliente são conservados enquanto a conta
            estiver ativa e eliminados quando pedir o seu encerramento, sem
            prejuízo das obrigações legais de conservação.
          </li>
          <li>
            Os prazos dos cookies constam da{" "}
            <LegalLink href="/content/cookie-policy">
              Política de Cookies
            </LegalLink>
            .
          </li>
        </LegalList>
      ),
    },
    {
      id: "direitos",
      title: "Os seus direitos",
      body: (
        <>
          <p>
            Nos termos do RGPD, tem o direito de acesso, retificação,
            apagamento, limitação do tratamento, oposição e portabilidade dos
            seus dados. Quando o tratamento se basear no consentimento, pode
            retirá-lo a qualquer momento, sem afetar a licitude do tratamento
            efetuado até então.
          </p>
          <p>
            Para exercer estes direitos, escreva para{" "}
            <LegalLink href={`mailto:${COMPANY.email}`}>{COMPANY.email}</LegalLink>
            . Respondemos no prazo de um mês, prorrogável nos casos previstos
            na lei.
          </p>
          <p>
            Tem ainda o direito de apresentar reclamação à Comissão Nacional de
            Proteção de Dados (CNPD) —{" "}
            <LegalLink href="https://www.cnpd.pt">www.cnpd.pt</LegalLink>.
          </p>
        </>
      ),
    },
    {
      id: "seguranca",
      title: "Segurança",
      body: (
        <p>
          Adotamos medidas técnicas e organizativas adequadas para proteger os
          seus dados contra perda, acesso não autorizado ou divulgação,
          incluindo ligações cifradas (HTTPS) e acesso restrito à informação.
        </p>
      ),
    },
    {
      id: "alteracoes",
      title: "Alterações",
      body: (
        <p>
          Esta política pode ser atualizada. A versão em vigor é a publicada
          nesta página, com a data da última atualização indicada no topo.
        </p>
      ),
    },
  ]

  return (
    <LegalPage
      title="Política de Privacidade"
      current="/content/privacy-policy"
      lastUpdated="14 de novembro de 2026"
      intro={
        <p>
          Esta política explica que dados pessoais recolhemos através do site,
          para que fins os utilizamos e como pode exercer os seus direitos.
        </p>
      }
      sections={sections}
    />
  )
}
