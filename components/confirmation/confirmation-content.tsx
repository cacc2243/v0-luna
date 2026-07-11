'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, ArrowRight, Sparkles, ShieldCheck, Mail } from 'lucide-react'

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
              Seus dados de acesso foram enviados para o seu e-mail cadastrado. Se não encontrar na
              caixa de entrada, confira a{' '}
              <strong className="font-bold text-primary">caixa de spam</strong> ou a aba de{' '}
              <strong className="font-bold text-primary">promoções</strong> — e marque como{' '}
              <strong className="font-semibold text-foreground">&quot;não é spam&quot;</strong> para
              receber os próximos normalmente.
            </p>
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
      </div>
    </section>
  )
}
