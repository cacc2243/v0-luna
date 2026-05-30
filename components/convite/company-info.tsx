'use client'

import { ShieldCheck, Lock, Fingerprint } from 'lucide-react'

const items = [
  {
    icon: ShieldCheck,
    title: 'Luna Privé Serviços Digitais LTDA',
    description: 'CNPJ 56.164.932/0001-07',
  },
  {
    icon: Lock,
    title: 'Pagamentos via gateway autorizado',
    description:
      'Transações processadas por instituição regulada pelo Banco Central do Brasil.',
  },
  {
    icon: Fingerprint,
    title: 'Privacidade garantida',
    description:
      'Seus dados são protegidos conforme a LGPD. Nenhuma informação é compartilhada.',
  },
]

export function CompanyInfo() {
  return (
    <section aria-labelledby="empresa">
      <div className="luna-border overflow-hidden rounded-2xl bg-card px-5 py-5">
        <h2
          id="empresa"
          className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
        >
          Sobre a empresa
        </h2>

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <item.icon className="size-4" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <button type="button" className="transition-colors hover:text-foreground">
            Termos de Uso
          </button>
          <span className="h-3 w-px bg-border" aria-hidden="true" />
          <button type="button" className="transition-colors hover:text-foreground">
            Política de Privacidade
          </button>
        </div>
      </div>

      {/* Barra de confiança */}
      <div className="luna-border mt-3 flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-positive/15 text-positive">
          <ShieldCheck className="size-4" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">Seus dados ficam protegidos</p>
          <p className="text-xs text-muted-foreground">Privacidade garantida pela plataforma</p>
        </div>
      </div>
    </section>
  )
}
