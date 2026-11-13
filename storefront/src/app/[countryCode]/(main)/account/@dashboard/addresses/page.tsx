import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { headers } from "next/headers"
import { getRegion } from "@lib/data/regions"
import { getCustomer } from "@lib/data/customer"

// Parallel-route slot pages don't receive the root " · Higitotal" title
// template, so the account titles are absolute (never duplicated either way).
export const metadata: Metadata = {
  title: { absolute: "Moradas · Higitotal" },
  description: "Consulte e gira as suas moradas.",
}

export default async function Addresses({
  params,
}: {
  params: { countryCode: string }
}) {
  const { countryCode } = params
  const customer = await getCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-ink">
          Moradas de entrega
        </h1>
        <p className="text-base-regular text-grey-60">
          Consulte e atualize as suas moradas de entrega. Pode guardar as
          moradas que precisar.
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
