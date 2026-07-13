'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, Check, AlertCircle, RefreshCw, CheckCircle2, Info, QrCode, Lock, ShieldCheck, Zap, Mail } from 'lucide-react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { readCookie, newEventId, fbTrackCustom, fbTrackWhenReady } from '@/lib/fb/track'
import { getAttributionForCheckout } from '@/lib/fb/attribution'

const PIX_CONTENT_NAME: Record<string, string> = {
  invite: 'Convite Luna Privé',
  chat: 'Chat Exclusivo Luna Privé',
  gift_unlock: 'Habilitação de Presentes Luna Privé',
  boost: 'Impulsionamento Luna Privé',
  verification: 'Verificação de Conta Luna Privé',
}

/**
 * Mapa de nomes de beneficiários conhecidos. Alguns provedores enviam o campo
 * 59 (Merchant Name) do BR Code sem espaços (ex.: "MORENDIGITALLTDA"), então
 * não é possível reconstruir os espaços apenas pelo parsing. A chave é o nome
 * em maiúsculas e sem espaços; o valor é o nome exibido corretamente.
 */
const KNOWN_MERCHANT_NAMES: Record<string, string> = {
  MORENDIGITALLTDA: 'Moren Digital Ltda',
  CONTADESERVICOSLTDA: 'Conta de Serviços Ltda',
}

/** Sufixos societários que devem aparecer separados do restante do nome. */
const COMPANY_SUFFIXES = ['LTDA', 'EIRELI', 'MEI', 'ME', 'SA', 'EPP']

/**
 * Formata o nome do beneficiário para exibição. Prioriza o mapa de nomes
 * conhecidos (comparando pela versão sem espaços). Caso contrário, separa
 * sufixos societários grudados (ex.: "...LTDA") e aplica Title Case.
 */
function formatMerchantName(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/[_.\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return null

  // 1) Nome conhecido (chave = maiúsculas sem espaços).
  const key = cleaned.replace(/\s+/g, '').toUpperCase()
  if (KNOWN_MERCHANT_NAMES[key]) return KNOWN_MERCHANT_NAMES[key]

  // 2) Separa sufixo societário grudado no final (ex.: "EMPRESALTDA" -> "EMPRESA LTDA").
  let normalized = cleaned
  for (const suffix of COMPANY_SUFFIXES) {
    const re = new RegExp(`(\\S)(${suffix})$`, 'i')
    if (re.test(normalized.replace(/\s+/g, ''))) {
      const upper = normalized.replace(/\s+/g, '').toUpperCase()
      if (upper.endsWith(suffix) && upper.length > suffix.length) {
        const base = normalized.replace(/\s+/g, '').slice(0, upper.length - suffix.length)
        normalized = `${base} ${suffix}`
        break
      }
    }
  }

  // 3) Title Case (nomes vêm em maiúsculas no BR Code).
  return normalized
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/**
 * Extrai o nome do beneficiário (campo 59 "Merchant Name") de um payload PIX
 * no formato BR Code (EMV TLV). Percorre os campos de nível raiz (ID de 2
 * dígitos + tamanho de 2 dígitos + valor) e retorna o valor formatado do campo 59.
 * Retorna null se não encontrar ou o payload for inválido.
 */
function extractPixMerchantName(payload: string | null): string | null {
  if (!payload) return null
  let i = 0
  try {
    while (i + 4 <= payload.length) {
      const id = payload.slice(i, i + 2)
      const len = parseInt(payload.slice(i + 2, i + 4), 10)
      if (Number.isNaN(len)) return null
      const valueStart = i + 4
      const value = payload.slice(valueStart, valueStart + len)
      if (id === '59') {
        return formatMerchantName(value)
      }
      i = valueStart + len
    }
  } catch {
    return null
  }
  return null
}

interface PixModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  amount: number
  userName?: string
  onPaymentConfirmed?: () => void
  /** Disparado uma única vez quando o PIX está 100% gerado e pronto para exibir. */
  onReady?: () => void
  /** Tipo de pagamento: 'invite' (convite), 'chat' (chat exclusivo), 'gift_unlock' (presentes), 'boost' (impulsionamento) ou 'verification' (verificação de conta) */
  type?: 'invite' | 'chat' | 'gift_unlock' | 'boost' | 'verification'
  /** Dias de impulsionamento (apenas para type='boost') */
  boostDays?: number
  /** Titulo exibido no header e subtitulo opcional */
  title?: string
  subtitle?: string
  /** Tipo da chave PIX informada pelo usuario (CPF, Telefone, E-mail, Aleatória) */
  pixType?: string
  /** Valor da chave PIX informada pelo usuario */
  pixKey?: string
  /** Layout reduzido (QR menor, espacamentos compactos) para uso em fluxos curtos. */
  compact?: boolean
  /** Percentual de desconto usado para calcular o valor "de" (riscado). Padrao 40%. */
  discountPercent?: number
  /**
   * Quando true, renderiza apenas o conteúdo do PIX (sem overlay/portal/fundo/logo),
   * para ser embutido diretamente dentro de outro card (ex.: fluxo de convite).
   */
  embedded?: boolean
}

export function PixContent({ isOpen, onClose, email, amount, userName, onPaymentConfirmed, onReady, type = 'invite', boostDays, title, subtitle, pixType, pixKey, compact = false, discountPercent, embedded = false }: PixModalProps) {
  const [loading, setLoading] = useState(true)
  // Portal: garante que o modal seja montado no body (evita que um ancestral
  // com `transform` — ex.: card com animate-pop — prenda/corte o position:fixed).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [error, setError] = useState<string | null>(null)
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [inviteId, setInviteId] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  // Toast interno do modal (cópia do código / resultado da verificação de pagamento).
  const [toast, setToast] = useState<{ variant: 'success' | 'error' | 'info'; message: string } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Garante que onReady dispare apenas uma vez por geração de PIX.
  const readyFiredRef = useRef(false)
  // Garante que o InitiateCheckout (disparado ao copiar o código PIX do convite)
  // seja enviado apenas uma vez por abertura do modal.
  const initiateCheckoutFiredRef = useRef(false)

  // Sinaliza ao componente pai que a geração do PIX finalizou e o modal já tem
  // algo para exibir imediatamente: o PIX pronto (código + QR) ou o estado de
  // erro (com "Tentar novamente"). Isso mantém a animação de "gerando PIX" no ar
  // até este exato momento, sem lacunas na tela e sem travar em caso de erro.
  useEffect(() => {
    if (loading || readyFiredRef.current) return
    if (!pixCode && !error) return
    readyFiredRef.current = true
    onReady?.()
  }, [loading, error, pixCode, onReady])

  // Reseta o controle de "ready" ao reabrir o modal.
  useEffect(() => {
    if (!isOpen) {
      readyFiredRef.current = false
      initiateCheckoutFiredRef.current = false
    }
  }, [isOpen])

  // Bloqueia o scroll do fundo enquanto o modal cheio estiver aberto. Usa a
  // técnica `position: fixed` no body (a mais confiável no mobile/iOS Safari),
  // preservando e restaurando a posição de rolagem ao fechar. Não se aplica ao
  // modo embutido, que rola junto com a página normalmente.
  useEffect(() => {
    if (embedded || !isOpen) return
    const { body } = document
    const scrollY = window.scrollY
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.left = prev.left
      body.style.right = prev.right
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo(0, scrollY)
    }
  }, [isOpen, embedded])

  // Preço "de" (âncora) fixo em R$ 169,90, igual ao PriceCard.
  const originalAmount = 169.9

  // Exibe um toast temporário dentro do modal.
  function showToast(variant: 'success' | 'error' | 'info', message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ variant, message })
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  // Limpa o timer do toast ao desmontar.
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // Ação do botão "Já fiz o pagamento": força uma verificação imediata.
  async function handleAlreadyPaid() {
    if (!inviteId || verifying) return
    setVerifying(true)
    try {
      const response = await fetch(`/api/pix/status?id=${inviteId}&type=${type}`)
      const data = await response.json()
      if (data.paidInvite) {
        showToast('success', 'Pagamento confirmado! Liberando seu acesso...')
        onPaymentConfirmed?.()
      } else {
        showToast('info', 'Ainda não identificamos seu pagamento. Se você acabou de pagar, aguarde alguns instantes e fique de olho no seu e-mail — o Código de Convite chega por l�� assim que for confirmado.')
      }
    } catch (err) {
      console.error('[v0] Erro ao verificar pagamento:', err)
      showToast('error', 'Não foi possível verificar agora. Tente novamente em instantes.')
    } finally {
      setVerifying(false)
    }
  }

  // Gerar PIX ao abrir o modal
  useEffect(() => {
    if (isOpen && email) {
      generatePix()
    }
  }, [isOpen, email])

  // Timer de expiração
  useEffect(() => {
    if (!expiresAt) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiration = new Date(expiresAt).getTime()
      const diff = expiration - now

      if (diff <= 0) {
        setTimeLeft('Expirado')
        clearInterval(interval)
        return
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  // Verificar pagamento a cada 5 segundos
  useEffect(() => {
    if (!isOpen || !inviteId) return

    const interval = setInterval(() => {
      checkPaymentStatus()
    }, 5000)

    return () => clearInterval(interval)
  }, [isOpen, inviteId])

  async function generatePix() {
    setLoading(true)
    setError(null)

    try {
      // Sinais de atribuicao do Facebook (cookies do navegador) + event_id unico
      // para deduplicacao com o Purchase enviado depois via Conversions API.
      const fbp = readCookie('_fbp')
      const fbc = readCookie('_fbc')
      const eventId = newEventId('purchase')
      // Atribuicao de marketing (UTMs + fbclid) capturada na chegada do lead.
      const attribution = getAttributionForCheckout()

      const response = await fetch('/api/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount,
          name: userName || 'Cliente Luna',
          username: userName || undefined,
          pixType,
          pixKey,
          type,
          boostDays,
          fbp,
          fbc,
          eventSourceUrl: typeof window !== 'undefined' ? window.location.href : null,
          fbEventId: eventId,
          attribution,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : typeof data.error === 'object' && data.error?.message
            ? data.error.message
            : 'Erro ao gerar PIX'
        throw new Error(errorMessage)
      }

      setPixCode(data.pixCode)
      setExpiresAt(data.expiresAt)
      setInviteId(data.invite?.id)

      // Evento personalizado: PIX gerado no checkout.
      fbTrackCustom(
        'PixGerado',
        {
          value: Number(amount) || 0,
          currency: 'BRL',
          content_name: PIX_CONTENT_NAME[type] || 'Compra Luna Privé',
          content_type: 'product',
          transaction_type: type,
        },
        eventId,
      )

      // Gerar QR Code a partir do codigo PIX (a API retorna apenas o codigo EMV)
      if (data.pixCode) {
        try {
          const qrDataUrl = await QRCode.toDataURL(data.pixCode, {
            // Resolucao alta para renderizacao nitida em telas retina.
            width: 512,
            // Sem quiet zone para eliminar a borda branca ao redor do QR.
            margin: 0,
            // 'H' (recuperacao de ate 30%) garante a leitura mesmo com a logo no centro.
            errorCorrectionLevel: 'H',
            color: {
              dark: '#0a0a0a',
              light: '#ffffff',
            },
          })
          setPixQrCode(qrDataUrl)
        } catch (qrErr) {
          console.error('[v0] Erro ao gerar QR Code:', qrErr)
          setPixQrCode(null)
        }
      }

    } catch (err) {
      console.error('[v0] Erro ao gerar PIX:', err)
      setError(err instanceof Error ? err.message : 'Erro ao gerar PIX')
    } finally {
      setLoading(false)
    }
  }

  async function checkPaymentStatus() {
    if (!inviteId || checkingPayment) return

    setCheckingPayment(true)
    try {
      const response = await fetch(`/api/pix/status?id=${inviteId}&type=${type}`)
      const data = await response.json()

      if (data.paidInvite) {
        onPaymentConfirmed?.()
      }
    } catch (err) {
      console.error('[v0] Erro ao verificar pagamento:', err)
    } finally {
      setCheckingPayment(false)
    }
  }

  async function copyPixCode() {
    if (!pixCode) return
    
    const markCopied = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showToast('success', 'Código PIX copiado com sucesso!')
      // Registra no servidor que o cliente de fato copiou o código PIX.
      if (inviteId) {
        fetch('/api/pix/copied', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteId }),
        }).catch(() => {
          // Silencioso: a cópia local já funcionou para o usuário.
        })
      }
      // InitiateCheckout: disparado SOMENTE quando o cliente copia o código PIX
      // do convite (intenção real de pagar), e não mais na entrada da página.
      // Pixel (browser) + Conversions API (servidor) com o MESMO event_id para
      // deduplicação. Nunca quebra o fluxo de cópia.
      if (type === 'invite' && !initiateCheckoutFiredRef.current) {
        initiateCheckoutFiredRef.current = true
        try {
          const value = Number(amount) || 0
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

          const trimmedName = (userName || '').trim()
          const parts = trimmedName ? trimmedName.split(/\s+/) : []
          const firstName = parts.length > 0 ? parts[0] : null
          const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null
          const normalizedPixType = (pixType || '').toLowerCase()
          const phone =
            normalizedPixType.includes('tele') || normalizedPixType.includes('phone')
              ? pixKey || null
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
              email: email || null,
              name: trimmedName || null,
              firstName,
              lastName,
              phone,
              value,
              attribution,
            }),
          }).catch(() => {})
        } catch {
          // o tracking nunca bloqueia a cópia do PIX
        }
      }
    }

    // Tenta a Clipboard API moderna (pode estar bloqueada em iframes)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(pixCode)
        markCopied()
        return
      }
    } catch {
      // Cai no fallback abaixo
    }

    // Fallback: textarea temporário + execCommand
    try {
      const textarea = document.createElement('textarea')
      textarea.value = pixCode
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.top = '0'
      textarea.style.left = '0'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (ok) {
        markCopied()
      } else {
        showToast('error', 'Não foi possível copiar. Selecione e copie o código manualmente.')
      }
    } catch {
      showToast('error', 'Não foi possível copiar. Selecione e copie o código manualmente.')
    }
  }

  if (!isOpen) return null

  // Toast interno (posicionado de forma absoluta sobre o ancestral relativo).
  const toastEl = toast && (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-x-3 top-3 z-30 flex items-start gap-2.5 rounded-2xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200"
      style={{
        borderColor:
          toast.variant === 'success'
            ? 'rgb(34 197 94 / 0.5)'
            : toast.variant === 'error'
              ? 'rgb(239 68 68 / 0.5)'
              : 'var(--border)',
      }}
    >
      {toast.variant === 'success' ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" aria-hidden="true" />
      ) : toast.variant === 'error' ? (
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
      ) : (
        <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      )}
      <p className="text-pretty text-sm font-medium leading-relaxed text-foreground">
        {toast.message}
      </p>
    </div>
  )

  // Conteúdo do PIX (header + estados loading/erro/sucesso). Reutilizado tanto no
  // modal cheio quanto embutido em outro card (fluxo de convite).
  const content = (
    <>
      {/* Header (logo só no modal cheio; no embutido o card pai já mostra a logo) */}
      <div className="flex flex-col items-center text-center">
        {!embedded && (
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-9 w-auto"
          />
        )}
        {!embedded && (
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {title || 'Pagamento via PIX'}
          </h2>
        )}
        {!embedded && (
          <p className="mt-1 text-sm text-muted-foreground">
            {subtitle || 'Escaneie o QR Code ou copie o código abaixo'}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative flex size-16 items-center justify-center">
            {/* halo discreto */}
            <span
              className="absolute inset-0 rounded-full bg-primary/15 blur-md"
              aria-hidden="true"
            />
            {/* anel base sutil */}
            <span
              className="absolute inset-0 rounded-full border-2 border-primary/15"
              aria-hidden="true"
            />
            {/* anel girando */}
            <span
              className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary"
              aria-hidden="true"
            />
            {/* icone QR pulsando no centro */}
            <QrCode className="size-6 animate-pulse text-primary" aria-hidden="true" />
          </div>
          <p className="mt-5 text-sm font-medium text-foreground">Gerando seu PIX</p>
          <p className="mt-1 text-xs text-muted-foreground">Isso leva só um instante...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">{error}</p>
          <button
            onClick={generatePix}
            className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <RefreshCw className="size-4" />
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* Status: aguardando pagamento */}
          <p className={`flex items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground ${compact ? 'mt-3' : 'mt-4'}`}>
            <RefreshCw className="size-3.5 animate-spin text-primary" aria-hidden="true" />
            aguardando pagamento...
          </p>

          {/* QR Code */}
          {pixQrCode && (
            <div className={compact ? 'relative mt-2 flex justify-center' : 'relative mt-3 flex justify-center'}>
              {/* Brilho suave da marca por tras do QR */}
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative rounded-2xl bg-white p-1 shadow-xl shadow-primary/20 ring-1 ring-black/5">
                {/* Cantos decorativos cinza escuro */}
                <span className="pointer-events-none absolute -left-1 -top-1 size-5 rounded-tl-2xl border-l-2 border-t-2 border-zinc-600/80" aria-hidden="true" />
                <span className="pointer-events-none absolute -right-1 -top-1 size-5 rounded-tr-2xl border-r-2 border-t-2 border-zinc-600/80" aria-hidden="true" />
                <span className="pointer-events-none absolute -bottom-1 -left-1 size-5 rounded-bl-2xl border-b-2 border-l-2 border-zinc-600/80" aria-hidden="true" />
                <span className="pointer-events-none absolute -bottom-1 -right-1 size-5 rounded-br-2xl border-b-2 border-r-2 border-zinc-600/80" aria-hidden="true" />
                <Image
                  src={pixQrCode}
                  alt="QR Code PIX"
                  width={180}
                  height={180}
                  className={compact ? 'size-[124px] rounded-xl' : 'size-[164px] rounded-xl sm:size-[184px]'}
                  unoptimized
                />
                {/* Logo Luna Prive no centro do QR */}
                <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white p-1 shadow-md ring-1 ring-black/5">
                  <Image
                    src="/images/luna-icon.png"
                    alt=""
                    width={44}
                    height={44}
                    className={compact ? 'size-4' : 'size-6'}
                    unoptimized
                  />
                </span>
              </div>
            </div>
          )}


          {/* Valor */}
          <div className={compact ? 'mt-4 text-center' : 'mt-6 text-center'}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Valor único
            </p>
            <div className="mt-1 flex items-center justify-center gap-2.5">
              <span className="font-serif text-sm font-semibold text-muted-foreground line-through decoration-primary/70">
                R${originalAmount.toFixed(2).replace('.', ',')}
              </span>
              <span className={`${compact ? 'text-xl' : 'text-2xl'} font-serif font-extrabold tracking-tight text-foreground`}>
                R${amount.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Código copia e cola */}
          <div className={compact ? 'mt-4' : 'mt-6'}>
            <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
              Código PIX (copia e cola)
            </p>
            <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-2.5">
              <p className="line-clamp-2 break-all font-mono text-xs leading-relaxed text-muted-foreground">
                {pixCode || ''}
              </p>
            </div>
          </div>

          {/* Botão copiar */}
          <button
            onClick={copyPixCode}
            className={`${copied ? 'bg-emerald-600 ring-emerald-300/40' : 'cta-gradient ring-white/20 hover:brightness-110'} ${compact ? 'mt-4 py-3.5 text-sm' : 'mt-4 py-4 text-base'} flex w-full items-center justify-center gap-2 rounded-2xl font-bold text-primary-foreground ring-1 ring-inset transition-all duration-300 ease-out active:scale-[0.98]`}
          >
            {copied ? (
              <>
                <Check className="size-5 animate-in zoom-in-50 duration-300" />
                Código copiado!
              </>
            ) : (
              <>
                <Copy className="size-5 transition-transform duration-300 group-hover:rotate-6" />
                Copiar código PIX
              </>
            )}
          </button>

          {/* Já fiz o pagamento (apenas no modal cheio) */}
          {!embedded && (
            <button
              onClick={handleAlreadyPaid}
              disabled={verifying}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/50 py-3.5 text-sm font-semibold text-foreground transition hover:bg-muted/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {verifying ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Já fiz o pagamento
                </>
              )}
            </button>
          )}

          {/* Informe sobre a liberação do acesso */}
          {!embedded && (
            <div className="mt-3 rounded-2xl border border-border bg-card/95 p-3.5 shadow-sm backdrop-blur-sm">
              <div className="flex items-start gap-2.5">
                <Zap className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-foreground">
                  Assim que o pagamento for confirmado, seu acesso é{' '}
                  <span className="font-semibold text-primary">liberado aqui na hora</span>. Você
                  também recebe um e-mail com seus dados de acesso.
                </p>
              </div>
              <div className="mt-2 flex items-center gap-1.5 pl-[1.625rem] text-[0.7rem] font-medium text-muted-foreground">
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                Confira também a caixa de spam.
              </div>
            </div>
          )}

          {/* Rodapé de segurança */}
          <div className={`${compact ? 'mt-3' : 'mt-4'} border-t border-border/50 pt-3`}>
            <div className="flex items-center justify-center gap-2 text-[0.7rem] font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3.5 shrink-0 text-positive" aria-hidden="true" />
                Pagamento seguro
              </span>
              <span className="h-3 w-px bg-border" aria-hidden="true" />
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 shrink-0 text-positive" aria-hidden="true" />
                Dados protegidos
              </span>
            </div>
            <div className="mt-3 flex flex-col items-center gap-0.5 text-center text-[0.65rem] leading-snug text-muted-foreground">
              <p className="whitespace-nowrap">
                <span className="font-medium text-foreground/80">Luna Privé</span>
              </p>
              <p className="mt-0.5 text-pretty">
                Transação processada por gateway autorizado pelo Banco Central
              </p>
            </div>
          </div>

        </>
      )}
    </>
  )

  // Modo embutido: retorna apenas o conteúdo, posicionado pelo card pai.
  if (embedded) {
    return (
      <div className="relative">
        {toastEl}
        {content}
      </div>
    )
  }

  // Modo modal: portal no body com overlay, fundo e botão fechar.
  if (!mounted) return null

  // Observação: durante o carregamento o próprio modal exibe o estado
  // "Gerando seu PIX" (ver `content`). Nos fluxos com animação externa
  // (pré-checkout / GeneratingPixModal), essa animação fica por cima
  // (z-110) até o PIX estar 100% pronto, evitando lacunas e duplo loading.

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 sm:rounded-3xl sm:zoom-in-95">
        {toastEl}

        {/* Imagem de fundo (mesma do /convite) */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <img src="/images/background.png" alt="" className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/58 via-background/66 to-background/75" />
        </div>

        {/* Botão fechar */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-20 rounded-full bg-background/60 p-2 text-muted-foreground backdrop-blur-sm transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {/* Conteúdo */}
        <div className="relative z-10 overflow-y-auto overscroll-contain px-5 pb-6 pt-7 sm:px-7">
          {content}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// Mantém a API existente: PixModal renderiza o conteúdo em um modal cheio.
export function PixModal(props: PixModalProps) {
  return <PixContent {...props} embedded={false} />
}
