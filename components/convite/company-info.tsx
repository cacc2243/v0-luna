'use client'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export function CompanyInfo() {
  return (
    <section aria-label="Links legais" className="flex flex-col items-center gap-4">
      {/* Card de taxas da plataforma */}
      <div className="luna-border w-full max-w-sm rounded-2xl bg-card/60 p-4">
        <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Taxas da plataforma
        </h3>
        <div className="mt-3 flex flex-col divide-y divide-border/50">
          <div className="flex items-start gap-3 pb-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
            <div className="leading-snug">
              <p className="text-sm font-medium text-foreground">Taxa por venda</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Para cada venda concluída é descontada uma taxa fixa de{' '}
                <span className="font-semibold text-primary">R$ 0,90</span>.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 pt-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ArrowDownRight className="size-4" aria-hidden="true" />
            </span>
            <div className="leading-snug">
              <p className="text-sm font-medium text-foreground">Taxa por saque</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Todos os saques são enviados{' '}
                <span className="font-semibold text-positive">imediatamente via PIX</span> para sua
                conta. Cada saque tem uma taxa fixa de{' '}
                <span className="font-semibold text-primary">R$ 2,99</span> descontada do saldo.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <button type="button" className="transition-colors hover:text-foreground">
          Termos de Uso
        </button>
        <span className="h-3 w-px bg-border" aria-hidden="true" />
        <button type="button" className="transition-colors hover:text-foreground">
          Política de Privacidade
        </button>
      </div>
    </section>
  )
}
