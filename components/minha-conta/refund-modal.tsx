'use client'

import { useState } from 'react'
import { RefreshCcw, Loader2, CheckCircle2, X, ShieldCheck, Clock, ArrowRight } from 'lucide-react'
import type { RefundRequest } from '@/app/minha-conta/actions'
import { requestRefund } from '@/app/minha-conta/actions'

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function RefundModal({
  isOpen,
  onClose,
  refund,
  onRefundCreated,
}: {
  isOpen: boolean
  onClose: () => void
  refund: RefundRequest | null
  onRefundCreated: (refund: RefundRequest) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const isDone = !!refund

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await requestRefund()
      if ('error' in res) {
        setError('Não foi possível concluir agora. Tente novamente em instantes.')
        return
      }
      onRefundCreated(res.refund)
    } catch {
      setError('Não foi possível concluir agora. Tente novamente em instantes.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-title"
    >
      {/* Backdrop clicável para fechar */}
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="luna-border relative z-10 my-auto w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition active:scale-95"
        >
          <X className="size-5" />
        </button>

        {isDone ? (
          // ── Estado concluído: informe permanente que fica salvo na conta ──
          <div className="pt-2">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-positive/10">
              <CheckCircle2 className="size-9 text-positive" aria-hidden="true" />
            </div>

            <h2 id="refund-title" className="text-center text-xl font-bold text-foreground">
              Reembolso solicitado
            </h2>
            <p className="mt-2 text-center text-pretty text-sm leading-relaxed text-muted-foreground">
              Sua solicitação de reembolso de todos os pedidos foi registrada com sucesso.
            </p>

            <div className="mt-5 space-y-3 rounded-2xl bg-secondary/60 p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-foreground">
                  Reembolsos são processados em até{' '}
                  <span className="font-semibold">30 dias</span>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-foreground">
                  O valor volta automaticamente para a{' '}
                  <span className="font-semibold">conta de destino</span> utilizada no pagamento.
                </p>
              </div>
            </div>

            {(refund.orders_count > 0 || refund.total_amount > 0) && (
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                  <p className="text-sm font-semibold text-foreground">{refund.orders_count}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Valor total</p>
                  <p className="text-sm font-semibold text-foreground">{brl(refund.total_amount)}</p>
                </div>
              </div>
            )}

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Solicitado em {formatDate(refund.requested_at || refund.created_at)}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="luna-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
            >
              Entendi
            </button>
          </div>
        ) : (
          // ── Estado inicial: confirmação ──
          <div className="pt-2">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <RefreshCcw className="size-8 text-primary" aria-hidden="true" />
            </div>

            <h2 id="refund-title" className="text-center text-xl font-bold text-foreground">
              Solicitar reembolso
            </h2>
            <p className="mt-2 text-center text-pretty text-sm leading-relaxed text-muted-foreground">
              Deseja solicitar o reembolso de{' '}
              <span className="font-semibold text-foreground">todos os seus pedidos</span>?
            </p>

            <div className="mt-5 space-y-3 rounded-2xl bg-secondary/60 p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-foreground">
                  Reembolsos são processados em até{' '}
                  <span className="font-semibold">30 dias</span>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-foreground">
                  O valor volta para a{' '}
                  <span className="font-semibold">conta de destino</span> usada no pagamento.
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="luna-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar reembolso'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="mt-3 w-full rounded-xl border border-border bg-secondary py-3.5 text-sm font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-70"
            >
              Agora não
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
