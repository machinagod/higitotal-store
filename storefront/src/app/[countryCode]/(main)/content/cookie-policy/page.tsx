import { Metadata } from "next"

import { COMPANY } from "@lib/company"
import { CONSENT_MAX_AGE } from "@lib/consent/cookie"
import { QUOTE_STORAGE_KEY } from "@lib/quote-list/state"
import { DEFAULT_GTM_ID, analyticsEnabled } from "@lib/util/gtm"
import CookiePreferencesButton from "@modules/common/components/cookie-consent/preferences-button"
import {
  CompanyContacts,
  CompanyIdentification,
  LegalLink,
  LegalList,
  LegalPage,
  type LegalSection,
} from "../_components/legal-page"

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Que cookies o site Higitotal utiliza, para que servem e como gerir o seu consentimento.",
}

/** The GA4 property the GTM container sends to (its `_ga_<id>` cookie). */
const GA4_STREAM_COOKIE = "_ga_SWG8Q2W0PQ"

const GOOGLE_PRIVACY_URL = "https://policies.google.com/privacy?hl=pt-PT"
const GOOGLE_PARTNER_SITES_URL =
  "https://policies.google.com/technologies/partner-sites?hl=pt-PT"

type StoredItem = {
  name: string
  /** "Cookie" or "Armazenamento local" (localStorage). */
  kind: string
  provider: string
  purpose: React.ReactNode
  duration: string
}

/**
 * Strictly necessary cookies / storage the storefront itself sets (see
 * src/middleware.ts, src/lib/data/cookies.ts, src/lib/consent and
 * src/lib/quote-list). Keep in sync with the code.
 */
const NECESSARY: StoredItem[] = [
  {
    name: "ht_consent",
    kind: "Cookie",
    provider: "Higitotal (próprio)",
    purpose:
      "Guarda a sua escolha sobre os cookies de estatística (aceite ou recusada) e a data dessa escolha, para não voltar a perguntar em cada visita.",
    duration: `${Math.round(CONSENT_MAX_AGE / 86400)} dias`,
  },
  {
    name: "ht_access",
    kind: "Cookie",
    provider: "Higitotal (próprio)",
    purpose:
      "Dá acesso ao site durante a fase de pré-lançamento, quando o acesso restrito está ativo. É temporário: deixa de ser utilizado quando o site abrir ao público.",
    duration: "30 dias",
  },
  {
    name: QUOTE_STORAGE_KEY,
    kind: "Armazenamento local",
    provider: "Higitotal (próprio)",
    purpose:
      "Guarda a sua lista de orçamento (produtos e quantidades) apenas neste dispositivo, para a poder rever e enviar. Só chega à Higitotal quando envia o pedido de orçamento.",
    duration:
      "Até esvaziar a lista, enviar o pedido ou apagar os dados do site no navegador",
  },
  {
    name: "_medusa_jwt",
    kind: "Cookie",
    provider: "Higitotal (próprio)",
    purpose:
      "Mantém a sessão iniciada na área de cliente. Só é definido se iniciar sessão; enquanto o site funciona como catálogo (sem preços nem encomendas online), a área de cliente não é apresentada e este cookie não é definido durante a navegação.",
    duration: "7 dias ou até terminar a sessão",
  },
  {
    name: "_medusa_cart_id",
    kind: "Cookie",
    provider: "Higitotal (próprio)",
    purpose:
      "Identifica o carrinho de compras quando a encomenda online está disponível. Não é definido enquanto o site funciona como catálogo.",
    duration: "Até 7 dias",
  },
  {
    name: "_medusa_onboarding",
    kind: "Cookie",
    provider: "Higitotal (próprio)",
    purpose:
      "Uso técnico interno, apenas quando a loja é aberta a partir do painel de administração para configuração. Não é definido durante a navegação.",
    duration: "24 horas",
  },
]

/** Set only after the visitor accepts "Estatísticas". */
const STATISTICS: StoredItem[] = [
  {
    name: "_ga",
    kind: "Cookie",
    provider: "Google Ireland Limited (Google Analytics 4)",
    purpose:
      "Distingue visitantes através de um identificador aleatório, para produzir estatísticas agregadas de utilização do site.",
    duration: "2 anos",
  },
  {
    name: GA4_STREAM_COOKIE,
    kind: "Cookie",
    provider: "Google Ireland Limited (Google Analytics 4)",
    purpose:
      "Mantém o estado da sessão de navegação (por exemplo, o início e o número da sessão) na propriedade Google Analytics da Higitotal.",
    duration: "2 anos",
  },
]

const BROWSER_HELP = [
  {
    name: "Google Chrome",
    url: "https://support.google.com/chrome/answer/95647?hl=pt-PT",
  },
  {
    name: "Mozilla Firefox",
    url: "https://support.mozilla.org/pt-PT/kb/cookies-informacao-que-websites-guardam-no-seu-computador",
  },
  {
    name: "Safari",
    url: "https://support.apple.com/pt-pt/guide/safari/sfri11471/mac",
  },
  {
    name: "Microsoft Edge",
    url: "https://support.microsoft.com/pt-pt/edge/manage-cookies-in-microsoft-edge-view-allow-block-delete-and-use",
  },
]

/** Phones: one card per item; tablet/desktop: a table. */
function StorageTable({ items, testId }: { items: StoredItem[]; testId: string }) {
  return (
    <>
      <ul className="flex flex-col gap-3 small:hidden" data-testid={`${testId}-cards`}>
        {items.map((c) => (
          <li
            key={c.name}
            className="rounded-[16px] border border-hairline p-4 text-sm"
          >
            <p className="break-all font-mono text-[13px] font-semibold text-brand-ink">
              {c.name}
            </p>
            <p className="mt-0.5 text-[12px] text-grey-50">
              {c.kind} · {c.provider}
            </p>
            <p className="mt-1.5">{c.purpose}</p>
            <p className="mt-1.5 text-grey-50">Duração: {c.duration}</p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-[16px] border border-hairline small:block">
        <table
          className="w-full min-w-[560px] border-collapse text-left text-sm"
          data-testid={testId}
        >
          <thead className="bg-[#f1f4f7] text-[11px] font-bold uppercase tracking-[0.08em] text-grey-60">
            <tr>
              <th scope="col" className="px-4 py-3">
                Nome
              </th>
              <th scope="col" className="px-4 py-3">
                Finalidade
              </th>
              <th scope="col" className="px-4 py-3">
                Duração
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.name} className="border-t border-hairline align-top">
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <span className="block whitespace-nowrap font-mono text-[13px] font-semibold text-brand-ink">
                    {c.name}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-grey-50">
                    {c.kind}
                    <br />
                    {c.provider}
                  </span>
                </th>
                <td className="px-4 py-3">{c.purpose}</td>
                <td className="px-4 py-3">{c.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

const prefsButtonClass =
  "inline-flex min-h-[44px] items-center justify-center self-start rounded-pill border-[1.5px] border-brand-ink bg-white px-5 text-sm font-bold text-brand-ink transition-colors hover:bg-brand-ink hover:text-white"

export default function CookiePolicyPage() {
  const canChange = analyticsEnabled()

  const sections: LegalSection[] = [
    {
      id: "o-que-sao",
      title: "O que são cookies",
      body: (
        <>
          <p>
            Cookies são pequenos ficheiros de texto que um site guarda no seu
            dispositivo quando o visita. Permitem, por exemplo, manter a sessão
            iniciada ou medir a utilização do site. O armazenamento local do
            navegador (<span className="font-mono text-[13px]">localStorage</span>)
            funciona de forma semelhante e é tratado nesta política da mesma
            forma.
          </p>
          <p>
            O site é da responsabilidade da <CompanyIdentification />.
          </p>
        </>
      ),
    },
    {
      id: "fundamento",
      title: "Fundamento e categorias",
      body: (
        <>
          <p>Utilizamos duas categorias:</p>
          <LegalList>
            <li>
              <span className="font-semibold text-brand-ink">Necessários</span>{" "}
              — indispensáveis para prestar o serviço que pede (por exemplo,
              guardar a sua escolha de cookies ou a lista de orçamento). Não
              dependem de consentimento e não são usados para análise nem
              publicidade.
            </li>
            <li>
              <span className="font-semibold text-brand-ink">Estatísticas</span>{" "}
              — Google Analytics, para perceber como o site é usado. Só são
              utilizados com o seu consentimento (art. 6.º, n.º 1, al. a), do
              RGPD), que pode recusar ou retirar a qualquer momento sem
              qualquer consequência na utilização do site.
            </li>
          </LegalList>
          <p>
            O site não utiliza cookies de publicidade nem de marketing.
          </p>
        </>
      ),
    },
    {
      id: "necessarios",
      title: "Cookies estritamente necessários",
      body: (
        <>
          <p>
            Definidos pelo próprio site, no seu domínio. Alguns só existem em
            situações específicas, como indicado.
          </p>
          <StorageTable items={NECESSARY} testId="cookies-necessary" />
        </>
      ),
    },
    {
      id: "estatisticas",
      title: "Cookies de estatística (com consentimento)",
      body: (
        <>
          <p>
            Se aceitar as estatísticas, o Google Analytics 4, carregado
            através do Google Tag Manager (contentor{" "}
            <span className="font-mono text-[13px]">{DEFAULT_GTM_ID}</span>),
            define os cookies abaixo. O fornecedor é a Google Ireland Limited,
            que pode tratar dados fora do Espaço Económico Europeu nos termos
            da sua{" "}
            <LegalLink href={GOOGLE_PRIVACY_URL}>política de privacidade</LegalLink>{" "}
            (ver também{" "}
            <LegalLink href={GOOGLE_PARTNER_SITES_URL}>
              como a Google utiliza informações de sites que usam os seus
              serviços
            </LegalLink>
            ).
          </p>
          <StorageTable items={STATISTICS} testId="cookies-statistics" />
          <p>
            A duração indicada é a definida pela Google; é renovada a cada
            visita e alguns navegadores aplicam um prazo máximo mais curto.
          </p>
          <p>
            Sem o seu consentimento, estes cookies não são definidos. O site
            utiliza o modo de consentimento da Google (Consent Mode): nesse
            caso, o Google Analytics pode ainda receber pedidos sem cookies,
            que não guardam nem leem informação no seu dispositivo, com dados
            técnicos sobre a visita, como a página vista e o estado do
            consentimento.
          </p>
        </>
      ),
    },
    {
      id: "gerir",
      title: "Como gerir ou retirar o consentimento",
      body: (
        <>
          <p>
            Na primeira visita, o painel de cookies permite aceitar, rejeitar
            ou personalizar a sua escolha; rejeitar é tão simples como aceitar.
            Pode alterar ou retirar o consentimento a qualquer momento em
            «Preferências de cookies», no rodapé de todas as páginas, ou no
            botão abaixo. Ao retirar o consentimento, os cookies do Google
            Analytics guardados no seu dispositivo são apagados. Retirar o
            consentimento não afeta a licitude da utilização feita até então.
          </p>
          {canChange && (
            <CookiePreferencesButton
              className={prefsButtonClass}
              testId="cookie-policy-preferences"
            >
              Alterar preferências de cookies
            </CookiePreferencesButton>
          )}
          <p>
            Pode também bloquear ou apagar cookies nas definições do seu
            navegador. Se bloquear os cookies estritamente necessários, algumas
            funcionalidades, como a lista de orçamento, podem deixar de
            funcionar.
          </p>
          <LegalList>
            {BROWSER_HELP.map((b) => (
              <li key={b.name}>
                <LegalLink href={b.url}>{b.name}</LegalLink>
              </li>
            ))}
          </LegalList>
        </>
      ),
    },
    {
      id: "mais-informacao",
      title: "Mais informação",
      body: (
        <>
          <p>
            O tratamento de dados pessoais associado aos cookies está descrito
            na{" "}
            <LegalLink href="/content/privacy-policy">
              Política de Privacidade
            </LegalLink>
            .
          </p>
          <p>
            Para questões sobre esta política, contacte a {COMPANY.shortName}:{" "}
            <CompanyContacts />.
          </p>
        </>
      ),
    },
  ]

  return (
    <LegalPage
      title="Política de Cookies"
      current="/content/cookie-policy"
      lastUpdated="13 de novembro de 2026"
      intro={
        <p>
          Esta política explica que cookies e tecnologias semelhantes o site
          utiliza, para que servem e como pode gerir o seu consentimento.
        </p>
      }
      sections={sections}
    />
  )
}
