import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

const fees = [
  {
    icon: ArrowUpRight,
    title: 'Taxa por venda',
    description: (
      <>
        Para cada venda concluída é descontada uma taxa de{' '}
        <span className="font-semibold text-primary">2%</span> do valor total da transação.
      </>
    ),
  },
  {
    icon: ArrowDownRight,
    title: 'Taxa por saque',
    description: (
      <>
        Todos os saques são enviados{' '}
        <span className="font-semibold text-positive">imediatamente via PIX</span> para sua conta.
        Cada saque tem uma taxa fixa de{' '}
        <span className="font-semibold text-primary">R$ 4,90</span> descontada do saldo.
      </>
    ),
  },
]

export function PlatformFees() {
  return (
    <section
      aria-labelledby="taxas"
      className="overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm"
    >
      <div className="border-b border-border/40 px-4 py-3">
        <h2
          id="taxas"
          className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Taxas da plataforma
        </h2>
      </div>

      <div className="divide-y divide-border/40">
        {fees.map((fee) => (
          <div key={fee.title} className="flex items-start gap-3 px-4 py-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <fee.icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{fee.title}</p>
              <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                {fee.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
