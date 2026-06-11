'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail } from 'lucide-react'
import { AccountSummary } from '@/components/convite/account-summary'
import { PriceCard } from '@/components/convite/price-card'
import { BonusAndReviews } from '@/components/convite/bonus-and-reviews'
import { CompanyInfo } from '@/components/convite/company-info'
import { PixModal } from '@/components/convite/pix-modal'
import { WelcomePopup } from '@/components/convite/welcome-popup'

interface SignupData {
  username: string
  email: string
  pixType: string
  pixKey: string
}

export function ConviteClient({ initialInviteCents }: { initialInviteCents: number }) {
  const router = useRouter()
  // Le os dados do cadastro de forma sincrona no primeiro render do cliente
  // (lazy initializer), evitando o "flash" de placeholders que acontecia
  // quando a leitura era feita dentro de um useEffect (depois do paint).
  const [data, setData] = useState<SignupData>(() => {
    if (typeof window === 'undefined') {
      return { username: '', email: '', pixType: '', pixKey: '' }
    }
    try {
      const raw = sessionStorage.getItem('luna_signup')
      if (raw) {
        const parsed = JSON.parse(raw)
        return {
          username: parsed.username ?? '',
          email: parsed.email ?? '',
          pixType: parsed.pixType ?? '',
          pixKey: parsed.pixKey ?? '',
        }
      }
    } catch {
      // ignore
    }
    return { username: '', email: '', pixType: '', pixKey: '' }
  })
  const [showPixModal, setShowPixModal] = useState(false)
  // Valor do convite ja chega resolvido do servidor (Server Component), entao
  // o preco aparece imediatamente, sem blur nem fetch no cliente.
  const [inviteCents] = useState(initialInviteCents)

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
      <div className="fixed inset-0 z-0">
        <img
          src="/images/convite-fundo.jpg"
          alt=""
          className="size-full object-cover object-center"
        />
        {/* Camadas de legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/85" />
        <div className="absolute inset-0 bg-background/40" aria-hidden="true" />
      </div>

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-5 py-3.5">
          <Lock className="size-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Ativar Plano Criadora</span>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-col gap-7 px-5 pb-12 pt-8">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 px-5 py-5 backdrop-blur-sm">
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col">
            <img
              src="/images/luna-prive-logo.png"
              alt="Luna Privé"
              className="h-6 w-auto self-start"
            />
            <h1 className="mt-4 text-balance text-2xl font-extrabold leading-tight tracking-tight text-foreground">
              Ative seu Plano Criadora
            </h1>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
              Confirme seus dados abaixo e ative seu Plano de Criadora Luna para começar a vender.
            </p>

            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-border/60 bg-background/50 px-3.5 py-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Mail className="size-3.5" aria-hidden="true" />
              </span>
              <p className="text-pretty text-xs font-medium leading-relaxed text-foreground">
                Você receberá a confirmação do seu Plano Criadora por e-mail.
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
        <PriceCard onAcquire={handleAcquire} amountCents={inviteCents} priceReady />

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
        pixType={data.pixType}
        pixKey={data.pixKey}
        trackInitiateCheckout
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      {/* Modal de código de convite (abre ao entrar na tela) */}
      <WelcomePopup />
    </main>
  )
}
