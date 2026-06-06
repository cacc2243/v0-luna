'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Clock, QrCode, AlertCircle, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import QRCode from 'qrcode'

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
  const headerTitle = title || 'Pagamento PIX'
  const headerSubtitle = subtitle || (type === 'chat' ? 'Chat Exclusivo Luna Privé' : 'Convite Luna Privé')
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
      const response = await fetch('/api/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount,
          name: userName || 'Cliente Luna',
          type,
          boostDays,
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

  function copyPixCode() {
    if (!pixCode) return
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary/20 to-primary/5 px-4 py-4 sm:px-6 sm:py-5 border-b border-border shrink-0">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div className="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20">
              <QrCode className="size-5 sm:size-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{headerTitle}</h2>
              <p className="text-sm text-muted-foreground truncate">{headerSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Gerando PIX...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="size-8 text-destructive" />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">{error}</p>
              <button
                onClick={generatePix}
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
              >
                <RefreshCw className="size-4" />
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Valor */}
              <div className="mb-4 sm:mb-6 text-center">
                <p className="text-sm text-muted-foreground">Valor a pagar</p>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">
                  R$ {amount.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Timer */}
              <div className="mb-4 sm:mb-6 flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2">
                <Clock className="size-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-500">
                  Expira em {timeLeft}
                </span>
              </div>

              {/* QR Code */}
              {pixQrCode && (
                <div className="mb-4 sm:mb-6 flex justify-center">
                  <div className="rounded-2xl bg-white p-3">
                    <Image
                      src={pixQrCode}
                      alt="QR Code PIX"
                      width={140}
                      height={140}
                      className="size-[120px] sm:size-[140px]"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* Código PIX */}
              <div className="mb-4 sm:mb-6">
                <p className="mb-2 text-xs font-medium text-muted-foreground text-center">
                  Ou copie o código PIX
                </p>
                <div className="rounded-xl bg-muted/50 border border-border px-4 py-3">
                  <p className="text-xs font-mono text-foreground break-all leading-relaxed">
                    {pixCode || ''}
                  </p>
                </div>
                <button
                  onClick={copyPixCode}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition active:scale-[0.98]"
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
              </div>

              {/* Instruções */}
              <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-xs font-semibold text-foreground mb-2">Como pagar:</p>
                <ol className="text-xs text-muted-foreground space-y-1.5">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escolha pagar via PIX</li>
                  <li>3. Escaneie o QR Code ou cole o código</li>
                  <li>4. Confirme o pagamento</li>
                </ol>
              </div>

              {/* Status de verificação */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="size-2 rounded-full bg-positive animate-pulse" />
                Aguardando pagamento...
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
