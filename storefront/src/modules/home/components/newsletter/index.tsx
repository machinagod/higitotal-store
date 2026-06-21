"use client"

import { useState } from "react"

const Newsletter = () => {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section>
      <div className="flex flex-col items-start justify-between gap-[18px] rounded-hero bg-gradient-to-br from-[#101418] to-[#1d2530] px-[22px] py-8 small:flex-row small:items-center small:gap-10 small:px-14 small:py-[50px]">
        <div>
          <h3 className="m-0 max-w-[18ch] text-[22px] font-extrabold leading-tight tracking-tight text-white small:text-[30px]">
            Receba novidades e campanhas
          </h3>
          <p className="mt-2.5 max-w-[40ch] text-sm font-normal leading-relaxed text-[#8b95a1] small:text-[15px]">
            Produtos, preços profissionais e dicas de manutenção — directo no
            seu email.
          </p>
        </div>

        <form
          className="flex w-full flex-wrap gap-2.5 small:min-w-[300px] small:max-w-[460px] small:flex-1 small:flex-nowrap"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(true)
          }}
        >
          <label htmlFor="newsletter-email" className="sr-only">
            O seu email profissional
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            placeholder="O seu email profissional"
            className="w-full flex-1 rounded-pill border-[1.5px] border-[#2c333c] bg-white/[0.08] px-[22px] py-[15px] text-sm font-medium text-white outline-none placeholder:text-[#8b95a1] focus:border-brand-cyan small:w-auto"
          />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-pill bg-white px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.04em] text-brand-navy shadow-lg transition-transform hover:-translate-y-0.5 small:w-auto"
          >
            {submitted ? "Obrigado!" : "Subscrever"}
          </button>
        </form>
      </div>
    </section>
  )
}

export default Newsletter
