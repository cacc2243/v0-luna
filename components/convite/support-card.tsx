import { MessageCircle, MessagesSquare, Mail, Ticket, ShieldCheck } from 'lucide-react'

const CHANNELS = [
  {
    icon: MessageCircle,
    title: 'Suporte por WhatsApp',
    desc: 'Fale direto com nossa equipe pelo WhatsApp, com resposta rápida.',
  },
  {
    icon: MessagesSquare,
    title: 'Chat direto no site',
    desc: 'Tire suas dúvidas na hora pelo chat, sem sair da plataforma.',
  },
  {
    icon: Mail,
    title: 'Atendimento por e-mail',
    desc: 'Envie sua solicitação e receba um retorno completo por e-mail.',
  },
  {
    icon: Ticket,
    title: 'Abertura de ticket',
    desc: 'Registre um ticket e acompanhe cada etapa do seu atendimento.',
  },
] as const

export function SupportCard() {
  return (
    <section aria-labelledby="suporte-exclusivo" className="relative isolate">
      <div className="luna-border relative z-10 overflow-hidden rounded-3xl border border-border/50 bg-card px-5 py-6 shadow-2xl shadow-black/40">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <h2
            id="suporte-exclusivo"
            className="mt-3 text-balance text-lg font-bold leading-tight text-foreground"
          >
            Suporte exclusivo em todos os canais
          </h2>
          <p className="mt-1.5 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
            Tudo para garantir que você seja muito bem atendida e tenha total privacidade.
          </p>
        </div>

        <ul className="mt-5 flex flex-col gap-2.5">
          {CHANNELS.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="flex items-start gap-3 rounded-2xl border border-border/40 bg-background/40 px-3.5 py-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight text-foreground">{title}</p>
                <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-primary/10 px-4 py-2.5">
          <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-pretty text-xs font-medium leading-snug text-foreground">
            Atendimento 100% sigiloso e discreto.
          </p>
        </div>
      </div>
    </section>
  )
}
