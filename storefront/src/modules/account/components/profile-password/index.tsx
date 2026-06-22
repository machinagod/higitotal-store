"use client"

import React, { useEffect } from "react"

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { useFormState } from "react-dom"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileName: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)

  // TODO: Add support for password updates
  const [state, formAction] = useFormState((() => {}) as any, {
    customer,
    success: false,
    error: null,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} onReset={() => clearState()} className="w-full">
      <AccountInfo
        label="Palavra-passe"
        currentInfo={
          <span>A palavra-passe não é mostrada por motivos de segurança</span>
        }
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error ?? undefined}
        clearState={clearState}
        data-testid="account-password-editor"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Palavra-passe atual"
            name="old_password"
            required
            type="password"
            data-testid="old-password-input"
          />
          <Input
            label="Nova palavra-passe"
            type="password"
            name="new_password"
            required
            data-testid="new-password-input"
          />
          <Input
            label="Confirmar palavra-passe"
            type="password"
            name="confirm_password"
            required
            data-testid="confirm-password-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileName
