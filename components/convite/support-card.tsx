import { MessageCircle, MessagesSquare, Mail, Ticket, ShieldCheck } from 'lucide-react'

const CHANNELS = [
  { icon: MessageCircle, label: 'WhatsApp' },
  { icon: MessagesSquare, label: 'Chat no site' },
  { icon: Mail, label: 'E-mail' },
  { icon: Ticket, label: 'Ticket' },
] as const

export function SupportCard() {
  return (
    <section aria-labelledby="suporte-exclusivo" className="relative isolate">
      <div className="luna-border relative z-10 overflow-hidden rounded-3xl border border-border/50 bg-card px-5 py-5 shadow-2xl shadow-black/40">
        {/* Cabeçalho enxuto */}
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id="suporte-exclusivo"
              className="text-balance text-base font-bold leading-tight text-foreground"
            >
              Suporte exclusivo
            </h2>
            <p className="text-pretty text-xs leading-snug text-muted-foreground">
              Atendimento em todos os canais, com total privacidade.
            </p>
          </div>
        </div>

        {/* Canais em grid 2x2 compacto */}
        <ul className="mt-4 grid grid-cols-2 gap-2">
          {CHANNELS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="truncate text-sm font-medium text-foreground">{label}</span>
            </li>
          ))}
        </ul>

        {/* Selo de sigilo */}
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          Atendimento 100% sigiloso e discreto
        </p>
      </div>
    </section>
  )
}
