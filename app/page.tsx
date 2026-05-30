'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  Zap,
  UserPlus,
  Camera,
  Wallet,
  TrendingUp,
} from 'lucide-react'
import { SaleNotification } from '@/components/sale-notification'
import { HowItWorksStep } from '@/components/how-it-works-step'
import { TestimonialCard } from '@/components/testimonial-card'
import { PageBackground } from '@/components/page-background'

const notifications = [
  { title: 'Você vendeu o Pack 03', time: 'agora', amount: '+R$249,00' },
  { title: 'Você vendeu o Pack 07', time: 'agora', amount: '+R$189,00' },
  { title: 'Você vendeu o Pack 12', time: 'agora', amount: '+R$369,00' },
  { title: 'Presente recebido', time: 'agora', amount: '+R$600,00' },
]

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Cadastre-se no Luna',
    description: 'Crie sua conta anônima em menos de 2 minutos. Sem rosto, sem nome real.',
  },
  {
    number: 2,
    icon: Camera,
    title: 'Poste suas fotos e packs',
    description: 'Monte seu perfil e publique seus packs. Você define os preços.',
  },
  {
    number: 3,
    icon: Wallet,
    title: 'Receba direto no seu PIX',
    description: 'Compradores acessam o site e compram. Você saca na hora pro seu PIX.',
  },
]

const howStats = [
  { value: '+15.000', label: 'vendas acontecendo todos os dias' },
  { value: '+6.000', label: 'usuárias cadastradas no Luna' },
]

const testimonials = [
  {
    initials: 'MA',
    name: 'Marina A.',
    location: 'São Paulo, SP',
    quote: 'Em 3 meses larguei meu emprego. Hoje faturo bem mais, no meu tempo.',
    amount: 'R$ 14.200/mês',
  },
  {
    initials: 'JC',
    name: 'Júlia C.',
    location: 'Rio de Janeiro, RJ',
    quote: 'Ninguém sabe que sou eu. Posto, vendo e recebo no PIX na hora.',
    amount: 'R$ 11.800/mês',
  },
  {
    initials: 'BL',
    name: 'Bruna L.',
    location: 'Belo Horizonte, MG',
    quote: 'Comecei sem saber nada. Hoje tenho clientes fixos todo mês.',
    amount: 'R$ 10.500/mês',
  },
]

const avatars = ['LV', 'RS', 'TM', 'KP']

const TOTAL_STEPS = 3

export default function Page() {
  const [step, setStep] = useState(0)
  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <PageBackground />

      <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col px-5 pb-6 pt-8">
        <header className="flex flex-col items-center gap-4">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-11 w-auto"
          />
          {/* Progress indicator */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-primary'
                    : i < step
                      ? 'w-2 bg-primary/60'
                      : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </header>

        {/* STEP 1 — Prova de ganhos */}
        {step === 0 && (
          <div className="flex flex-1 flex-col">
            <section className="mt-7 text-center">
              <h1 className="text-balance font-sans text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground">
                Aqui no Luna Privê você pode ganhar mais de{' '}
                <span className="text-primary">R$15 mil</span> todos os meses.
              </h1>
              <p className="mt-2.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                Aqui, você posta e vende na hora e recebe via PIX.
              </p>
            </section>

            <section className="mt-6" aria-label="Vendas recentes">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vendas em tempo real
                </h2>
                <span className="flex items-center gap-1.5 text-xs font-medium text-positive">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-positive" />
                  </span>
                  ao vivo
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {notifications.map((n) => (
                  <SaleNotification
                    key={n.title + n.time}
                    title={n.title}
                    time={n.time}
                    amount={n.amount}
                  />
                ))}
              </div>
            </section>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={next}
                className="block w-full rounded-xl bg-gradient-to-b from-primary to-[oklch(0.56_0.24_10)] py-4 text-center text-base font-bold text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                Entrar e ver como funciona
              </button>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-positive" aria-hidden="true" />
                  Sem rosto
                </span>
                <span className="size-1 rounded-full bg-muted-foreground/40" />
                <span className="flex items-center gap-1.5">
                  <Lock className="size-3.5 text-positive" aria-hidden="true" />
                  Sem nome
                </span>
                <span className="size-1 rounded-full bg-muted-foreground/40" />
                <span className="flex items-center gap-1.5">
                  <Zap className="size-3.5 text-positive" aria-hidden="true" />
                  Só PIX
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Como funciona */}
        {step === 1 && (
          <div className="flex flex-1 flex-col">
            <section className="mt-7 text-center">
              <h1 className="text-balance font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-foreground">
                Como funciona o <span className="text-primary">Luna Privé</span>?
              </h1>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                Simples, anônimo e direto pro seu PIX.
              </p>
            </section>

            <section className="mt-6 flex flex-col gap-3" aria-label="Etapas">
              {steps.map((s, i) => (
                <HowItWorksStep
                  key={s.number}
                  number={s.number}
                  icon={s.icon}
                  title={s.title}
                  description={s.description}
                  isLast={i === steps.length - 1}
                />
              ))}
            </section>

            <section
              className="mt-5 flex items-stretch rounded-2xl border border-primary/30 bg-card/70 backdrop-blur-md"
              aria-label="Números"
            >
              {howStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex flex-1 flex-col items-center justify-center px-3 py-3 text-center ${
                    i === 0 ? 'border-r border-primary/20' : ''
                  }`}
                >
                  <p className="text-xl font-bold leading-none text-primary">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-pretty text-[0.7rem] leading-tight text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </section>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={next}
                className="block w-full rounded-xl bg-gradient-to-b from-primary to-[oklch(0.56_0.24_10)] py-4 text-center text-base font-bold text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Resultados / prova social */}
        {step === 2 && (
          <div className="flex flex-1 flex-col">
            <section className="mt-6 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-md">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                Resultados reais
              </span>
              <h1 className="mt-4 text-balance font-sans text-[1.5rem] font-semibold leading-tight tracking-tight text-foreground">
                Mais de <span className="text-primary">1.200 usuárias</span> já faturam{' '}
                <span className="text-primary">+R$ 10 mil</span> todos os meses.
              </h1>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                Anônimas, no controle e ganhando de verdade no Luna Privé.
              </p>
            </section>

            <section className="mt-5 flex flex-col gap-3" aria-label="Depoimentos">
              {testimonials.map((t) => (
                <TestimonialCard key={t.name} {...t} />
              ))}
            </section>

            <section
              className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-primary/30 bg-card/70 px-4 py-3 backdrop-blur-md"
              aria-label="Usuárias cadastradas"
            >
              <div className="flex -space-x-2.5">
                {avatars.map((a) => (
                  <span
                    key={a}
                    className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary/25 text-[0.65rem] font-bold text-primary"
                  >
                    {a}
                  </span>
                ))}
                <span className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-[0.6rem] font-bold text-primary-foreground">
                  +1k
                </span>
              </div>
              <p className="text-pretty text-xs leading-tight text-muted-foreground">
                <span className="font-bold text-foreground">+1.200 usuárias</span>{' '}
                cadastradas e faturando
              </p>
            </section>

            <div className="mt-auto pt-6">
              <button
                type="button"
                className="block w-full rounded-xl bg-gradient-to-b from-primary to-[oklch(0.56_0.24_10)] py-4 text-center text-base font-bold text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                Quero fazer parte
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
