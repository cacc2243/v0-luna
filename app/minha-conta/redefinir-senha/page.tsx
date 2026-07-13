'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react'

type Status = 'checking' | 'ready' | 'invalid' | 'saving' | 'done'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Estabelece a sessão de recuperação. O nosso e-mail envia um link no
  // próprio domínio (lunaprive.live) com ?token_hash=...&type=recovery, que
  // trocamos por uma sessão aqui via verifyOtp. Como fallback, também
  // aceitamos uma sessão já existente (fluxo antigo via /auth/callback) e o
  // evento PASSWORD_RECOVERY.
  useEffect(() => {
    const supabase = createClient()
    let settled = false

    const finish = (next: Status) => {
      if (settled) return
      settled = true
      setStatus(next)
    }

    async function establish() {
      // 1) Novo fluxo: token_hash na URL -> verifyOtp.
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get('token_hash')
      const type = params.get('type')

      if (tokenHash && type === 'recovery') {
        const { error: otpErr } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        })
        // Limpa o token da URL por segurança/estética.
        window.history.replaceState(null, '', window.location.pathname)
        finish(otpErr ? 'invalid' : 'ready')
        return
      }

      // 2) Fallback: sessão já estabelecida (fluxo antigo).
      const { data } = await supabase.auth.getSession()
      if (data.session) finish('ready')
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        finish('ready')
      }
    })

    establish()

    // Se após um tempo não houver sessão, o link é inválido/expirado.
    const timer = setTimeout(() => finish('invalid'), 4000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setStatus('saving')
    const supabase = createClient()
    const { error: updateErr } = await supabase.auth.updateUser({ password })

    if (updateErr) {
      setStatus('ready')
      if (/should be different|same as/i.test(updateErr.message)) {
        setError('A nova senha precisa ser diferente da anterior.')
      } else if (/weak|at least/i.test(updateErr.message)) {
        setError('Escolha uma senha mais forte.')
      } else {
        setError(updateErr.message)
      }
      return
    }

    setStatus('done')
    // Pequena pausa para a usuária ler a confirmação e então segue para a conta.
    setTimeout(() => {
      router.push('/minha-conta')
    }, 1800)
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
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
        <img
          src="/images/luna-prive-logo.png"
          alt="Luna Prive"
          className="mb-8 h-10 w-auto"
        />

        <div className="w-full max-w-sm">
          <div className="luna-border rounded-3xl bg-card p-6 shadow-2xl">
            {status === 'checking' && (
              <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Validando seu link...</p>
              </div>
            )}

            {status === 'invalid' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="size-8 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Link inválido ou expirado</h1>
                <p className="mx-auto mt-2 max-w-[18rem] text-pretty text-sm leading-relaxed text-muted-foreground">
                  Este link de recuperação não é mais válido. Solicite um novo na tela de login.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/minha-conta')}
                  className="luna-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
                >
                  <ArrowLeft className="size-5" />
                  Voltar para o login
                </button>
              </div>
            )}

            {status === 'done' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="size-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Senha atualizada!</h1>
                <p className="mx-auto mt-2 max-w-[18rem] text-pretty text-sm leading-relaxed text-muted-foreground">
                  Sua nova senha foi salva com sucesso. Redirecionando para a sua conta...
                </p>
                <Loader2 className="mx-auto mt-5 size-6 animate-spin text-primary" />
              </div>
            )}

            {(status === 'ready' || status === 'saving') && (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10">
                    <KeyRound className="size-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Criar nova senha</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Escolha uma nova senha para a sua conta.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-foreground">
                      Nova senha
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-3.5 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                      <Lock className="size-5 text-muted-foreground" />
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo de 6 caracteres"
                        className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        className="text-muted-foreground transition hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-foreground">
                      Confirmar nova senha
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-3.5 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                      <Lock className="size-5 text-muted-foreground" />
                      <input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'saving'}
                    className="luna-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-70"
                  >
                    {status === 'saving' ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar nova senha'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
