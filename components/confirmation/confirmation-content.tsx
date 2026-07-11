'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, ArrowRight, Sparkles, ShieldCheck, Mail, AlertTriangle } from 'lucide-react'

export function ConfirmationContent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative z-10 flex w-full max-w-sm flex-1 flex-col justify-center">
      {/* Conteúdo em tela cheia (sem card/modal) */}
      <div className="flex flex-col items-center text-center">
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
            Seja bem-vindo(a) ao Luna Privé!
          </h1>

          <p className="mx-auto mt-3 max-w-[20rem] text-pretty text-sm leading-relaxed text-muted-foreground">
            Recebemos a confirmação do seu PIX e seu acesso já está liberado. É uma alegria ter você
            com a gente — tudo o que preparamos já está pronto para você aproveitar.
          </p>

          {/* Aviso em destaque: dados de acesso por e-mail + checar spam */}
          <div className="mt-5 w-full rounded-2xl border-2 border-primary/50 bg-primary/10 px-4 py-4 text-left shadow-md shadow-primary/20">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mail className="size-4" aria-hidden="true" />
              </span>
              <p className="text-sm font-bold leading-tight text-foreground">
                Enviamos seu acesso por e-mail
              </p>
            </div>
            <p className="mt-2.5 text-pretty text-xs leading-relaxed text-muted-foreground">
              Seus dados de acesso foram enviados para o seu e-mail cadastrado.
            </p>
            {/* Alerta específico da caixa de spam, em destaque máximo */}
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-primary/50 bg-primary/15 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-pretty text-xs leading-relaxed text-foreground">
                <strong className="font-bold">Não achou o e-mail?</strong> Confira a{' '}
                <strong className="font-bold text-primary">caixa de spam</strong> ou a aba{' '}
                <strong className="font-bold text-primary">Promoções</strong> e marque como{' '}
                <strong className="font-semibold">&quot;não é spam&quot;</strong> para receber os
                próximos normalmente.
              </p>
            </div>
          </div>

          <Link
            href="/minha-conta"
            className="luna-gradient-cta mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/40 ring-1 ring-inset ring-white/20 transition active:scale-[0.98]"
          >
            Entrar agora!
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
