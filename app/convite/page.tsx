'use client'

import { useEffect, useState } from 'react'
import { Lock, Mail, BookOpen, Users, Images, ChevronRight } from 'lucide-react'
import { PageBackground } from '@/components/page-background'
import { AccountSummary } from '@/components/convite/account-summary'
import { PriceCard } from '@/components/convite/price-card'
import { BonusAndReviews } from '@/components/convite/bonus-and-reviews'
import { CompanyInfo } from '@/components/convite/company-info'

interface SignupData {
  username: string
  email: string
  pixType: string
  pixKey: string
}

const bonusChips = [
  { icon: BookOpen, label: 'Guia: Como faturar seus primeiros R$10 mil' },
  { icon: Users, label: 'Acesso à Comunidade VIP' },
  { icon: Images, label: 'Pack de Poses Profissionais' },
]

export default function ConvitePage() {
  const [data, setData] = useState<SignupData>({
    username: '',
    email: '',
    pixType: '',
    pixKey: '',
  })

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('luna_signup')
      if (raw) setData(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  return (
    <main className="relative min-h-[100dvh] w-full bg-background">
      <div className="fixed inset-0 z-0">
        <PageBackground />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-5 py-3.5">
          <Lock className="size-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Finalizar cadastro</span>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-8 px-5 pb-12 pt-7">
        {/* Hero */}
        <header className="flex flex-col items-center text-center">
          <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-9 w-auto" />
          <h1 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground">
            Conquiste seu convite
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            Confirme seus dados abaixo e garanta seu Convite Exclusivo ao Luna Privé.
          </p>

          <div className="luna-border mt-5 flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3">
            <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-pretty text-xs font-medium leading-relaxed text-foreground">
              Você receberá o acesso ao Luna Privé por e-mail.
            </p>
          </div>
        </header>

        {/* Dados da conta */}
        <AccountSummary
          username={data.username}
          email={data.email}
          pixType={data.pixType}
          pixKey={data.pixKey}
        />

        {/* Bônus inclusos (resumo) */}
        <section aria-labelledby="bonus-inclusos">
          <h2
            id="bonus-inclusos"
            className="mb-2.5 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
          >
            <span className="size-1.5 rounded-full luna-gradient" aria-hidden="true" />
            Bônus inclusos
          </h2>
          <div className="flex flex-col gap-2.5">
            {bonusChips.map((b) => (
              <div
                key={b.label}
                className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <b.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">{b.label}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>

        {/* Preço + garantia */}
        <PriceCard />

        {/* Depoimentos + bônus detalhado */}
        <BonusAndReviews />

        {/* Empresa */}
        <CompanyInfo />
      </div>
    </main>
  )
}
