'use client'

import { useState } from 'react'
import { primeSounds, playTabTap } from '@/lib/sounds'
import {
  ShieldCheck,
  Lock,
  Zap,
  UserPlus,
  Camera,
  Wallet,
  TrendingUp,
  Footprints,
  Smartphone,
} from 'lucide-react'
import { AnimatedSalesFeed } from '@/components/animated-sales-feed'
import { HowItWorksStep } from '@/components/how-it-works-step'
import { TestimonialCarousel } from '@/components/testimonial-carousel'
import { MythCard } from '@/components/myth-card'
import { PrivacyStep } from '@/components/privacy-step'
import { CommunityStep } from '@/components/community-step'
import { WhyLunaStep } from '@/components/why-luna-step'
import { MentorQuiz } from '@/components/mentor-quiz'
import { GuidedAppDemo } from '@/components/guided-app-demo'
import { CtaButton } from '@/components/cta-button'
import { PageBackground } from '@/components/page-background'
import { AgeGate } from '@/components/age-gate'

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
    handle: '@pes_luxury',
    city: 'Rio de Janeiro',
    amount: 'R$ 62.870,00',
    avatar: '/images/avatar-1.png',
    tenure: 'há 6 meses na plataforma',
  },
  {
    handle: '@secret_mg',
    city: 'Belo Horizonte',
    amount: 'R$ 27.590,00',
    avatar: '/images/avatar-2.png',
    tenure: 'há 3 meses na plataforma',
  },
  {
    handle: '@anon_sp',
    city: 'São Paulo',
    amount: 'R$ 41.230,00',
    avatar: '/images/avatar-3.png',
    tenure: 'há 5 meses na plataforma',
  },
  {
    handle: '@luna_rs',
    city: 'Porto Alegre',
    amount: 'R$ 33.910,00',
    avatar: '/images/avatar-4.png',
    tenure: 'há 4 meses na plataforma',
  },
  {
    handle: '@priv_ba',
    city: 'Salvador',
    amount: 'R$ 29.480,00',
    avatar: '/images/avatar-5.png',
    tenure: 'há 2 meses na plataforma',
  },
]

const myths = [
  {
    icon: Footprints,
    title: 'Não precisa ter pé perfeito',
    description:
      'Existem clientes para TODOS os tipos de gostos. Pés grandes, pequenos, lisos, com marquinha de chinelo... todos vendem!',
  },
  {
    icon: Camera,
    title: 'Sem câmera profissional',
    description:
      'Fotos com celular comum funcionam perfeitamente. O que importa é a iluminação e o ângulo certo.',
  },
  {
    icon: Smartphone,
    title: 'Qualquer celular serve',
    description:
      'Não precisa do último iPhone. Celulares simples já tiram fotos com qualidade suficiente para vender.',
  },
]

const TOTAL_STEPS = 9

export default function Page() {
  const [step, setStep] = useState(0)
  const [verified, setVerified] = useState(false)
  const next = () => {
    // Som suave de toque ao avançar em qualquer etapa do funil.
    primeSounds()
    playTabTap()
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <PageBackground />

      {!verified && <AgeGate onConfirm={() => setVerified(true)} />}

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-10 pt-8">
        <header className="flex flex-col items-center gap-4">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-11 w-auto"
          />
        </header>

        {/* STEP 1 — Prova de ganhos */}
        {step === 0 && (
          <div key="step-0" className={`flex flex-col ${verified ? 'animate-screen' : ''}`}>
            <section
              className={`mt-7 text-center ${verified ? 'animate-item' : ''}`}
              style={{ animationDelay: '60ms' }}
            >
              <h1 className="text-balance font-sans text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground">
                Aqui, você pode ganhar mais de{' '}
                <span className="text-primary">R$15 mil</span> com seus Pés
              </h1>
              <p className="mt-2.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                Aqui seus Pés te fazem Rainha. Você posta, vende na hora e
                recebe via PIX.
              </p>
            </section>

            <AnimatedSalesFeed
              notifications={notifications}
              shouldAnimate={verified}
              footer={
                <>
                  <CtaButton onClick={next}>Entrar e ver como funciona</CtaButton>
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
                </>
              }
            />
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
              className="luna-border animate-item mt-5 flex items-stretch rounded-2xl bg-card"
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
              <CtaButton onClick={next}>Continuar</CtaButton>
            </div>
          </div>
        )}

        {/* STEP 3 — Comunidade e garantias */}
        {step === 2 && (
          <div key="step-2" className="animate-screen flex flex-col">
            <CommunityStep onContinue={next} />
          </div>
        )}

        {/* STEP 4 — Resultados / prova social */}
        {step === 3 && (
          <div key="step-3" className="animate-screen flex flex-col">
            <section
              className="animate-item mt-7 text-center"
              style={{ animationDelay: '60ms' }}
            >
              <h1 className="text-balance font-sans text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground">
                Quanto nossas <span className="text-primary">Lunas</span> faturam
              </h1>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                Ganhos reais de usuárias ativas na plataforma
              </p>
              <span className="luna-border mt-4 inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-1.5 text-sm font-semibold text-primary">
                <TrendingUp className="size-4" aria-hidden="true" />
                Média acima de R$28.000/mês
              </span>
            </section>

            {/* Carrossel de depoimentos em loop infinito */}
            <section
              className="animate-item -mx-5 mt-6"
              style={{ animationDelay: '180ms' }}
              aria-label="Depoimentos de usuárias"
            >
              <TestimonialCarousel items={testimonials} />
            </section>

<section
              className={`mt-7 text-center ${verified ? 'animate-item' : ''}`}
              style={{ animationDelay: '60ms' }}
            >
              <p className="text-balance text-base font-semibold text-foreground">
                Esses resultados são <span className="text-primary">reais</span>.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                E você pode começar hoje mesmo.
              </p>
            </section>

            <div className="animate-item mt-5" style={{ animationDelay: '340ms' }}>
              <CtaButton onClick={next}>Continuar</CtaButton>
            </div>
          </div>
        )}

        {/* STEP 5 — Quebra de objeções / mitos */}
        {step === 4 && (
          <div key="step-4" className="animate-screen flex flex-col">
            <section
              className="animate-item mt-7 text-center"
              style={{ animationDelay: '60ms' }}
            >
              <h1 className="flex items-center justify-center gap-2 text-balance font-sans text-[1.7rem] font-bold leading-tight tracking-tight text-foreground">
                Pare de se limitar
                <span aria-hidden="true">🚫</span>
              </h1>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                Esses mitos impedem muitas mulheres de começar. Mas a verdade é
                outra:
              </p>
            </section>

            <section
              className="animate-item mt-6 flex flex-col gap-3"
              style={{ animationDelay: '160ms' }}
              aria-label="Mitos sobre vender no Luna Privé"
            >
              {myths.map((m) => (
                <MythCard
                  key={m.title}
                  icon={m.icon}
                  title={m.title}
                  description={m.description}
                />
              ))}
            </section>

            <div className="animate-item mt-7" style={{ animationDelay: '300ms' }}>
              <CtaButton onClick={next}>
                Entendi, quero começar! <span aria-hidden="true">💪</span>
              </CtaButton>
            </div>
          </div>
        )}

        {/* STEP 6 — Privacidade total */}
        {step === 5 && (
          <div key="step-5" className="animate-screen flex flex-col">
            <PrivacyStep onContinue={next} />
          </div>
        )}

        {/* STEP 7 — Por que a Luna Privé (comparação) */}
        {step === 6 && (
          <div key="step-6" className="animate-screen flex flex-col">
            <WhyLunaStep onContinue={next} />
          </div>
        )}

        {/* STEP 8 — Jornada gamificada dentro da plataforma */}
        {step === 7 && (
          <div key="step-7" className="animate-screen flex flex-col">
            <MentorQuiz
              finalLabel="Quero meu convite de acesso"
              onComplete={next}
            />
          </div>
        )}

        {/* STEP 9 — Demonstração guiada do app (tela cheia) */}
        {step === 8 && <GuidedAppDemo key="step-8" onComplete={next} />}
      </div>
    </main>
  )
}
