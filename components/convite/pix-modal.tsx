'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, Check, AlertCircle, RefreshCw, Mail, CheckCircle2, Info, QrCode } from 'lucide-react'
import Image from 'next/image'
import QRCode from 'qrcode'
import confetti from 'canvas-confetti'
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
 * Extrai o nome do beneficiário (campo 59 "Merchant Name") de um payload PIX
 * no formato BR Code (EMV TLV). Percorre os campos de nível raiz (ID de 2
 * dígitos + tamanho de 2 dígitos + valor) e retorna o valor do campo 59.
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
        const name = value.trim()
        if (!name) return null
        // Normaliza para "Title Case" (nomes vêm em maiúsculas no BR Code).
        return name
          .toLowerCase()
          .split(/\s+/)
          .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
          .join(' ')
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
  /**
   * Quando true, dispara o InitiateCheckout (pixel + CAPI) no momento em que o
   * PIX e gerado, com os dados da pessoa para melhor atribuicao. Usado apenas
   * no fluxo de convite (/convite).
   */
  trackInitiateCheckout?: boolean
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

export function PixContent({ isOpen, onClose, email, amount, userName, onPaymentConfirmed, type = 'invite', boostDays, title, subtitle, pixType, pixKey, trackInitiateCheckout = false, compact = false, discountPercent, embedded = false }: PixModalProps) {
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
  // Garante que os confetes disparem apenas uma vez por geração de PIX.
  const confettiFiredRef = useRef(false)
  // Garante que o InitiateCheckout seja disparado uma unica vez por abertura.
  const initiateCheckoutSentRef = useRef(false)

  // Confetes sutis quando o PIX é gerado com sucesso.
  useEffect(() => {
    if (loading || error || !pixCode || confettiFiredRef.current) return
    confettiFiredRef.current = true

    const colors = ['#ff2d6f', '#ff7aa8', '#ffffff']
    confetti({
      particleCount: 60,
      spread: 65,
      startVelocity: 38,
      origin: { x: 0.5, y: 0.35 },
      colors,
      scalar: 0.85,
      ticks: 160,
      disableForReducedMotion: true,
    })
  }, [loading, error, pixCode])

  // Reseta o controle de confetes ao reabrir o modal.
  useEffect(() => {
    if (!isOpen) {
      confettiFiredRef.current = false
      initiateCheckoutSentRef.current = false
    }
  }, [isOpen])

  // Preço "de" (âncora) com desconto configuravel (padrao ~40%), igual ao PriceCard.
  const discountFraction = Math.min(Math.max((discountPercent ?? 40) / 100, 0), 0.95)
  const originalAmount = amount / (1 - discountFraction)

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
        showToast('info', 'Ainda não identificamos seu pagamento. Se você acabou de pagar, aguarde alguns instantes e fique de olho no seu e-mail — o Código de Convite chega por lá assim que for confirmado.')
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

      // InitiateCheckout: disparado SOMENTE no fluxo de convite, no momento em
      // que o PIX e gerado, com os dados da pessoa para melhor atribuicao.
      // Pixel (browser) + Conversions API (servidor) com o MESMO event_id para
      // deduplicacao. Nunca quebra o fluxo de pagamento.
      if (trackInitiateCheckout && type === 'invite' && !initiateCheckoutSentRef.current) {
        initiateCheckoutSentRef.current = true
        try {
          const icEventId = newEventId('ic')
          const icParams = {
            value: Number(amount) || 0,
            currency: 'BRL',
            content_name: 'Convite Luna Privé',
            content_type: 'product',
          }
          fbTrackWhenReady('InitiateCheckout', icParams, icEventId)

          const trimmedName = (userName || '').trim()
          const firstName = trimmedName ? trimmedName.split(/\s+/)[0] : null
          const lastName =
            trimmedName && trimmedName.split(/\s+/).length > 1
              ? trimmedName.split(/\s+/).slice(1).join(' ')
              : null
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
              email,
              name: trimmedName || null,
              firstName,
              lastName,
              phone,
              value: Number(amount) || 0,
              attribution,
            }),
          }).catch(() => {})
        } catch {
          // o tracking nunca bloqueia o checkout
        }
      }

      // Gerar QR Code a partir do codigo PIX (a API retorna apenas o codigo EMV)
      if (data.pixCode) {
        try {
          const qrDataUrl = await QRCode.toDataURL(data.pixCode, {
            width: 240,
            margin: 1,
            errorCorrectionLevel: 'M',
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
            className="h-7 w-auto"
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
          {/* QR Code */}
          {pixQrCode && (
            <div className={compact ? 'mt-3 flex justify-center' : 'mt-6 flex justify-center'}>
              <div className="rounded-2xl bg-white p-2.5 shadow-lg shadow-black/30">
                <Image
                  src={pixQrCode}
                  alt="QR Code PIX"
                  width={180}
                  height={180}
                  className={compact ? 'size-[120px]' : 'size-[160px] sm:size-[180px]'}
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Processador de pagamentos (nome nominal do PIX) */}
          {extractPixMerchantName(pixCode) && (
            <p className="mt-2.5 text-center text-xs font-medium tracking-wide text-muted-foreground">
              Processado por{' '}
              <span className="font-semibold text-foreground/90">
                {extractPixMerchantName(pixCode)}
              </span>
            </p>
          )}

          {/* Valor */}
          <div className={compact ? 'mt-4 text-center' : 'mt-6 text-center'}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Valor único
            </p>
            <div className="mt-1 flex items-center justify-center gap-2.5">
              <span className="text-base font-semibold text-muted-foreground line-through decoration-primary/70">
                R${originalAmount.toFixed(2).replace('.', ',')}
              </span>
              <span className={`${compact ? 'text-2xl' : 'text-3xl'} font-extrabold tracking-tight text-foreground`}>
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
              <p className="truncate font-mono text-xs leading-relaxed text-muted-foreground">
                {pixCode || ''}
              </p>
            </div>
          </div>

          {/* Botão copiar */}
          <button
            onClick={copyPixCode}
            className={`${copied ? 'bg-emerald-600 ring-emerald-300/40' : 'cta-gradient animate-cta-breathe ring-white/20 hover:brightness-110'} ${compact ? 'mt-4 py-3.5 text-sm' : 'mt-4 py-4 text-base'} flex w-full items-center justify-center gap-2 rounded-2xl font-bold text-primary-foreground ring-1 ring-inset transition-all duration-300 ease-out active:scale-[0.98]`}
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

          {/* Aviso de e-mail */}
          <div className={`${compact ? 'mt-3 py-2.5' : 'mt-4 py-3'} flex items-start gap-2.5 rounded-2xl border border-border/60 bg-background/40 px-4`}>
            <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {compact ? (
              <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                Após o pagamento confirmado, seu{' '}
                <span className="font-semibold text-foreground">acesso é liberado automaticamente</span>.
                Você receberá o e-mail de confirmação imediatamente.
              </p>
            ) : (
              <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                Após o pagamento, o seu{' '}
                <span className="font-semibold text-foreground">acesso ao Luna Privé</span> será
                enviado no e-mail cadastrado.
              </p>
            )}
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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 sm:rounded-3xl sm:zoom-in-95">
        {toastEl}

        {/* Imagem de fundo (mesma do /convite) */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <img src="/images/background.png" alt="" className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/82 via-background/90 to-background/95" />
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
        <div className="relative z-10 overflow-y-auto px-5 pb-6 pt-7 sm:px-7">
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
