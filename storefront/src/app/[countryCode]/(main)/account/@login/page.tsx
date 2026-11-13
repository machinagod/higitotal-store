import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

// Parallel-route slot pages don't receive the root " · Higitotal" title
// template, so the account titles are absolute (never duplicated either way).
export const metadata: Metadata = {
  title: { absolute: "Iniciar sessão · Higitotal" },
  description: "Inicie sessão na sua área de cliente Higitotal.",
}

export default function Login() {
  return <LoginTemplate />
}
