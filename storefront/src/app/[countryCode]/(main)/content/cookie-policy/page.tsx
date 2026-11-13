import { Metadata } from "next"

import { COMPANY } from "@lib/company"
import { DEFAULT_GTM_ID } from "@lib/util/gtm"
import {
  CompanyContacts,
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

/**
 * Strictly necessary cookies the storefront code itself sets (see
 * src/middleware.ts and src/lib/data/cookies.ts). Keep in sync with the code.
 */
const NECESSARY_COOKIES: {
  name: string
  purpose: string
  duration: string
}[] = [
  {
    name: "ht_access",
    purpose:
      "Controla o acesso ao site durante a fase de pré-lançamento, quando esse acesso restrito está ativo.",
    duration: "30 dias",
  },
  {
    name: "_medusa_jwt",
    purpose: "Mantém a sessão iniciada na área de cliente.",
    duration: "7 dias ou até terminar a sessão",
  },
  {
    name: "_medusa_cart_id",
    purpose:
      "Identifica o carrinho de compras, apenas quando a encomenda online está disponível.",
    duration: "até 7 dias",
  },
  {
    name: "_medusa_onboarding",
    purpose:
      "Uso técnico interno, durante a configuração da loja a partir do painel de administração.",
    duration: "24 horas",
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

export default function CookiePolicyPage() {
  const sections: LegalSection[] = [
    {
      id: "o-que-sao",
      title: "O que são cookies",
      body: (
        <p>
          Cookies são pequenos ficheiros de texto que um site guarda no seu
          dispositivo quando o visita. Permitem, por exemplo, manter a sessão
          iniciada ou medir a utilização do site. Alguns são indispensáveis ao
          funcionamento do site; outros só são utilizados com o seu
          consentimento.
        </p>
      ),
    },
    {
      id: "necessarios",
      title: "Cookies estritamente necessários",
      body: (
        <>
          <p>
            Estes cookies são definidos pelo próprio site, são indispensáveis
            ao seu funcionamento e não exigem consentimento. Não são usados
            para fins de análise nem de publicidade.
          </p>
          {/* Phones: one card per cookie (a 3-column table is too cramped). */}
          <ul className="flex flex-col gap-3 small:hidden">
            {NECESSARY_COOKIES.map((c) => (
              <li
                key={c.name}
                className="rounded-[16px] border border-hairline p-4 text-sm"
              >
                <p className="font-mono text-[13px] font-semibold text-brand-ink">
                  {c.name}
                </p>
                <p className="mt-1.5">{c.purpose}</p>
                <p className="mt-1.5 text-grey-50">Duração: {c.duration}</p>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-[16px] border border-hairline small:block">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead className="bg-[#f1f4f7] text-[11px] font-bold uppercase tracking-[0.08em] text-grey-60">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Cookie
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
                {NECESSARY_COOKIES.map((c) => (
                  <tr key={c.name} className="border-t border-hairline align-top">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] font-semibold text-brand-ink">
                      {c.name}
                    </td>
                    <td className="px-4 py-3">{c.purpose}</td>
                    <td className="whitespace-nowrap px-4 py-3">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: "analise-marketing",
      title: "Cookies de análise e marketing",
      body: (
        <>
          <p>
            As ferramentas de medição de audiências e de marketing são
            carregadas através do Google Tag Manager (contentor{" "}
            <span className="font-mono text-[13px]">{DEFAULT_GTM_ID}</span>) e
            só definem cookies depois de dar o seu consentimento no painel de
            cookies apresentado na primeira visita.
          </p>
          <p>
            As ferramentas ativas, os respetivos fornecedores, cookies e prazos
            de conservação são indicados nesse painel. Estes cookies podem ser
            de terceiros, como a Google, que pode tratar dados fora do Espaço
            Económico Europeu nos termos da sua própria política de
            privacidade.
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
            Pode aceitar, recusar ou alterar as suas escolhas a qualquer
            momento no painel de consentimento de cookies. Retirar o
            consentimento não afeta a licitude da utilização feita até então.
          </p>
          <p>
            Pode também bloquear ou apagar cookies nas definições do seu
            navegador. Se bloquear os cookies estritamente necessários, algumas
            funcionalidades, como a área de cliente, podem deixar de funcionar.
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
      intro={
        <p>
          Esta política explica que cookies o site utiliza, para que servem e
          como pode gerir as suas preferências.
        </p>
      }
      sections={sections}
    />
  )
}
