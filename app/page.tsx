'use client'

import { useState } from 'react'
import { ShieldCheck, Lock, Zap, UserPlus, Camera, Wallet } from 'lucide-react'
import { SaleNotification } from '@/components/sale-notification'
import { HowItWorksStep } from '@/components/how-it-works-step'
import { EarningsRank } from '@/components/earnings-rank'
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

const ranking = [
  { rank: 1, handle: '@luna_***892', amount: 'R$ 48.720', growth: '+18% no mês' },
  { rank: 2, handle: '@priv_***415', amount: 'R$ 39.450', growth: '+12% no mês' },
  { rank: 3, handle: '@anon_***073', amount: 'R$ 31.280', growth: '+9% no mês' },
  {
    rank: 4,
    handle: 'Você começa aqui',
    amount: 'R$ 0',
    growth: 'entre hoje',
    highlight: true,
  },
]

const TOTAL_STEPS = 3

export default function Page() {
  const [step, setStep] = useState(0)
  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <PageBackground />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-10 pt-8">
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
          <div key="step-0" className="animate-screen flex flex-col">
            <section
              className="animate-item mt-7 text-center"
              style={{ animationDelay: '60ms' }}
            >
              <h1 className="text-balance font-sans text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground">
                Aqui no Luna Privê você pode ganhar mais de{' '}
                <span className="text-primary">R$15 mil</span> todos os meses.
              </h1>
              <p className="mt-2.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                Aqui, você posta e vende na hora e recebe via PIX.
              </p>
            </section>

            <section
              className="animate-item mt-6"
              style={{ animationDelay: '160ms' }}
              aria-label="Vendas recentes"
            >
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

            <div className="animate-item mt-7" style={{ animationDelay: '260ms' }}>
              <button
                type="button"
                onClick={next}
                className="luna-gradient block w-full rounded-xl py-4 text-center text-base font-bold text-primary-foreground shadow-[0_8px_30px_-6px] shadow-primary/60 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
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
          <div key="step-1" className="animate-screen flex flex-col">
            <section
              className="animate-item mt-7 text-center"
              style={{ animationDelay: '60ms' }}
            >
              <h1 className="text-balance font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-foreground">
                Como funciona o <span className="text-primary">Luna Privé</span>?
              </h1>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                Simples, anônimo e direto pro seu PIX.
              </p>
            </section>

            <section
              className="animate-item mt-6 flex flex-col gap-3"
              style={{ animationDelay: '160ms' }}
              aria-label="Etapas"
            >
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
              className="luna-border animate-item mt-5 flex items-stretch rounded-2xl bg-card/70 backdrop-blur-md"
              style={{ animationDelay: '260ms' }}
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

            <div className="animate-item mt-7" style={{ animationDelay: '360ms' }}>
              <button
                type="button"
                onClick={next}
                className="luna-gradient block w-full rounded-xl py-4 text-center text-base font-bold text-primary-foreground shadow-[0_8px_30px_-6px] shadow-primary/60 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Resultados / prova social */}
        {step === 2 && (
          <div key="step-2" className="animate-screen flex flex-col">
            {/* Hero com número gigante */}
            <section
              className="animate-item mt-7 text-center"
              style={{ animationDelay: '60ms' }}
            >
              <h1 className="text-balance font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-foreground">
                Junte-se a{' '}
                <span className="font-extrabold text-primary">
                  <span className="text-[1.05em]">+1.200</span> usuárias
                </span>{' '}
                que já faturam{' '}
                <span className="font-extrabold text-primary">+R$ 10 mil</span> por mês.
              </h1>
              <p className="mt-2.5 text-balance text-sm leading-relaxed text-muted-foreground">
                Anônimas, no controle e ganhando de verdade no Luna Privé.
              </p>
            </section>

            {/* Ranking de faturamento */}
            <section
              className="animate-item mt-6"
              style={{ animationDelay: '180ms' }}
              aria-label="Ranking de faturamento"
            >
              <div className="mb-2.5 flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Top faturamento do mês
                </h2>
                <span className="text-[0.7rem] font-medium text-muted-foreground">
                  anônimo
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {ranking.map((r) => (
                  <EarningsRank key={r.rank} {...r} />
                ))}
              </div>
            </section>

            <div className="animate-item mt-7" style={{ animationDelay: '300ms' }}>
              <button
                type="button"
                className="luna-gradient block w-full rounded-xl py-4 text-center text-base font-bold text-primary-foreground shadow-[0_8px_30px_-6px] shadow-primary/60 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              >
                Quero entrar pro ranking
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Sua posição começa hoje. Sem rosto, sem nome.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
