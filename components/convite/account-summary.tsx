'use client'

import { useState } from 'react'
import { User, Mail, KeyRound, Pencil, Check, X } from 'lucide-react'

interface SignupData {
  username: string
  email: string
  pixType: string
  pixKey: string
}

interface AccountSummaryProps {
  username: string
  email: string
  pixType: string
  pixKey: string
  /** Persiste a alteracao de um campo no estado da pagina + sessionStorage. */
  onUpdate: (field: keyof SignupData, value: string) => void
}

type FieldKey = 'username' | 'email' | 'pixKey'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AccountSummary({ username, email, pixType, pixKey, onUpdate }: AccountSummaryProps) {
  const [editing, setEditing] = useState<FieldKey | null>(null)
  const [draft, setDraft] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const rows: {
    key: FieldKey
    icon: typeof User
    label: string
    value: string
    placeholder: string
    display: string
    inputType: string
    inputMode?: 'email' | 'text'
  }[] = [
    {
      key: 'username',
      icon: User,
      label: 'Nome de usuário',
      value: username,
      placeholder: 'seu_usuario',
      display: `@${username || 'sua_conta'}`,
      inputType: 'text',
    },
    {
      key: 'email',
      icon: Mail,
      label: 'E-mail',
      value: email,
      placeholder: 'seu@email.com',
      display: email || 'seu@email.com',
      inputType: 'email',
      inputMode: 'email',
    },
    {
      key: 'pixKey',
      icon: KeyRound,
      label: `Chave PIX${pixType ? ` · ${pixType}` : ''}`,
      value: pixKey,
      placeholder: 'sua chave PIX',
      display: pixKey || 'sua chave PIX',
      inputType: 'text',
    },
  ]

  function startEdit(key: FieldKey, current: string) {
    setEditing(key)
    setDraft(current)
    setFieldError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setDraft('')
    setFieldError(null)
  }

  function saveEdit(key: FieldKey) {
    const value = draft.trim()

    if (key === 'email') {
      if (!value) {
        setFieldError('Informe seu e-mail.')
        return
      }
      if (!EMAIL_REGEX.test(value)) {
        setFieldError('E-mail inválido. Verifique e tente novamente.')
        return
      }
    }

    if (key === 'username') {
      // Normaliza o usuario: remove @, espacos e caracteres invalidos.
      const normalized = value.replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '')
      onUpdate('username', normalized)
      cancelEdit()
      return
    }

    onUpdate(key, value)
    cancelEdit()
  }

  return (
    <section aria-labelledby="sua-conta">
      <h2
        id="sua-conta"
        className="mb-2.5 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
      >
        <span className="cta-gradient size-1.5 rounded-full" aria-hidden="true" />
        Sua conta
      </h2>

      <div className="luna-border divide-y divide-border/40 overflow-hidden rounded-2xl bg-card">
        {rows.map((row) => {
          const isEditing = editing === row.key
          return (
            <div key={row.key} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <row.icon className="size-3.5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </p>

                {isEditing ? (
                  <div className="mt-1">
                    <input
                      autoFocus
                      type={row.inputType}
                      inputMode={row.inputMode}
                      value={draft}
                      placeholder={row.placeholder}
                      onChange={(e) => {
                        setDraft(e.target.value)
                        if (fieldError) setFieldError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(row.key)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="w-full rounded-lg border border-primary/40 bg-background px-2.5 py-1.5 text-sm font-semibold text-foreground outline-none ring-primary/30 focus:ring-2"
                      aria-label={`Editar ${row.label}`}
                      aria-invalid={!!fieldError}
                    />
                    {fieldError && (
                      <p className="mt-1 text-[0.7rem] font-medium text-destructive">{fieldError}</p>
                    )}
                  </div>
                ) : (
                  <p className="truncate text-[0.82rem] font-semibold text-foreground">{row.display}</p>
                )}
              </div>

              {isEditing ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => saveEdit(row.key)}
                    className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary transition hover:bg-primary/25"
                    aria-label="Salvar"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary"
                    aria-label="Cancelar"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(row.key, row.value)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition hover:bg-secondary hover:text-foreground"
                  aria-label={`Editar ${row.label}`}
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
