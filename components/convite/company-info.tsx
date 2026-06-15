'use client'

export function CompanyInfo() {
  return (
    <section aria-label="Links legais">
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
