'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail } from 'lucide-react'
import { PageBackground } from '@/components/page-background'
import { AccountSummary } from '@/components/convite/account-summary'
import { PriceCard } from '@/components/convite/price-card'
import { BonusAndReviews } from '@/components/convite/bonus-and-reviews'
import { CompanyInfo } from '@/components/convite/company-info'
import { PixModal } from '@/components/convite/pix-modal'
import { fbTrack } from '@/lib/fb/track'

interface SignupData {
  username: string
  email: string
  pixType: string
  pixKey: string
}

const DEFAULT_INVITE_CENTS = 2480

export default function ConvitePage() {
  const router = useRouter()
  const [data, setData] = useState<SignupData>({
    username: '',
    email: '',
    pixType: '',
    pixKey: '',
  })
  const [showPixModal, setShowPixModal] = useState(false)
  // Valor do convite controlado pelo painel (fonte da verdade no servidor).
  const [inviteCents, setInviteCents] = useState(DEFAULT_INVITE_CENTS)
  const checkoutFiredRef = useRef(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('luna_signup')
      if (raw) setData(JSON.parse(raw))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    let active = true
    fetch('/api/settings/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && typeof d.inviteAmountCents === 'number') {
          setInviteCents(d.inviteAmountCents)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Evento Facebook: InitiateCheckout ao entrar na pagina de convite (uma vez).
  useEffect(() => {
    if (checkoutFiredRef.current) return
    checkoutFiredRef.current = true
    try {
      fbTrack('InitiateCheckout', {
        content_name: 'Convite Luna Privé',
        value: inviteCents / 100,
        currency: 'BRL',
      })
    } catch {
      // nunca bloquear o fluxo por causa do pixel
    }
  }, [inviteCents])

  function handleAcquire() {
    if (!data.email || data.email === 'seu@email.com') {
      alert('Por favor, complete seu cadastro primeiro.')
      return
    }
    setShowPixModal(true)
  }

  function handlePaymentConfirmed() {
    setShowPixModal(false)
    // Redirecionar para minha-conta após pagamento
    router.push('/minha-conta?convite=pago')
  }

  return (
    <main className="relative min-h-[100dvh] w-full bg-background">
      <div className="fixed inset-0 z-0">
        <PageBackground />
        <div className="absolute inset-0 bg-background/70" aria-hidden="true" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-5 py-3.5">
          <Lock className="size-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Finalizar cadastro</span>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-7 px-5 pb-12 pt-8">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 px-6 py-7 backdrop-blur-sm">
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col">
            <img
              src="/images/luna-prive-logo.png"
              alt="Luna Privé"
              className="h-7 w-auto self-start"
            />
            <h1 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground">
              Conquiste seu convite
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              Confirme seus dados abaixo e garanta seu Convite Exclusivo ao Luna Privé.
            </p>

            <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-border/60 bg-background/50 px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Mail className="size-4" aria-hidden="true" />
              </span>
              <p className="text-pretty text-xs font-medium leading-relaxed text-foreground">
                Você receberá o acesso ao Luna Privé por e-mail.
              </p>
            </div>
          </div>
        </header>

        {/* Dados da conta */}
        <AccountSummary
          username={data.username}
          email={data.email}
          pixType={data.pixType}
          pixKey={data.pixKey}
        />

        {/* Preço + garantia */}
        <PriceCard onAcquire={handleAcquire} amountCents={inviteCents} />

        {/* Depoimentos + bônus detalhado */}
        <BonusAndReviews />

        {/* Empresa */}
        <CompanyInfo />
      </div>

      {/* Modal de PIX */}
      <PixModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        email={data.email}
        amount={inviteCents / 100}
        userName={data.username}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </main>
  )
}
