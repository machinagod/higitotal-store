import { Label } from "@medusajs/ui"
import React, { useEffect, useId, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched, required, topLabel, id, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    // Every input gets a unique id so its <label> is programmatically
    // associated (the same `name` can appear twice on a page, e.g. shipping
    // and billing forms, so the name itself is not a safe id).
    const generatedId = useId()
    const inputId = id ?? `${name.replace(/[^a-zA-Z0-9_-]/g, "-")}-${generatedId.replace(/:/g, "")}`
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            type={inputType}
            name={name}
            id={inputId}
            placeholder=" "
            required={required}
            className={`ht-field pt-4 pb-1 block h-11 mt-0 appearance-none focus:ring-0${
              type === "password" ? " pr-12" : ""
            }`}
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={inputId}
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-ui-fg-subtle"
          >
            {label}
            {required && (
              <span className="text-rose-600" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"
              }
              aria-pressed={showPassword}
              aria-controls={inputId}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-btn text-ui-fg-subtle transition-colors duration-150 hover:text-ui-fg-base focus-visible:text-ui-fg-base"
            >
              {showPassword ? (
                <Eye aria-hidden="true" />
              ) : (
                <EyeOff aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
