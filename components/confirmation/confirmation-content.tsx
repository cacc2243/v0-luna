'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react'

export function ConfirmationContent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative z-10 w-full max-w-md">
      <div className="flex flex-col items-center rounded-3xl border border-border/60 bg-card/90 px-6 py-10 text-center shadow-2xl backdrop-blur-md">
        <Image
          src="/images/luna-prive-logo.png"
          alt="Luna Privé"
          width={120}
          height={40}
          className="mb-8 h-9 w-auto"
          priority
        />

        {/* Selo de confirmação animado */}
        <div className="relative mb-6 flex items-center justify-center">
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

        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Pagamento confirmado
        </span>

        <h1 className="text-balance text-2xl font-bold leading-tight text-foreground">
          Seu Plano Criadora já está ativo
        </h1>

        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
          Recebemos a confirmação do seu PIX e seu Plano Criadora foi ativado com sucesso. Agora é só
          entrar na sua conta para aproveitar tudo o que preparamos para você.
        </p>

        <Link
          href="/minha-conta"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
        >
          Acessar minha conta
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          Acesso protegido e exclusivo
        </p>
      </div>
    </section>
  )
}
