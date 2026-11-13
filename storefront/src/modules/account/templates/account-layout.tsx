import React from "react"
import { ArrowRight } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-white flex flex-col">
        {customer ? (
          <div className="grid grid-cols-1 small:grid-cols-[240px_1fr] py-12">
            <div>
              <AccountNav customer={customer} />
            </div>
            <div className="flex-1">{children}</div>
          </div>
        ) : (
          // Signed out: the login/register card is centred on its own.
          <div className="py-10">{children}</div>
        )}
        <div className="flex flex-col gap-4 border-t border-hairline py-10 small:flex-row small:items-center small:justify-between small:py-12">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-brand-ink">
              Tem dúvidas?
            </h3>
            <p className="mt-1 text-[15px] text-grey-60">
              Fale connosco: a nossa equipa responde em dias úteis.
            </p>
          </div>
          <LocalizedClientLink
            href="/contact"
            className="inline-flex items-center gap-2 self-start text-sm font-bold uppercase tracking-[0.04em] text-brand-cyan-ink transition-colors hover:text-brand-cyan small:self-auto"
          >
            Contactos
            <ArrowRight className="h-4 w-4" />
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
