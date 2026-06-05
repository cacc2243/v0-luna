'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Check, Clock, QrCode, AlertCircle, RefreshCw } from 'lucide-react'
import Image from 'next/image'

interface PixModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  amount: number
  userName?: string
  onPaymentConfirmed?: () => void
}

export function PixModal({ isOpen, onClose, email, amount, userName, onPaymentConfirmed }: PixModalProps) {
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
      setPixQrCode(data.pixQrCode)
      setExpiresAt(data.expiresAt)
      setInviteId(data.invite?.id)

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
      const response = await fetch(`/api/pix/status?id=${inviteId}`)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary/20 to-primary/5 px-6 py-5 border-b border-border">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/20">
              <QrCode className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Pagamento PIX</h2>
              <p className="text-sm text-muted-foreground">Convite Luna Creators</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
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
              <div className="mb-6 text-center">
                <p className="text-sm text-muted-foreground">Valor a pagar</p>
                <p className="text-4xl font-bold text-foreground">
                  R$ {amount.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Timer */}
              <div className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2">
                <Clock className="size-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-500">
                  Expira em {timeLeft}
                </span>
              </div>

              {/* QR Code */}
              {pixQrCode && (
                <div className="mb-6 flex justify-center">
                  <div className="rounded-2xl bg-white p-4">
                    {pixQrCode.startsWith('data:') ? (
                      <Image
                        src={pixQrCode}
                        alt="QR Code PIX"
                        width={200}
                        height={200}
                        className="size-[200px]"
                      />
                    ) : (
                      <Image
                        src={`data:image/png;base64,${pixQrCode}`}
                        alt="QR Code PIX"
                        width={200}
                        height={200}
                        className="size-[200px]"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Código PIX */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-medium text-muted-foreground text-center">
                  Ou copie o código PIX
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={pixCode || ''}
                    readOnly
                    className="w-full rounded-xl bg-muted/50 border border-border px-4 py-3 pr-12 text-xs font-mono text-foreground truncate"
                  />
                  <button
                    onClick={copyPixCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition"
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </button>
                </div>
                {copied && (
                  <p className="mt-2 text-center text-xs text-positive font-medium">
                    Código copiado!
                  </p>
                )}
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
