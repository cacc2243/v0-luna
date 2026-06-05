'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { Lock, User, ShieldCheck, Loader2 } from 'lucide-react'
import { loginAction } from '@/app/painel/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Entrando...
        </>
      ) : (
        'Acessar painel'
      )}
    </button>
  )
}

export function AdminLogin() {
  const router = useRouter()
  const [state, formAction] = useActionState(loginAction, null)

  useEffect(() => {
    if (state?.success) {
      router.refresh()
    }
  }, [state, router])

  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15">
            <ShieldCheck className="size-7 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Painel Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso restrito · Luna Privé
          </p>
        </div>

        <form
          action={formAction}
          className="rounded-3xl border border-border bg-card p-6 shadow-2xl"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Usuário
            </label>
            <div className="flex items-center rounded-xl border border-border bg-secondary/60 px-3 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
              <User className="size-4 text-muted-foreground" />
              <input
                name="username"
                type="text"
                autoComplete="username"
                placeholder="admin"
                className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Senha
            </label>
            <div className="flex items-center rounded-xl border border-border bg-secondary/60 px-3 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
              <Lock className="size-4 text-muted-foreground" />
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••"
                className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                required
              />
            </div>
          </div>

          {state?.error && (
            <p className="mb-3 text-center text-xs font-medium text-destructive">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </main>
  )
}
