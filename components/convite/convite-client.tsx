'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Users } from 'lucide-react'
import { PageBackground } from '@/components/page-background'
import { AccountSummary } from '@/components/convite/account-summary'
import { PriceCard } from '@/components/convite/price-card'
import { InstagramCard } from '@/components/convite/instagram-card'
import { PlatformFees } from '@/components/convite/platform-fees'
import { BonusAndReviews } from '@/components/convite/bonus-and-reviews'
import { CompanyInfo } from '@/components/convite/company-info'
import { PixModal } from '@/components/convite/pix-modal'
import { PreCheckoutModal } from '@/components/convite/pre-checkout-modal'

import { WelcomePopup } from '@/components/convite/welcome-popup'
import { SocialProofToaster } from '@/components/convite/social-proof-toaster'

interface SignupData {
  username: string
  email: string
  pixType: string
  pixKey: string
}

const EMPTY_SIGNUP: SignupData = { username: '', email: '', pixType: '', pixKey: '' }

/**
 * Resolve os dados da conta APENAS no cliente (nunca durante o SSR).
 * Precedencia: parametros da URL (link do e-mail) > dados do servidor
 * (searchParams) > sessionStorage (fluxo normal de cadastro).
 *
 * Ler a URL aqui (window.location.search) garante que funcione mesmo se a
 * pagina for servida estatica/cacheada — quando o servidor nao enxerga os
 * parametros. Como isso roda so depois da montagem, nao afeta o primeiro
 * render e por isso NAO causa divergencia de hidratacao.
 */
function resolveSignupData(initialFromUrl?: SignupData): SignupData {
  if (typeof window === 'undefined') return EMPTY_SIGNUP

  let stored: Partial<SignupData> = {}
  try {
    const raw = sessionStorage.getItem('luna_signup')
    if (raw) stored = JSON.parse(raw)
  } catch {
    // ignore
  }

  const url: Partial<SignupData> = {}
  try {
    const p = new URLSearchParams(window.location.search)
    const email = p.get('email')
    const username = p.get('username')
    const pixType = p.get('pixType')
    const pixKey = p.get('pixKey')
    if (email) url.email = email
    if (username) url.username = username
    if (pixType) url.pixType = pixType
    if (pixKey) url.pixKey = pixKey
  } catch {
    // ignore
  }

  return {
    username: url.username || initialFromUrl?.username || stored.username || '',
    email: url.email || initialFromUrl?.email || stored.email || '',
    pixType: url.pixType || initialFromUrl?.pixType || stored.pixType || '',
    pixKey: url.pixKey || initialFromUrl?.pixKey || stored.pixKey || '',
  }
}

export function ConviteClient({
  initialInviteCents,
  initialFromUrl,
}: {
  initialInviteCents: number
  initialFromUrl?: SignupData
}) {
  const router = useRouter()
  // Estado inicial SEMPRE VAZIO — deterministico. O servidor e o primeiro
  // render do cliente produzem HTML IDENTICO, entao NUNCA ha erro de
  // hidratacao (que era o que quebrava os cliques dos modais em alguns
  // navegadores/webviews). Os dados reais entram logo apos a montagem, no
  // useEffect abaixo.
  const [data, setData] = useState<SignupData>(EMPTY_SIGNUP)

  // Flag que indica que ja montamos no cliente. Usado para so renderizar o
  // resumo da conta DEPOIS da montagem — ver comentario no JSX do
  // AccountSummary. Comeca false no SSR e no primeiro render do cliente
  // (hidratacao), garantindo HTML identico e zero divergencia.
  const [mounted, setMounted] = useState(false)

  // Apos a montagem (client-only), resolve e aplica os dados reais.
  useEffect(() => {
    const resolved = resolveSignupData(initialFromUrl)
    try {
      // Persiste para o restante do fluxo (gerar PIX, etc.) enxergar os dados.
      sessionStorage.setItem('luna_signup', JSON.stringify(resolved))
    } catch {
      // ignore
    }
    setData(resolved)
    setMounted(true)
    // Executa uma unica vez na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Controla a exibição da barra fixa de topo: só aparece após rolar um pouco.
  const [showPreCheckout, setShowPreCheckout] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)
  // Sinaliza que o PIX já foi 100% gerado e está pronto para exibir. Enquanto
  // false, a animação de pré-checkout permanece na tela (sem lacunas).
  const [pixReady, setPixReady] = useState(false)
  // Identificador da geração atual do PIX. É incrementado a cada nova
  // confirmação e usado como `key` do PixModal, forçando-o a remontar do zero.
  // Isso evita que estado antigo (loading, pixCode, refs internos) trave a
  // segunda geração — bug que deixava o "Aguardando..." carregando sem fim
  // quando a usuária alterava o e-mail e gerava o PIX novamente.
  const [pixSession, setPixSession] = useState(0)
  // Ativa as notificações de prova social no topo após o modal de convite fechar
  const [socialProofActive, setSocialProofActive] = useState(false)
  // Valor do convite ja chega resolvido do servidor (Server Component), entao
  // o preco aparece imediatamente, sem blur nem fetch no cliente.
  const [inviteCents] = useState(initialInviteCents)

  // Sinal para abrir automaticamente a edicao de um campo no AccountSummary
  // (ex.: e-mail faltando ao tentar adquirir) em vez de mostrar um alerta.
  const [focusRequest, setFocusRequest] = useState<{
    field: 'username' | 'email' | 'pixKey'
    nonce: number
  } | null>(null)

  // ── Guard de bfcache (back/forward cache) ──────────────────────────────────
  // No celular, ao sair para o app de e-mail e voltar (ou abrir o link do
  // e-mail que reaproveita o mesmo webview), navegadores como Chrome/Safari e
  // webviews de apps (Gmail, Instagram) RESTAURAM a pagina congelada do
  // bfcache em vez de recarregar. Nesse caso o React nao re-monta, os efeitos
  // nao rodam e os toques nos botoes ficam "mortos" — exatamente o modal que
  // travava depois de gerar um PIX e voltar pelo link. Ao detectar a
  // restauracao (event.persisted === true), forcamos um reload para garantir
  // uma pagina 100% fresca e interativa.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload()
      }
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  // Observação: o evento InitiateCheckout NÃO é mais disparado ao entrar na
  // página. Ele passou a ser disparado apenas quando o cliente copia o código
  // PIX gerado (intenção real de pagar) — ver components/convite/pix-modal.tsx.

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
      // Em vez de um alerta do navegador, abrimos direto o campo de e-mail e
      // levamos o usuario ate ele para corrigir.
      setFocusRequest((prev) => ({ field: 'email', nonce: (prev?.nonce ?? 0) + 1 }))
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

    // Gera o PIX direto, sem popup de confirmação intermediário.
    handleConfirmAcquire()
  }

  // Confirmação do popup: aqui sim iniciamos a geração do PIX (modal montado
  // por baixo) e mostramos a animação de pré-checkout por cima. O fetch
  // acontece em paralelo à animação, que só sai de cena quando o PIX estiver
  // 100% pronto.
  function handleConfirmAcquire() {
    setPixReady(false)
    // Nova sessão => o PixModal remonta limpo e gera um PIX novo do zero.
    setPixSession((n) => n + 1)
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
      <PageBackground grayscale darken />

      {/* Barra fixa de destaque no topo (aparece após rolar um pouco) */}
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
          <h1 className="text-balance font-sans text-[1.6rem] font-semibold leading-tight tracking-tight text-foreground">
            Resgate seu <span className="text-primary">Convite Luna</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-foreground">
            Confirme seus dados abaixo e garanta seu código de convite exclusivo.
          </p>
        </section>

        <div className="mt-8 flex flex-col gap-7">
        {/* Escassez: convites restantes hoje */}
        <div className="flex items-center justify-center gap-2.5 rounded-xl border border-border/40 bg-card/60 px-4 py-3 backdrop-blur-sm">
          <Users className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-foreground">
            Restam apenas <span className="font-bold text-primary">9</span> convites hoje
          </p>
        </div>

        {/* Dados da conta.
            IMPORTANTE: renderizado SOMENTE apos a montagem no cliente.
            Motivo: o texto de placeholder do e-mail ("seu@email.com") e o
            e-mail real parecem enderecos de e-mail. Em producao, atras do
            Cloudflare com "Email Address Obfuscation" ligado, qualquer texto
            de e-mail no HTML do SSR e reescrito para
            <a class="__cf_email__">[email protected]</a> + um script injetado.
            Isso muda a estrutura do DOM e QUEBRA a hidratacao do React,
            deixando os botoes/modais sem responder ao toque (o bug relatado:
            "modal inicial travado", so em producao e variando por navegador).
            Ao renderizar o resumo apenas no cliente, o HTML do SSR nao contem
            nenhum e-mail, o Cloudflare nao reescreve nada e a hidratacao nunca
            quebra. O e-mail real so aparece via atualizacao client-side, que o
            Cloudflare nao intercepta. */}
        {mounted ? (
          <AccountSummary
            username={data.username}
            email={data.email}
            pixType={data.pixType}
            pixKey={data.pixKey}
            onUpdate={updateField}
            focusRequest={focusRequest}
          />
        ) : (
          <section aria-hidden="true">
            <div className="mb-2.5 h-4 w-24 px-1" />
            <div className="luna-border overflow-hidden rounded-2xl bg-card">
              <div className="h-[3.25rem] border-b border-border/40" />
              <div className="h-[3.25rem] border-b border-border/40" />
              <div className="h-[3.25rem]" />
            </div>
          </section>
        )}

        {/* Aviso: acesso enviado por e-mail */}
        <div className="-mt-3 flex items-center gap-2.5 rounded-2xl border border-border/40 bg-card/60 px-4 py-3 backdrop-blur-sm">
          <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-pretty text-xs leading-relaxed text-muted-foreground">
            Você receberá em seu <span className="font-semibold text-primary">E-mail</span> o acesso
            ao <span className="font-semibold text-primary">Luna Privé</span>.
          </p>
        </div>

        {/* Preço + garantia */}
        <PriceCard onAcquire={handleAcquire} amountCents={inviteCents} priceReady />

        {/* Card do Instagram (privado, só para convites ativos) */}
        <InstagramCard />

        {/* Depoimentos + bônus detalhado */}
        <BonusAndReviews />

        {/* Taxas da plataforma */}
        <PlatformFees />

        {/* Empresa */}
        <CompanyInfo />
        </div>
      </div>

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
        key={pixSession}
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
