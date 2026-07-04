'use client'

export function CompanyInfo() {
  return (
    <section aria-label="Links legais" className="flex flex-col items-center gap-3">
      <p className="max-w-sm text-balance text-center text-[0.7rem] leading-relaxed text-muted-foreground/80">
        Em cada solicitação de saque, é descontada uma taxa de R$ 2,99. Em cada venda realizada, é
        descontada uma taxa de R$ 0,90.
      </p>
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
