'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Pencil, Check } from 'lucide-react'
import { DiscountDeadline } from '@/components/convite/discount-deadline'

interface ConfirmAcquireModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  /** E-mail que aparecerá na mensagem e será usado na geração do PIX. */
  email: string
  /** Persiste o novo e-mail escolhido pela usuária. */
  onEmailChange: (email: string) => void
  /** Valor do convite em centavos (reflete o preço atual). */
  amountCents: number
}

// Preço "de" (âncora) fixo em R$ 169,90 — igual ao PriceCard e ao PixModal.
const ORIGINAL_CENTS = 16990

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Formata centavos como moeda BRL: 2480 -> "24,80"
function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ConfirmAcquireModal({
  isOpen,
  onClose,
  onConfirm,
  email,
  onEmailChange,
  amountCents,
}: ConfirmAcquireModalProps) {
  const [mounted, setMounted] = useState(false)
  const [editing, setEditing] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [emailError, setEmailError] = useState('')

  useEffect(() => setMounted(true), [])

  // Ao reabrir o modal, volta sempre para o modo de confirmação.
  useEffect(() => {
    if (isOpen) {
      setEditing(false)
      setEmailError('')
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const displayEmail = (email || '').trim() || 'seu e-mail'
  const discountPercent = Math.max(
    0,
    Math.round((1 - amountCents / ORIGINAL_CENTS) * 100),
  )

  function openEditor() {
    setEmailInput((email || '').trim() === 'seu@email.com' ? '' : (email || '').trim())
    setEmailError('')
    setEditing(true)
  }

  function saveEmail() {
    const value = emailInput.trim()
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Informe um e-mail válido.')
      return
    }
    onEmailChange(value)
    setEditing(false)
    setEmailError('')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-acquire-title"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-xs flex-col overflow-hidden rounded-3xl border border-border bg-card text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-sm transition hover:bg-black/60 hover:text-white"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        {/* Banner do topo */}
        <img
          src="/images/convite-banner.png"
          alt="Seu Convite Luna Privé está a um passo: seguro e privado, sem exposição do seu nome e pagamento via PIX"
          className="aspect-[2/1] w-full object-cover"
        />

        {editing ? (
          /* ----- Modo de edição de e-mail ----- */
          <div className="flex flex-col gap-4 px-6 pb-7 pt-6">
            <div className="text-center">
              <h2 className="text-sm font-bold text-foreground">Alterar e-mail</h2>
              <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
                O convite e a confirmação do pagamento serão enviados para este e-mail.
              </p>
            </div>

            <div className="text-left">
              <label
                htmlFor="confirm-email-input"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                E-mail
              </label>
              <input
                id="confirm-email-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value)
                  if (emailError) setEmailError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) saveEmail()
                }}
                placeholder="seu@email.com"
                className={`w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:ring-2 ${
                  emailError
                    ? 'border-destructive focus:ring-destructive/30'
                    : 'border-border focus:border-primary focus:ring-primary/25'
                }`}
              />
              {emailError && (
                <p className="mt-1.5 text-xs font-medium text-destructive">{emailError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false)
                  setEmailError('')
                }}
                className="flex-1 rounded-2xl border border-border bg-secondary py-3 text-sm font-semibold text-foreground transition hover:bg-secondary/80 active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveEmail}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 active:scale-[0.98]"
              >
                <Check className="size-4" aria-hidden="true" />
                Salvar
              </button>
            </div>
          </div>
        ) : (
          /* ----- Modo de confirmação ----- */
          <div className="flex flex-col gap-4 px-6 pb-7 pt-6">
            <p
              id="confirm-acquire-title"
              className="text-pretty text-center text-sm leading-relaxed text-muted-foreground"
            >
              Vamos gerar o seu convite e enviar o acesso para o e-mail{' '}
              <span className="break-all font-semibold text-foreground">{displayEmail}</span>.
              Confirma a geração do PIX de pagamento?
            </p>

            {/* Destaque do valor — faixa compacta horizontal */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3">
              <div className="flex flex-col text-left">
                <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Valor do convite
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground line-through tabular-nums">
                    R$ {formatCents(ORIGINAL_CENTS)}
                  </span>
                  {discountPercent > 0 && (
                    <span className="rounded-full bg-positive/15 px-1.5 py-0.5 text-[0.6rem] font-bold text-positive">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              </div>
              <span className="whitespace-nowrap text-2xl font-extrabold leading-none tracking-tight text-primary tabular-nums">
                R$ {formatCents(amountCents)}
              </span>
            </div>

            {/* Informe de desconto por tempo limitado */}
            <DiscountDeadline className="self-center" />

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onConfirm}
                className="cta-gradient animate-cta-breathe flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-primary-foreground ring-1 ring-inset ring-white/20 transition-all duration-300 ease-out hover:brightness-110 active:scale-[0.98]"
              >
                Sim, gerar agora!
              </button>
              <button
                type="button"
                onClick={openEditor}
                className="mx-auto flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Alterar e-mail
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
