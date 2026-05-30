import Link from 'next/link'
import { UserPlus, Camera, Wallet } from 'lucide-react'
import { PageBackground } from '@/components/page-background'
import { HowItWorksStep } from '@/components/how-it-works-step'

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

const stats = [
  { value: '+15.000', label: 'vendas acontecendo todos os dias' },
  { value: '+6.000', label: 'usuárias cadastradas no Luna' },
]

export default function HowItWorksPage() {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <PageBackground />

      <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col px-5 pb-6 pt-8">
        <header className="flex justify-center">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-9 w-auto"
          />
        </header>

        <section className="mt-6 text-center">
          <h1 className="text-balance font-sans text-[1.55rem] font-semibold leading-tight tracking-tight text-foreground">
            Como funciona o <span className="text-primary">Luna Privé</span>?
          </h1>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
            Simples, anônimo e direto pro seu PIX.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-3" aria-label="Etapas">
          {steps.map((step, i) => (
            <HowItWorksStep
              key={step.number}
              number={step.number}
              icon={step.icon}
              title={step.title}
              description={step.description}
              isLast={i === steps.length - 1}
            />
          ))}
        </section>

        <section
          className="mt-5 flex items-stretch rounded-2xl border border-primary/30 bg-card/70 backdrop-blur-md"
          aria-label="Números"
        >
          {stats.map((stat, i) => (
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
          <Link
            href="/resultados"
            className="block w-full rounded-xl bg-gradient-to-b from-primary to-[oklch(0.56_0.24_10)] py-4 text-center text-base font-bold text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            Continuar
          </Link>
        </div>
      </div>
    </main>
  )
}
