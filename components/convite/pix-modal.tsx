'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Clock, AlertCircle, RefreshCw, Gift, CircleCheck, Mail } from 'lucide-react'
import Image from 'next/image'
import QRCode from 'qrcode'
import { readCookie, newEventId, fbTrackCustom } from '@/lib/fb/track'
import { getAttributionForCheckout } from '@/lib/fb/attribution'

const PIX_CONTENT_NAME: Record<string, string> = {
  invite: 'Convite Luna Privé',
  chat: 'Chat Exclusivo Luna Privé',
  gift_unlock: 'Habilitação de Presentes Luna Privé',
  boost: 'Impulsionamento Luna Privé',
  verification: 'Verificação de Conta Luna Privé',
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
}

export function PixModal({ isOpen, onClose, email, amount, userName, onPaymentConfirmed, type = 'invite', boostDays, title, subtitle }: PixModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [inviteId, setInviteId] = useState<string | null>(null)

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
      if (ok) markCopied()
    } catch {
      // Silencioso: o usuário ainda pode copiar manualmente
    }
  }

  if (!isOpen) return null

  // Preco "de" (ancora) com ~40% de desconto, igual ao PriceCard.
  const originalAmount = amount / 0.6
  const formatBRL = (value: number) =>
    value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const codeLabel = type === 'invite' ? 'CÓDIGO DE CONVITE' : 'CÓDIGO DE ACESSO'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-primary/30 shadow-2xl shadow-primary/20 duration-300 animate-in fade-in zoom-in-95">
        {/* Imagem de fundo (mesma do /convite) */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <img src="/images/background.png" alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-background/92" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        </div>

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-background/60 p-2 text-muted-foreground backdrop-blur-sm transition hover:bg-muted hover:text-foreground sm:right-4 sm:top-4"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>

        {/* Conteúdo */}
        <div className="relative z-10 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Gerando PIX...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
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
              {/* Logo */}
              <div className="flex justify-center">
                <img
                  src="/images/luna-prive-logo.png"
                  alt="Luna Privé"
                  className="h-8 w-auto"
                />
              </div>

              {/* Título */}
              <div className="mt-5 text-center">
                <h2 className="text-balance text-2xl font-extrabold tracking-tight text-foreground">
                  Pagamento via PIX
                </h2>
                <p className="mt-1.5 text-pretty text-sm text-muted-foreground">
                  Escaneie o QR Code ou copie o código abaixo
                </p>
              </div>

              {/* Timer destacado */}
              <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-2.5">
                <Clock className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Código reservado por{' '}
                  <span className="font-bold text-primary">{timeLeft || '10:00'}</span>
                </span>
              </div>

              {/* Código de convite */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Gift className="size-4 text-primary" />
                  {codeLabel}
                </span>
                <span className="font-mono text-sm font-semibold tracking-widest text-muted-foreground/50 blur-[3px] select-none">
                  XXX-XXX-XXX
                </span>
              </div>

              {/* QR Code */}
              {pixQrCode && (
                <div className="mt-5 flex justify-center">
                  <div className="rounded-2xl bg-white p-3 shadow-lg shadow-black/30">
                    <Image
                      src={pixQrCode}
                      alt="QR Code PIX"
                      width={180}
                      height={180}
                      className="size-[160px] sm:size-[180px]"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Valor */}
              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">Valor a pagar</p>
                <div className="mt-1 flex items-baseline justify-center gap-2.5">
                  <span className="text-base font-semibold text-muted-foreground line-through decoration-primary/70">
                    R${formatBRL(originalAmount)}
                  </span>
                  <span className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                    R${formatBRL(amount)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Pagamento único</p>
              </div>

              {/* Código PIX copia e cola */}
              <div className="mt-5">
                <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                  Código PIX (copia e cola)
                </p>
                <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
                  <p className="break-all font-mono text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                    {pixCode || ''}
                  </p>
                </div>
              </div>

              {/* Botão copiar */}
              <button
                onClick={copyPixCode}
                className="luna-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
              >
                {copied ? (
                  <>
                    <Check className="size-5" />
                    Código copiado!
                  </>
                ) : (
                  <>
                    <Copy className="size-5" />
                    Copiar código PIX
                  </>
                )}
              </button>

              {/* Botão já fiz o pagamento */}
              <button
                onClick={checkPaymentStatus}
                disabled={checkingPayment}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/40 py-3.5 text-sm font-semibold text-foreground transition hover:bg-background/70 active:scale-[0.98] disabled:opacity-60"
              >
                {checkingPayment ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <CircleCheck className="size-4 text-positive" />
                )}
                Já fiz o pagamento
              </button>

              {/* Aviso de e-mail */}
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border/50 bg-background/30 px-4 py-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                  Após o pagamento, seu{' '}
                  <span className="font-semibold text-foreground">convite e acesso</span> serão
                  enviados no e-mail cadastrado.
                </p>
              </div>

              {/* Rodapé expira */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                PIX expira em <span className="font-semibold text-primary">{timeLeft || '10:00'}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
