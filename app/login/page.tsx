'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : authError.message
      )
      setIsLoading(false)
      return
    }

    router.push('/minha-conta')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Background decorativo */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: 'url(/images/hero-bg.png)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, oklch(0.11 0.02 360 / 0.3) 0%, oklch(0.11 0.02 360) 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <img
          src="/images/luna-prive-logo.png"
          alt="Luna Prive"
          className="mb-8 h-10 w-auto"
        />

        {/* Card de Login */}
        <div className="w-full max-w-sm">
          <div className="luna-border rounded-3xl bg-card p-6 shadow-2xl">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesse sua conta Luna Prive
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-foreground">
                  E-mail
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-3.5 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                  <Mail className="size-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-foreground">
                  Senha
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-3.5 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                  <Lock className="size-5 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="luna-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Ainda nao tem conta?{' '}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
