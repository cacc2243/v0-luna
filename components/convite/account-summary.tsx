'use client'

import { User, Mail, KeyRound, Pencil } from 'lucide-react'

interface AccountSummaryProps {
  username: string
  email: string
  pixType: string
  pixKey: string
}

export function AccountSummary({ username, email, pixType, pixKey }: AccountSummaryProps) {
  const rows = [
    {
      icon: User,
      label: 'Nome de usuário',
      value: `@${username || 'sua_conta'}`,
    },
    {
      icon: Mail,
      label: 'E-mail',
      value: email || 'seu@email.com',
    },
    {
      icon: KeyRound,
      label: `Chave PIX${pixType ? ` · ${pixType}` : ''}`,
      value: pixKey || 'sua chave PIX',
    },
  ]

  return (
    <section aria-labelledby="sua-conta">
      <h2
        id="sua-conta"
        className="mb-2.5 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
      >
        <span className="size-1.5 rounded-full luna-gradient" aria-hidden="true" />
        Sua conta
      </h2>

      <div className="luna-border-soft divide-y divide-border/40 overflow-hidden rounded-2xl bg-card">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <row.icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                {row.label}
              </p>
              <p className="truncate text-sm font-semibold text-foreground">{row.value}</p>
            </div>
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70"
              aria-hidden="true"
            >
              <Pencil className="size-3.5" />
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
