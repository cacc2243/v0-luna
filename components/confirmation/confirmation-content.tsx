'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react'

export function ConfirmationContent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative z-10 w-full max-w-sm">
      {/* Card no mesmo estilo do fluxo de convite */}
      <div className="relative flex flex-col overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/25">
        {/* Borda em gradiente: forte no topo, suavizando até a base */}
        <div
          className="pointer-events-none absolute inset-0 z-20 rounded-3xl"
          aria-hidden="true"
          style={{
            padding: '1.25px',
            background:
              'linear-gradient(to bottom, oklch(0.5 0.15 15 / 0.95), oklch(0.6 0.16 15 / 0.32) 45%, oklch(0.66 0.17 15 / 0.08) 100%)',
            WebkitMask:
              'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* Imagem de fundo */}
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src="/images/convite-fundo.jpg"
            alt=""
            className="size-full object-cover object-center"
          />
          {/* Camadas para legibilidade do texto sobre a imagem */}
          <div className="absolute inset-0 bg-card/65" />
          <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-card/60 to-card/90" />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center px-6 pb-8 pt-9 text-center">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-7 w-auto"
          />

          {/* Selo de confirmação animado */}
          <div className="relative mt-7 mb-6 flex items-center justify-center">
            <span
              className={`absolute inline-flex size-24 rounded-full bg-primary/20 transition-transform duration-700 ${
                mounted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
              aria-hidden="true"
            />
            <span
              className={`relative flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-500 ${
                mounted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              <Check className="size-10" strokeWidth={3} aria-hidden="true" />
            </span>
          </div>

          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Pagamento confirmado
          </span>

          <h1 className="text-balance text-2xl font-bold leading-tight text-foreground">
            Seu Plano Criadora já está ativo
          </h1>

          <p className="mx-auto mt-3 max-w-[20rem] text-pretty text-sm leading-relaxed text-muted-foreground">
            Recebemos a confirmação do seu PIX e seu Plano Criadora foi ativado com sucesso. Agora é
            só entrar na sua conta para aproveitar tudo o que preparamos para você.
          </p>

          <Link
            href="/minha-conta"
            className="luna-gradient-cta mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/40 ring-1 ring-inset ring-white/20 transition active:scale-[0.98]"
          >
            Acessar minha conta
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            Acesso protegido e exclusivo
          </p>
        </div>
      </div>
    </section>
  )
}
