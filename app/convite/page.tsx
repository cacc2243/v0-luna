'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail } from 'lucide-react'
import { PageBackground } from '@/components/page-background'
import { AccountSummary } from '@/components/convite/account-summary'
import { PriceCard } from '@/components/convite/price-card'
import { BonusAndReviews } from '@/components/convite/bonus-and-reviews'
import { CompanyInfo } from '@/components/convite/company-info'
import { PixModal } from '@/components/convite/pix-modal'
import { WelcomePopup } from '@/components/convite/welcome-popup'
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
  // Indica se ja recebemos o valor real do painel. Enquanto false, o preco
  // fica com blur para nao "piscar" o valor padrao antes do correto.
  const [priceReady, setPriceReady] = useState(false)

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
        if (!active) return
        const cents =
          d && typeof d.inviteAmountCents === 'number' ? d.inviteAmountCents : DEFAULT_INVITE_CENTS
        if (d && typeof d.inviteAmountCents === 'number') {
          setInviteCents(d.inviteAmountCents)
        }
        // Mesmo se a resposta nao trouxer o valor, liberamos o preco (cai no padrao).
        setPriceReady(true)
        // InitiateCheckout: cliente chegou na pagina de checkout do convite,
        // com o valor real ja conhecido.
        fbTrack('InitiateCheckout', {
          value: cents / 100,
          currency: 'BRL',
          content_name: 'Convite Luna Privé',
          content_type: 'product',
        })
      })
      .catch(() => {
        if (active) setPriceReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  function updateField(field: keyof SignupData, value: string) {
    setData((prev) => {
      const next = { ...prev, [field]: value }
      try {
        sessionStorage.setItem('luna_signup', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function handleAcquire() {
    // Evita gerar PIX com valor padrao antes do valor real do painel chegar.
    if (!priceReady) return

    // O e-mail e obrigatorio e precisa ser valido para gerar o PIX corretamente.
    const email = data.email.trim()
    if (!email || email === 'seu@email.com' || !EMAIL_REGEX.test(email)) {
      alert('Por favor, informe um e-mail válido tocando no lápis ao lado do campo E-mail.')
      return
    }

    // Username e chave PIX sao complementares: se vazios, criamos valores
    // apenas para gerar o PIX sem travar o fluxo.
    if (!data.username || !data.pixKey) {
      const fallbackUser = data.username || `cliente_${email.split('@')[0]}`.slice(0, 24)
      setData((prev) => {
        const next = {
          ...prev,
          email,
          username: prev.username || fallbackUser,
          pixKey: prev.pixKey || email,
        }
        try {
          sessionStorage.setItem('luna_signup', JSON.stringify(next))
        } catch {
          // ignore
        }
        return next
      })
    }

    setShowPixModal(true)
  }

  function handlePaymentConfirmed() {
    setShowPixModal(false)
    // Redirecionar para a tela de confirmação após o pagamento aprovado
    router.push('/confirmation')
  }

  return (
    <main className="relative min-h-[100dvh] w-full bg-background">
      <WelcomePopup />
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
          onUpdate={updateField}
        />

        {/* Preço + garantia */}
        <PriceCard onAcquire={handleAcquire} amountCents={inviteCents} priceReady={priceReady} />

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
