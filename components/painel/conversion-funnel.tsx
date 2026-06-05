'use client'

import { cn } from '@/lib/utils'

interface FunnelStep {
  label: string
  value: number
  color: string
  dotColor: string
}

interface ConversionFunnelProps {
  signups: number
  viewedCheckout: number
  pixGenerated: number
  invitePaid: number
}

export function ConversionFunnel({
  signups,
  viewedCheckout,
  pixGenerated,
  invitePaid,
}: ConversionFunnelProps) {
  const steps: FunnelStep[] = [
    { label: 'Clientes / Leads', value: signups, color: 'bg-rose-900/70', dotColor: 'bg-primary' },
    { label: 'Viu Checkout', value: viewedCheckout, color: 'bg-amber-700/60', dotColor: 'bg-amber-500' },
    { label: 'PIX Gerado', value: pixGenerated, color: 'bg-lime-700/50', dotColor: 'bg-amber-400' },
    { label: 'Convite Pago', value: invitePaid, color: 'bg-emerald-700/60', dotColor: 'bg-positive' },
  ]

  const base = signups || 1

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Funil de Conversão</h2>
        <span className="text-xs text-muted-foreground">Taxa entre etapas →</span>
      </div>

      <div className="flex items-stretch gap-4">
        {/* Barra visual do funil */}
        <div className="flex w-12 shrink-0 flex-col overflow-hidden rounded-lg">
          {steps.map((step) => {
            const ratio = Math.max(0.08, step.value / base)
            return (
              <div
                key={step.label}
                className={cn('w-full', step.color)}
                style={{ height: `${28 + ratio * 24}px` }}
              />
            )
          })}
        </div>

        {/* Linhas do funil */}
        <div className="flex flex-1 flex-col justify-between gap-1">
          {steps.map((step, idx) => {
            const prev = idx === 0 ? step.value : steps[idx - 1].value
            const pct = prev > 0 ? (step.value / prev) * 100 : 0
            return (
              <div key={step.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <span className={cn('size-2 rounded-full', step.dotColor)} />
                  <span className="text-sm text-foreground">{step.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {step.value}
                  </span>
                  {idx > 0 && (
                    <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
