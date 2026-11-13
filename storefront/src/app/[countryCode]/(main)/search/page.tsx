import { Metadata } from "next"

import SearchModal from "@modules/search/templates/search-modal"

export const metadata: Metadata = {
  title: "Pesquisa",
  robots: { index: false, follow: true },
}

export default function SearchModalRoute() {
  return <SearchModal />
}
