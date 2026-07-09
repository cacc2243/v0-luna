'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { readCookie, newEventId, fbTrackWhenReady } from '@/lib/fb/track'
import { getAttributionForCheckout } from '@/lib/fb/attribution'
import { PageBackground } from '@/components/page-background'
import { AccountSummary } from '@/components/convite/account-summary'
import { PriceCard } from '@/components/convite/price-card'
import { BonusAndReviews } from '@/components/convite/bonus-and-reviews'
import { FaqSection } from '@/components/convite/faq-section'
import { CompanyInfo } from '@/components/convite/company-info'
import { PixModal } from '@/components/convite/pix-modal'
import { PreCheckoutModal } from '@/components/convite/pre-checkout-modal'
import { ConfirmAcquireModal } from '@/components/convite/confirm-acquire-modal'
import { WelcomePopup } from '@/components/convite/welcome-popup'
import { SocialProofToaster } from '@/components/convite/social-proof-toaster'

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
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPreCheckout, setShowPreCheckout] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)
  // Sinaliza que o PIX já foi 100% gerado e está pronto para exibir. Enquanto
  // false, a animação de pré-checkout permanece na tela (sem lacunas).
  const [pixReady, setPixReady] = useState(false)
  // Ativa as notificações de prova social no topo após o modal de convite fechar
  const [socialProofActive, setSocialProofActive] = useState(false)
  // Valor do convite ja chega resolvido do servidor (Server Component), entao
  // o preco aparece imediatamente, sem blur nem fetch no cliente.
  const [inviteCents] = useState(initialInviteCents)

  // InitiateCheckout: disparado ao ENTRAR na pagina /convite (uma unica vez),
  // e nao mais quando o PIX e gerado. Pixel (browser) + Conversions API
  // (servidor) com o MESMO event_id para deduplicacao. Nunca quebra a pagina.
  const initiateCheckoutSentRef = useRef(false)
  useEffect(() => {
    if (initiateCheckoutSentRef.current) return
    initiateCheckoutSentRef.current = true
    try {
      const value = inviteCents / 100
      const icEventId = newEventId('ic')
      fbTrackWhenReady(
        'InitiateCheckout',
        {
          value,
          currency: 'BRL',
          content_name: 'Convite Luna Privé',
          content_type: 'product',
        },
        icEventId,
      )

      const trimmedName = (data.username || '').trim()
      const parts = trimmedName ? trimmedName.split(/\s+/) : []
      const firstName = parts.length > 0 ? parts[0] : null
      const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null
      const normalizedPixType = (data.pixType || '').toLowerCase()
      const phone =
        normalizedPixType.includes('tele') || normalizedPixType.includes('phone')
          ? data.pixKey || null
          : null

      const attribution = getAttributionForCheckout()
      fetch('/api/fb/initiate-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: icEventId,
          eventSourceUrl: typeof window !== 'undefined' ? window.location.href : null,
          fbp: readCookie('_fbp'),
          fbc: readCookie('_fbc'),
          email: data.email || null,
          name: trimmedName || null,
          firstName,
          lastName,
          phone,
          value,
          attribution,
        }),
      }).catch(() => {})
    } catch {
      // o tracking nunca bloqueia a pagina
    }
    // Dispara apenas no mount (entrada na pagina).
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Abre o popup de confirmação antes de gerar o PIX. A geração só começa
    // quando a usuária confirmar em "Sim, gerar agora!".
    setShowConfirm(true)
  }

  // Confirmação do popup: aqui sim iniciamos a geração do PIX (modal montado
  // por baixo) e mostramos a animação de pré-checkout por cima. O fetch
  // acontece em paralelo à animação, que só sai de cena quando o PIX estiver
  // 100% pronto.
  function handleConfirmAcquire() {
    setShowConfirm(false)
    setPixReady(false)
    setShowPixModal(true)
    setShowPreCheckout(true)
  }

  // Encerra a animação de pré-checkout (o PIX já está pronto e montado por baixo).
  function handlePreCheckoutConfirm() {
    setShowPreCheckout(false)
  }

  function handlePaymentConfirmed() {
    setShowPixModal(false)
    setPixReady(false)
    // Redirecionar para a tela de confirmação após o pagamento aprovado
    router.push('/confirmation')
  }

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <PageBackground />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-12 pt-8">
        {/* Logo centralizada, igual às demais telas do fluxo */}
        <header className="flex flex-col items-center gap-4">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-11 w-auto"
          />
        </header>

        {/* Hero centralizado no mesmo padrão do fluxo */}
        <section className="mt-7 text-center">
          <span className="luna-border inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-1.5 text-sm font-semibold text-primary">
            <Lock className="size-4" aria-hidden="true" />
            Adquirir meu Convite
          </span>
          <h1 className="mt-4 text-balance font-sans text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground">
            Resgate seu <span className="text-primary">Convite Luna</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-foreground">
            Seu convite Luna garante acesso seguro e confiável à plataforma Luna Privé. Todas as usuárias possuem um convite ativo.
          </p>
        </section>

        <div className="mt-8 flex flex-col gap-7">
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

        {/* Perguntas frequentes (abaixo dos bônus) */}
        <FaqSection />

        {/* Empresa */}
        <CompanyInfo />
        </div>
      </div>

      {/* Popup de confirmação (antes de iniciar a geração do PIX) */}
      <ConfirmAcquireModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmAcquire}
        userName={data.username}
        amountCents={inviteCents}
      />

      {/* Etapa de pré-confirmação (antes de gerar o PIX) */}
      <PreCheckoutModal
        isOpen={showPreCheckout}
        onClose={() => setShowPreCheckout(false)}
        onConfirm={handlePreCheckoutConfirm}
        email={data.email}
        amountCents={inviteCents}
        ready={pixReady}
      />

      {/* Modal de PIX */}
      <PixModal
        isOpen={showPixModal}
        onClose={() => {
          setShowPixModal(false)
          setPixReady(false)
        }}
        email={data.email}
        amount={inviteCents / 100}
        userName={data.username}
        pixType={data.pixType}
        pixKey={data.pixKey}
        onReady={() => setPixReady(true)}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      {/* Modal de código de convite (abre ao entrar na tela) */}
      <WelcomePopup onClose={() => setSocialProofActive(true)} />

      {/* Notificações de prova social no topo (após fechar o modal) */}
      <SocialProofToaster active={socialProofActive} />
    </main>
  )
}
