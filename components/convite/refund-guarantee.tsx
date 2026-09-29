import { ShieldCheck, Sparkles, RotateCcw, Zap } from 'lucide-react'

const STEPS = [
  {
    icon: Sparkles,
    title: 'Use à vontade por 7 dias',
    desc: 'Acesse tudo, teste e conheça a Luna Prive sem compromisso.',
  },
  {
    icon: RotateCcw,
    title: 'Não gostou ou quer parar?',
    desc: 'Clique no botão de reembolso no site, sem precisar explicar o motivo.',
  },
  {
    icon: Zap,
    title: 'Receba 100% de volta via Pix',
    desc: 'O valor integral volta para você de forma rápida e prática.',
  },
] as const

export function RefundGuarantee() {
  return (
    <section
      aria-labelledby="garantia-reembolso"
      className="overflow-hidden rounded-2xl border border-border/80 bg-card/40 px-4 py-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-primary">
            Garantia de 7 dias
          </span>
          <h2
            id="garantia-reembolso"
            className="mt-1 text-balance text-sm font-bold leading-tight text-foreground"
          >
            Use e seja reembolsado se não gostar
          </h2>
        </div>
      </div>

      <p className="mt-3 text-pretty text-xs leading-relaxed text-muted-foreground">
        Durante os primeiros 7 dias você usa normalmente. Se não gostar ou
        simplesmente não quiser continuar, devolvemos todo o seu dinheiro —
        sem perguntas e sem burocracia.
      </p>

      <ol className="mt-3 flex flex-col gap-2">
        {STEPS.map(({ icon: Icon, title, desc }, index) => (
          <li
            key={title}
            className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.82rem] font-semibold leading-tight text-foreground">
                <span className="sr-only">{`Passo ${index + 1}: `}</span>
                {title}
              </span>
              <span className="block text-pretty text-[0.72rem] leading-snug text-muted-foreground">
                {desc}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-center text-[0.7rem] leading-snug text-muted-foreground">
        O risco é todo nosso: você só fica se realmente gostar.
      </p>
    </section>
  )
}
