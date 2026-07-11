'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import useSWR from 'swr'
import {
  Home,
  Package,
  Rocket,
  Wallet,
  User,
  Eye,
  ShoppingBag,
  BadgeCheck,
  Bell,
  Check,
  X,
  Plus,
  ImagePlus,
  Info,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Receipt,
  Lock,
  Unlock,
  Mail,
  ChevronRight,
  Zap,
  TrendingUp,
  Sparkles,
  MessageCircle,
  ArrowLeft,
  Send,
  Smile,
  Image,
  Mic,
  MoreVertical,
  Phone,
  Video,
  Camera,
  Settings,
  Smartphone,
  HelpCircle,
  LogOut,
  Star,
  Heart,
  MapPin,
  Instagram,
  Edit3,
  Shield,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  BellRing,
  UserX,
  Trash2,
  FileText,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Gift,
  Clock,
  DollarSign,
  EyeOff,
  KeyRound,
} from 'lucide-react'
import type { Profile, Pack, Sale, Transaction, Withdrawal, Conversation, Boost, Notification, Highlight } from './actions'
  import { generatePackActivity, generateChatActivity, acceptSale, rejectSale, requestWithdrawal, settleExpiredWithdrawals, updateProfile, markNotificationAsRead, markAllNotificationsAsRead } from './actions'
import { PixModal } from '@/components/convite/pix-modal'
import { PersonalizedSaleModal, ChatLockedModal, UnlockChatModal, GeneratingPixModal, FansWaitingModal } from '@/components/minha-conta/chat-unlock-modals'
import { ChatsActive } from '@/components/minha-conta/chats-active'
 import { NotificationToaster } from '@/components/minha-conta/notification-toaster'
import { OnboardingFlow } from '@/components/minha-conta/onboarding-flow'
 import { SupportModal } from '@/components/minha-conta/support-modal'
 import { EnablePushBanner } from '@/components/minha-conta/enable-push-banner'
import { InstallAppGuide } from '@/components/confirmation/install-app-guide'
import { saveCreds, readCreds, clearCreds } from '@/lib/auth/creds'
import { primeSounds, playSaleAccepted, playTabTap } from '@/lib/sounds'
import { cn } from '@/lib/utils'

// Valor do Chat Exclusivo (pagamento unico)
const CHAT_PRICE = 99.0

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

// Conta de 0 ate o alvo uma unica vez, ao montar (para animacao de entrada)
function useCountUpOnMount(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setValue(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Data Fetching
// ─────────────────────────────────────────────────────────────────────────────

async function fetchProfile() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return null
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  return data as Profile | null
}

async function fetchPacks() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  
  const { data } = await supabase
    .from('packs')
    .select('*, images:pack_images(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  return (data || []) as Pack[]
}

async function fetchSales() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  
  const { data } = await supabase
    .from('sales')
    .select('*, pack:packs(id, title, price, cover_image_url)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
  
  return (data || []) as Sale[]
}

async function fetchTransactions() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)
  
  return (data || []) as Transaction[]
}

async function fetchWithdrawals() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  
  const { data } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  return (data || []) as Withdrawal[]
}

async function fetchConversations() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('creator_id', user.id)
    .order('last_message_at', { ascending: false })
  
  return (data || []) as Conversation[]
}

async function fetchBoosts() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  
  const { data } = await supabase
    .from('boosts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  return (data || []) as Boost[]
}

async function fetchHighlights() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  
  const { data } = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })
  
  return (data || []) as Highlight[]
}

async function fetchNotifications() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return []
  
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  return (data || []) as Notification[]
}

// ────────�����─����──����──────────────────────────────��──────────────────────��─────────
// Dados mockados (REMOVIDOS - agora usamos dados reais)
// ───────────────────────────────────────────────���─────────────────────────────

// ────────────────────────────────────────────────────────────────────────────����
// Componente Principal
// ─────────────────────────────────────────────────────────────────────────────

export default function MinhaContaPage() {
  const [authState, setAuthState] = useState<'checking' | 'logged_in' | 'logged_out' | 'no_invite'>('checking')
  const [noInviteEmail, setNoInviteEmail] = useState('')

  // Verificar autenticacao
  useEffect(() => {
    const supabase = createClient()

    async function checkAuth() {
      let { data: { session } } = await supabase.auth.getSession()
      let user = session?.user

      // Sem sessao ativa: tenta o LOGIN AUTOMATICO com as credenciais salvas no
      // dispositivo (cadastro/entrada anteriores). Isso faz a usuaria com
      // convite pago voltar a entrar sem digitar nada.
      if (!user) {
        const creds = readCreds()
        if (creds) {
          const { error } = await supabase.auth.signInWithPassword({
            email: creds.email,
            password: creds.password,
          })
          if (!error) {
            const res = await supabase.auth.getSession()
            session = res.data.session
            user = session?.user
          } else {
            // Credenciais invalidas (senha alterada, conta removida): limpa.
            clearCreds()
          }
        }
      }

      if (!user) {
        setAuthState('logged_out')
        return
      }

      // Sessao existe — mas so pode acessar quem tem convite pago.
      const email = user.email || ''
      const allowed = await hasPaidInvite(email)
      if (allowed) {
        setAuthState('logged_in')
      } else {
        setNoInviteEmail(email)
        setAuthState('no_invite')
      }
    }

    checkAuth()

    // Escutar mudancas de autenticacao
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setAuthState('logged_out')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (authState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <img
          src="/images/luna-icon-logo.png"
          alt="Luna Prive"
          className="luna-logo-breathe size-20 object-contain"
        />
      </div>
    )
  }

  if (authState === 'no_invite') {
    return <NoInviteScreen email={noInviteEmail} />
  }

  if (authState === 'logged_out') {
    return (
      <LoginScreen
        onSuccess={() => setAuthState('logged_in')}
        onNoInvite={(email) => {
          setNoInviteEmail(email)
          setAuthState('no_invite')
        }}
      />
    )
  }

  return <AppDashboard />
}

// ─────────────────────────────────────────────────────────────────────────────
// Verificacao de convite pago (compartilhada)
// ─────────────────────────────────────────────────────────────────────────────

async function hasPaidInvite(email: string): Promise<boolean> {
  if (!email) return false
  try {
    const res = await fetch(`/api/pix/status?email=${encodeURIComponent(email.trim())}`)
    if (!res.ok) return false
    const data = await res.json()
    return !!data.hasPaidInvite
  } catch (err) {
    console.error('[v0] Erro ao verificar convite:', err)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela "Sem convite ativo"
// ─────────────────────────────────────────────────────────────────────────────

function NoInviteScreen({ email }: { email: string }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    // Evita reentrar automaticamente numa conta sem convite pago.
    clearCreds()
    router.push('/')
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
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
          <div className="luna-border rounded-3xl bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-8 text-destructive" />
            </div>

            <h1 className="text-xl font-bold text-foreground">Nenhum convite ativo</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Não encontramos um convite pago para esta conta. Resgate seu convite para
              ter acesso completo à plataforma.
            </p>

            {email && (
              <p className="mt-3 truncate rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                {email}
              </p>
            )}

            <button
              type="button"
              onClick={() => router.push('/convite')}
              className="luna-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
            >
              Resgatar convite
              <ChevronRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3.5 text-sm font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-70"
            >
              {signingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela de Login (integrada)
// ─────────��──────���───────────────────────────────────────────────────────────��

function LoginScreen({ onSuccess, onNoInvite }: { onSuccess: () => void; onNoInvite: (email: string) => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Modal exibido quando a conta existe mas não tem convite pago ativo.
  const [showNoInviteModal, setShowNoInviteModal] = useState(false)

  // Fluxo de recuperação de senha.
  const [view, setView] = useState<'login' | 'forgot'>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  function openForgot() {
    // Pré-preenche com o e-mail já digitado no login, se houver.
    setResetEmail(email.trim())
    setResetError('')
    setResetSent(false)
    setView('forgot')
  }

  function backToLogin() {
    setResetError('')
    setView('login')
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault()
    const target = resetEmail.trim()
    if (!target) return

    setResetLoading(true)
    setResetError('')

    // Chamamos a NOSSA rota, que envia o e-mail pela marca Luna Privé (via
    // Resend) e só dispara para contas com convite pago. A resposta é sempre
    // genérica (anti-enumeração), então sempre mostramos a tela de confirmação.
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      })

      if (res.status === 429) {
        setResetLoading(false)
        setResetError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
        return
      }
    } catch {
      // Falha de rede: ainda assim mostramos sucesso genérico (o pedido pode
      // ter chegado) e evitamos vazar informação.
    }

    setResetLoading(false)
    // Sempre confirmamos o envio (evita enumeração de contas).
    setResetSent(true)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    
    setIsLoading(true)
    setError('')
    
    const supabase = createClient()
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    
    if (signInError) {
      // Conta banida: o Supabase retorna um erro de banimento no login.
      // Buscamos o motivo registrado para explicá-lo à usuária.
      const looksBanned =
        (signInError as { code?: string }).code === 'user_banned' ||
        /ban/i.test(signInError.message)
      if (looksBanned) {
        let reason = 'Violação dos termos de uso da plataforma'
        try {
          const res = await fetch('/api/account/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim() }),
          })
          const json = await res.json().catch(() => null)
          if (json?.reason) reason = json.reason
        } catch {
          // mantém o motivo padrão
        }
        setIsLoading(false)
        setError(`Sua conta foi desabilitada. Motivo: ${reason}`)
        return
      }

      setIsLoading(false)
      if (signInError.message === 'Invalid login credentials') {
        setError('Email ou senha incorretos.')
      } else if (signInError.message.includes('Database error')) {
        setError('Erro no servidor. Tente novamente em alguns segundos.')
      } else {
        setError(signInError.message)
      }
      return
    }
    
    // Verificar se o convite está pago — somente contas com convite pago acessam.
    const allowed = await hasPaidInvite(email.trim())
    if (allowed) {
      // Guarda as credenciais para o login automatico nos proximos acessos.
      saveCreds({ email: email.trim(), password })
      setIsLoading(false)
      onSuccess()
    } else {
      // Conta existe mas sem convite ativo: encerramos a sessão recém-criada
      // (para não deixar a pessoa "logada sem acesso") e mostramos o modal
      // sobre a própria tela de login.
      await supabase.auth.signOut()
      setIsLoading(false)
      setShowNoInviteModal(true)
    }
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
            {view === 'login' ? (
              <>
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acesse sua conta Luna Prive
                  </p>
                </div>

                {error && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={openForgot}
                        className="text-xs font-semibold text-primary transition hover:underline"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-3.5 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                      <Lock className="size-5 text-muted-foreground" />
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="******"
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
                  <a href="/" className="font-semibold text-primary hover:underline">
                    Criar conta
                  </a>
                </p>
              </>
            ) : resetSent ? (
              /* ----- Confirmação de envio do link ----- */
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="size-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Verifique seu e-mail</h1>
                <p className="mx-auto mt-2 max-w-[18rem] text-pretty text-sm leading-relaxed text-muted-foreground">
                  Se houver uma conta associada a{' '}
                  <strong className="font-semibold text-foreground">{resetEmail.trim()}</strong>,
                  enviamos um link para você criar uma nova senha. Confira também a caixa de spam.
                </p>

                <button
                  type="button"
                  onClick={backToLogin}
                  className="luna-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
                >
                  Voltar para o login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetSent(false)
                  }}
                  className="mt-3 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Não recebeu? Enviar novamente
                </button>
              </div>
            ) : (
              /* ----- Formulário de recuperação de senha ----- */
              <>
                <button
                  type="button"
                  onClick={backToLogin}
                  className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  Voltar
                </button>

                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10">
                    <KeyRound className="size-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Recuperar senha</h1>
                  <p className="mx-auto mt-1 max-w-[18rem] text-pretty text-sm leading-relaxed text-muted-foreground">
                    Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
                  </p>
                </div>

                {resetError && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="reset-email" className="mb-1.5 block text-sm font-semibold text-foreground">
                      E-mail
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-3.5 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                      <Mail className="size-5 text-muted-foreground" />
                      <input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/60"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="luna-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-70"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="size-5" />
                        Enviar link de recuperação
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal: conta sem convite ativo */}
      {showNoInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/70 px-6 py-10 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="no-invite-title"
          onClick={() => setShowNoInviteModal(false)}
        >
          <div
            className="luna-border relative w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowNoInviteModal(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>

            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <Gift className="size-8 text-destructive" />
            </div>

            <h2 id="no-invite-title" className="text-xl font-bold text-foreground">
              Você precisa de um convite ativo
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Encontramos a sua conta, mas ela ainda não tem um convite ativo. Para entrar na
              plataforma, resgate o seu convite de acesso.
            </p>

            <button
              type="button"
              onClick={() => router.push('/convite')}
              className="luna-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
            >
              Resgatar convite
              <ChevronRight className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowNoInviteModal(false)}
              className="mt-3 w-full rounded-xl border border-border bg-secondary py-3.5 text-sm font-semibold text-foreground transition active:scale-[0.98]"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard do App (com dados reais do Supabase)
// �����������─────────────────────────────────────────────────────────────────────────������

function AppDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'Início' | 'Packs' | 'Impulsionar' | 'Carteira' | 'Chats' | 'Perfil'>('Início')
  const [showCreate, setShowCreate] = useState(false)
  const [packName, setPackName] = useState('')
  const [packPrice, setPackPrice] = useState('')
  const [packDesc, setPackDesc] = useState('')
  const [packPhotos, setPackPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [packError, setPackError] = useState<string | null>(null)
  // Onboarding em 3 passos: aparece na primeira vez que a criadora entra no /minha-conta
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [balanceFlash, setBalanceFlash] = useState(false)
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  // Convite ao impulsionamento: abre logo apos publicar um pack
  const [showBoostPromo, setShowBoostPromo] = useState(false)

  // Fluxo do Chat Exclusivo (condicao para aceitar vendas)
  const [showPersonalizedSale, setShowPersonalizedSale] = useState(false)
  const [showChatLocked, setShowChatLocked] = useState(false)
  const [showUnlockChat, setShowUnlockChat] = useState(false)
  const [showGeneratingPix, setShowGeneratingPix] = useState(false)
  const [showChatPix, setShowChatPix] = useState(false)
  // Sinaliza que o PIX do chat já foi 100% gerado e está pronto para exibir.
  // Enquanto false, a animação "Gerando seu PIX..." permanece na tela.
  const [chatPixReady, setChatPixReady] = useState(false)
  const [pendingSaleContext, setPendingSaleContext] = useState<{ buyerName?: string | null; packTitle?: string | null; amount?: number } | null>(null)
  const [userEmail, setUserEmail] = useState('')

  // Modal "conta bombando": aparece quando ha mais de 6 chats abertos
  const [showFansWaiting, setShowFansWaiting] = useState(false)
  const fansModalShown = useRef(false)

  // Fetch dados reais do Supabase usando SWR
  const { data: profile, mutate: mutateProfile } = useSWR('profile', fetchProfile)
  const { data: packs = [], mutate: mutatePacks } = useSWR('packs', fetchPacks)
  const { data: sales = [], mutate: mutateSales } = useSWR('sales', fetchSales)
  const { data: transactions = [], mutate: mutateTransactions } = useSWR('transactions', fetchTransactions)
  const { data: withdrawals = [], mutate: mutateWithdrawals } = useSWR('withdrawals', fetchWithdrawals)
  const { data: conversations = [], mutate: mutateConversations } = useSWR('conversations', fetchConversations)
  const { data: boosts = [], mutate: mutateBoosts } = useSWR('boosts', fetchBoosts)
  const { data: highlights = [], mutate: mutateHighlights } = useSWR('highlights', fetchHighlights)
  const { data: notifications = [], mutate: mutateNotifications } = useSWR('notifications', fetchNotifications)
  // Precos configurados no painel (fonte unica da verdade). Exibicao bate com o que o servidor cobra.
  const { data: pricing } = useSWR('public-pricing', async () => {
    const res = await fetch('/api/settings/public')
    if (!res.ok) return null
    return res.json() as Promise<{
      chatAmountCents: number
      giftUnlockAmountCents: number
      boostAmountCents: Record<string, number>
    }>
  })

  // Preco do chat: vem do painel; fallback para o padrao se ainda nao carregou.
  const chatPrice = pricing?.chatAmountCents ? pricing.chatAmountCents / 100 : CHAT_PRICE

  // Calcular estatisticas
  const balance = profile?.balance || 0
  const pendingSales = sales.filter(s => s.status === 'pending')
  const pendingBalance = pendingSales.reduce((sum, s) => sum + Number(s.net_amount), 0)
  const completedSales = sales.filter(s => s.status === 'completed')
  // "Hoje" = total liquido das vendas confirmadas hoje.
  // Usa a tabela de vendas (mesma fonte do contador "Vendas"), garantindo
  // que sempre reflita o que foi vendido no dia, mesmo sem transacao registrada.
  const isToday = (dateStr: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const now = new Date()
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  }
  const todayEarnings = completedSales
    .filter(s => isToday(s.created_at))
    .reduce((sum, s) => sum + Number(s.net_amount), 0)
  const totalViews = packs.reduce((sum, p) => sum + p.views_count, 0)

  const animatedBalance = useCountUp(balance)

  // Revalida tudo que muda com a atividade
  const refreshActivity = useCallback(() => {
    mutatePacks()
    mutateSales()
    mutateNotifications()
    mutateProfile()
    mutateTransactions()
  }, [mutatePacks, mutateSales, mutateNotifications, mutateProfile, mutateTransactions])

  // Carrega o e-mail do usuario logado (necessario para o PIX do Chat Exclusivo)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
  }, [])

  // Modal "conta bombando": aparece quando a criadora acumula mais de 6 chats e
  // volta a aparecer a cada 4 minutos ate que o chat exclusivo seja pago E os
  // presentes estejam habilitados.
  const chatUnlocked = !!profile?.chat_unlocked
  const giftsEnabled = !!profile?.gifts_enabled
  useEffect(() => {
    // Enquanto faltar pagar o chat ou habilitar presentes, mantemos o lembrete ativo
    if (chatUnlocked && giftsEnabled) return
    if (conversations.length <= 6) return

    // Primeira aparicao logo ao atingir o gatilho (uma vez por sessao)
    if (!fansModalShown.current) {
      fansModalShown.current = true
      setShowFansWaiting(true)
    }

    // Reaparece a cada 4 minutos
    const interval = setInterval(() => {
      setShowFansWaiting(true)
    }, 4 * 60 * 1000)

    return () => clearInterval(interval)
  }, [conversations.length, chatUnlocked, giftsEnabled])

  // Versao com debounce: ao aceitar varios pedidos em sequencia, agrupamos
  // todas as revalidacoes numa unica no fim, evitando dezenas de requisicoes
  // simultaneas que travavam a UI. A atualizacao otimista ja deixa tudo instantaneo.
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refreshActivityDebounced = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => {
      refreshActivity()
      refreshTimer.current = null
    }, 600)
  }, [refreshActivity])

  // Instante em que o PRIMEIRO pack foi publicado (created_at mais antigo).
  // Pedidos e chats só começam a aparecer 20s após esse marco.
  const firstPackAt = useMemo(() => {
    if (packs.length === 0) return 0
    return Math.min(...packs.map((p) => new Date(p.created_at).getTime()))
  }, [packs])

  const ACTIVITY_DELAY = 20000 // 20s após publicar o primeiro pack

  // Motor de atividade: enquanto houver packs publicados, gera views/pedidos periodicamente.
  // Os pedidos aparecem UM DE CADA VEZ, com intervalo aleatorio de 7 a 25s entre eles,
  // para nao chegarem rapido demais nem em lote.
  useEffect(() => {
    if (packs.length === 0) return
    const initialDelay = Math.max(ACTIVITY_DELAY - (Date.now() - firstPackAt), 0)
    let timer: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    // Delay aleatorio entre 7s e 25s.
    const nextDelay = () => 7000 + Math.floor(Math.random() * 18001)

    const runCycle = async (isFirst: boolean) => {
      if (cancelled) return
      await generatePackActivity({ initial: isFirst, maxOrders: 1 })
      if (cancelled) return
      refreshActivity()
      timer = setTimeout(() => runCycle(false), nextDelay())
    }

    const startTimer = setTimeout(() => runCycle(true), initialDelay)
    return () => {
      cancelled = true
      clearTimeout(startTimer)
      if (timer) clearTimeout(timer)
    }
  }, [packs.length, firstPackAt, refreshActivity])

  // Motor de chat: novos clientes mandam mensagem periodicamente (gera toast).
  // So funciona quando a usuaria tem o Chat Exclusivo pago/desbloqueado.
  // Acumula no maximo 4 conversas — quando atinge o limite, o motor para.
  useEffect(() => {
    if (packs.length === 0) return
    if (!profile?.chat_unlocked) return
    if (conversations.length >= 4) return
    const initialDelay = Math.max(ACTIVITY_DELAY - (Date.now() - firstPackAt), 0)
    let interval: ReturnType<typeof setInterval> | null = null
    const startTimer = setTimeout(async () => {
      await generateChatActivity()
      mutateConversations()
      mutateNotifications()
      interval = setInterval(async () => {
        await generateChatActivity()
        mutateConversations()
        mutateNotifications()
      }, 38000)
    }, initialDelay)
    return () => {
      clearTimeout(startTimer)
      if (interval) clearInterval(interval)
    }
  }, [packs.length, conversations.length, firstPackAt, profile?.chat_unlocked, mutateConversations, mutateNotifications])

  // Aceitar / recusar pedidos (atualizacao otimista = instantaneo)
  async function handleAcceptSale(saleId: string) {
    const sale = sales.find(s => s.id === saleId)
    if (!sale || sale.status !== 'pending') return

    // Gate: sem Chat Exclusivo ativo, nao pode aceitar vendas COM chat.
    // Pedidos diretos podem ser aceitos por qualquer conta com convite pago.
    if (!sale.is_direct && !profile?.chat_unlocked) {
      setPendingSaleContext({
        buyerName: sale.buyer_name,
        packTitle: sale.pack?.title ?? null,
        amount: Number(sale.amount),
      })
      setShowPersonalizedSale(true)
      return
    }

    const net = Number(sale.net_amount)

    // Atualiza a UI imediatamente usando updaters funcionais para que
    // multiplos aceites rapidos se acumulem em vez de se sobrescreverem.
    mutateSales(
      (current = []) => current.map(s => (s.id === saleId ? { ...s, status: 'completed' } : s)),
      { revalidate: false },
    )
    mutateProfile(
      (current) =>
        current
          ? {
              ...current,
              balance: Number(current.balance) + net,
              total_earned: Number(current.total_earned) + net,
              sales_count: Number(current.sales_count) + 1,
            }
          : current,
      { revalidate: false },
    )
    // Dispara destaque no saldo
    setBalanceFlash(true)
    setTimeout(() => setBalanceFlash(false), 1200)
    // Som de venda aceita / dinheiro creditado.
    playSaleAccepted()

    // Persiste no servidor em segundo plano; revalidacao agrupada (debounce)
    acceptSale(saleId).then((res) => {
      // Defesa extra: se o servidor recusar por falta de chat, reverte a UI
      if (res && (res as { error?: string }).error === 'chat_locked') {
        mutateSales(
          (current = []) => current.map(s => (s.id === saleId ? { ...s, status: 'pending' } : s)),
          { revalidate: false },
        )
        mutateProfile(
          (current) =>
            current
              ? {
                  ...current,
                  balance: Number(current.balance) - net,
                  total_earned: Number(current.total_earned) - net,
                  sales_count: Math.max(0, Number(current.sales_count) - 1),
                }
              : current,
          { revalidate: false },
        )
        setPendingSaleContext({ buyerName: sale.buyer_name, packTitle: sale.pack?.title ?? null, amount: Number(sale.amount) })
        setShowPersonalizedSale(true)
        return
      }
      refreshActivityDebounced()
    })
  }
  async function handleRejectSale(saleId: string) {
    // Remove da lista imediatamente
    mutateSales(
      (current = []) => current.map(s => (s.id === saleId ? { ...s, status: 'cancelled' } : s)),
      { revalidate: false },
    )
    rejectSale(saleId).then(() => refreshActivityDebounced())
  }

  // Upload de uma foto para o Storage e retorno da URL publica
  async function handleAddPackPhoto(files: File[]) {
    if (uploadingPhoto || files.length === 0) return
    setUploadingPhoto(true)
    setPackError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
      if (!user) {
        setPackError('Sessão expirada. Faça login novamente.')
        return
      }
      let hadError = false
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${user.id}/packs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('media')
          .upload(path, file, { upsert: true, contentType: file.type })
        if (upErr) {
          hadError = true
          continue
        }
        const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
        setPackPhotos((prev) => [...prev, pub.publicUrl])
      }
      if (hadError) {
        setPackError('Alguns arquivos não puderam ser enviados. Tente novamente.')
      }
    } finally {
      setUploadingPhoto(false)
    }
  }

  function removePackPhoto(url: string) {
    setPackPhotos((prev) => prev.filter((u) => u !== url))
  }

  function resetPackForm() {
    setPackName('')
    setPackPrice('')
    setPackDesc('')
    setPackPhotos([])
    setPackError(null)
  }

  // Publicar pack real
  async function publishPack() {
    if (publishing) return
    if (uploadingPhoto) {
      setPackError('Aguarde a foto terminar de carregar.')
      return
    }
    if (!packName.trim()) {
      setPackError('Dê um nome ao seu pack.')
      return
    }
    if (packPhotos.length === 0) {
      setPackError('Adicione pelo menos 1 foto ao seu pack.')
      return
    }
    setPublishing(true)
    setPackError(null)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

    if (!user) {
      setPackError('Sessão expirada. Faça login novamente.')
      setPublishing(false)
      return
    }

    const priceNum = parseFloat(packPrice.replace(',', '.')) || 0

    const { data: created, error } = await supabase
      .from('packs')
      .insert({
        user_id: user.id,
        title: packName.trim(),
        description: packDesc.trim() || null,
        price: priceNum,
        cover_image_url: packPhotos[0] || null,
        is_published: true,
      })
      .select()
      .single()

    if (error || !created) {
      setPackError('Não foi possível criar o pack. Tente novamente.')
      setPublishing(false)
      return
    }

    // Salvar as fotos do pack (se houver)
    if (packPhotos.length > 0) {
      await supabase.from('pack_images').insert(
        packPhotos.map((url, i) => ({
          pack_id: created.id,
          image_url: url,
          is_preview: i === 0,
          order_index: i,
        })),
      )
    }

    setPublishing(false)
    setShowCreate(false)
    resetPackForm()
    mutatePacks()

    // Convida a impulsionar o perfil logo apos publicar, para ganhar visibilidade.
    setShowBoostPromo(true)

    // A atividade inicial (views, pedidos, notificacoes) NAO dispara na hora:
    // o motor de atividade abaixo agenda a primeira leva ~20s apos a publicacao.
  }

  // Onboarding: dispara apenas na primeira visita ao /minha-conta
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const seen = localStorage.getItem('luna_onboarding_seen')
      if (!seen) setShowOnboarding(true)
    } catch {
      setShowOnboarding(true)
    }
  }, [])

  function closeOnboarding() {
    try {
      localStorage.setItem('luna_onboarding_seen', '1')
    } catch {
      // ignora indisponibilidade do localStorage
    }
    setShowOnboarding(false)
  }

  // Logout
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Remove as credenciais salvas para nao reentrar automaticamente.
    clearCreds()
    // Após deslogar, permanece em /minha-conta (que exibe a tela de login).
    router.push('/minha-conta')
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Toaster de notificacoes (vendas e mensagens) sobre todo o conteudo */}
      <NotificationToaster notifications={notifications} />

      {/* Imagem de fundo */}
      <div 
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/app-background.webp)' }}
      >
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Onboarding em 3 passos (primeira visita) */}
      {showOnboarding && <OnboardingFlow onClose={closeOnboarding} />}

      {/* Convite ao impulsionamento — abre logo apos publicar um pack */}
      {showBoostPromo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-2xl shadow-primary/25">
            <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary/15">
                <Rocket className="size-8 text-primary" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-pretty text-xl font-bold text-foreground">
                Pack publicado! Bora vender mais?
              </h2>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                Impulsione o seu perfil para aumentar a sua visibilidade e ter{' '}
                <strong className="font-semibold text-foreground">muito mais pedidos</strong>{' '}
                acontecendo. Seu perfil aparece em destaque para novos compradores.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowBoostPromo(false)
                  setActiveTab('Impulsionar')
                }}
                className="luna-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
              >
                <Rocket className="size-5" aria-hidden="true" />
                Impulsionar meu perfil
              </button>
              <button
                type="button"
                onClick={() => setShowBoostPromo(false)}
                className="mt-2 w-full rounded-2xl py-3 text-sm font-semibold text-muted-foreground transition active:scale-[0.98]"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteudo rolavel do app */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
      {activeTab === 'Carteira' ? (
                <WalletScreen
          balance={animatedBalance}
          pendingBalance={pendingBalance}
          withdrawals={withdrawals}
          transactions={transactions}
          profile={profile}
          userEmail={userEmail}
          userName={profile?.display_name || 'Criadora Luna'}
          onWithdrawalsChange={() => {
            mutateWithdrawals()
            mutateProfile()
          }}
          onProfileUpdated={mutateProfile}
        />
      ) : activeTab === 'Packs' ? (
        <PacksScreen
          balance={animatedBalance}
          packs={packs}
          onCreate={() => setShowCreate(true)}
          onSelect={(id) => setSelectedPackId(id)}
        />
      ) : activeTab === 'Perfil' ? (
        <ProfileScreen profile={profile} highlights={highlights} notifications={notifications} onLogout={handleLogout} onProfileUpdated={mutateProfile} onHighlightsUpdated={mutateHighlights} onNotificationsChange={mutateNotifications} />
      ) : activeTab === 'Impulsionar' ? (
        <ImpulsionarScreen
          balance={animatedBalance}
          boosts={boosts}
          userEmail={userEmail}
          userName={profile?.display_name || 'Criadora Luna'}
          boostPrices={pricing?.boostAmountCents}
          onBoostActivated={() => {
            mutateBoosts()
          }}
        />
      ) : activeTab === 'Chats' ? (
        <ChatsScreen
          balance={animatedBalance}
          chatUnlocked={!!profile?.chat_unlocked}
          giftsEnabled={!!profile?.gifts_enabled}
          userName={profile?.display_name || 'Criadora Luna'}
          userEmail={userEmail}
          packsCount={packs.length}
          salesCount={profile?.sales_count || 0}
          chatPrice={chatPrice}
          giftPrice={pricing?.giftUnlockAmountCents ? pricing.giftUnlockAmountCents / 100 : undefined}
          onGoToPacks={() => setActiveTab('Packs')}
          onUnlockChat={() => {
            // Gera o PIX do chat direto: modal montado por baixo e animação por
            // cima até o PIX estar 100% pronto.
            setChatPixReady(false)
            setShowChatPix(true)
            setShowGeneratingPix(true)
          }}
          onProfileRefresh={mutateProfile}
        />
      ) : (
                <HomeScreen
                  balance={animatedBalance}
                  today={todayEarnings}
                  views={totalViews}
                  vendas={profile?.sales_count || 0}
                  profile={profile}
                  packs={packs}
                  pendingSales={pendingSales}
                  completedSales={completedSales}
                  notifications={notifications}
                  onAccept={handleAcceptSale}
                  onReject={handleRejectSale}
                  balanceFlash={balanceFlash}
                />
      )}
      </div>

      {/* Bottom nav */}
      <nav className="relative z-10 flex shrink-0 items-end justify-around border-t border-border bg-card/95 px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        {[
          { icon: Home, label: 'Início' as const },
          { icon: Package, label: 'Packs' as const },
          { icon: Wallet, label: 'Carteira' as const },
          { icon: MessageCircle, label: 'Chats' as const, center: true },
          { icon: Rocket, label: 'Impulsionar' as const },
          { icon: User, label: 'Perfil' as const },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              primeSounds()
              playTabTap()
              setActiveTab(item.label as any)
            }}
            className="flex w-14 flex-col items-center gap-1"
          >
            {item.center ? (
              <span className="luna-gradient -mt-7 flex size-12 items-center justify-center rounded-full shadow-lg shadow-primary/40 ring-4 ring-card">
                <item.icon className="size-5 text-primary-foreground" aria-hidden="true" />
              </span>
            ) : (
              <item.icon
                className={`size-5 transition ${item.label === activeTab ? 'text-primary' : 'text-muted-foreground'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`text-[0.6rem] transition ${
                item.label === activeTab ? 'font-semibold text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Fluxo do Chat Exclusivo */}
      <PersonalizedSaleModal
        isOpen={showPersonalizedSale}
        onClose={() => setShowPersonalizedSale(false)}
        buyerName={pendingSaleContext?.buyerName}
        packTitle={pendingSaleContext?.packTitle}
        amount={pendingSaleContext?.amount}
        onUnlock={() => {
          setShowPersonalizedSale(false)
          setShowChatLocked(true)
        }}
      />
      <ChatLockedModal
        isOpen={showChatLocked}
        onClose={() => setShowChatLocked(false)}
        price={chatPrice}
        onUnlock={() => {
          setShowChatLocked(false)
          setShowUnlockChat(true)
        }}
      />
      <UnlockChatModal
        isOpen={showUnlockChat}
        onClose={() => setShowUnlockChat(false)}
        price={chatPrice}
        onConfirm={() => {
          setShowUnlockChat(false)
          // Inicia a geração do PIX imediatamente (modal montado por baixo) e
          // mostra a animação por cima até o PIX estar 100% pronto.
          setChatPixReady(false)
          setShowChatPix(true)
          setShowGeneratingPix(true)
        }}
      />
      <GeneratingPixModal
        isOpen={showGeneratingPix}
        ready={chatPixReady}
        onDone={() => setShowGeneratingPix(false)}
      />
      {showChatPix && (
        <PixModal
          isOpen={showChatPix}
          onReady={() => setChatPixReady(true)}
          onClose={() => {
            setShowChatPix(false)
            setChatPixReady(false)
          }}
          email={userEmail}
          amount={chatPrice}
          userName={profile?.display_name || 'Criadora Luna'}
          type="chat"
          title="Chat Exclusivo"
          subtitle="Pagamento único · Acesso vitalício"
          onPaymentConfirmed={() => {
            // Atualiza o perfil para refletir o desbloqueio imediatamente
            mutateProfile(
              (current) => (current ? { ...current, chat_unlocked: true } : current),
              { revalidate: true },
            )
            setShowChatPix(false)
            setChatPixReady(false)
          }}
        />
      )}

      {/* Modal — conta bombando (fas querendo conversar) */}
      <FansWaitingModal
        isOpen={showFansWaiting}
        onClose={() => setShowFansWaiting(false)}
        chatCount={conversations.length}
        totalViews={totalViews}
        pendingAmount={pendingBalance}
        onRespond={() => {
          setShowFansWaiting(false)
          setActiveTab('Chats')
        }}
      />

      {/* Modal — Criar Pack */}
      {selectedPackId && (
        <PackDetailScreen
          pack={packs.find((p) => p.id === selectedPackId) ?? null}
          sales={sales}
          onClose={() => setSelectedPackId(null)}
          onUpdated={mutatePacks}
        />
      )}

      {showCreate && (
        <div className="absolute inset-0 z-[55] flex items-start justify-center px-4 pb-40 pt-6">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !publishing && setShowCreate(false)}
            aria-hidden="true"
          />
          <div className="animate-pop relative flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            {/* Cabeçalho fixo */}
            <div className="shrink-0 border-b border-border/60 px-5 pb-4 pt-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Package className="size-4.5 text-primary" aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <h2 className="text-base font-bold text-foreground">Criar Pack</h2>
                    <p className="text-xs text-muted-foreground">Monte sua vitrine de conteúdo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !publishing && setShowCreate(false)}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary active:scale-95"
                  aria-label="Fechar"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Conteúdo rolável */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-3.5 py-3">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-pretty text-xs leading-relaxed text-foreground">
                  O número ideal de fotos por pack é de 2 a 4 fotos.{' '}
                  <span className="font-bold">Mínimo de 2 fotos por pack.</span>
                </p>
              </div>

              <label htmlFor="pack-name" className="mb-1.5 block text-sm font-semibold text-foreground">
                Nome do pack
              </label>
              <input
                id="pack-name"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="Ex: Ensaio Casual"
                className="mb-5 w-full rounded-xl border border-border bg-secondary px-3.5 py-3.5 text-base text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />

              <label htmlFor="pack-price" className="mb-1.5 block text-sm font-semibold text-foreground">
                Preço (R$)
              </label>
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-3.5 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                <span className="text-base font-medium text-muted-foreground">R$</span>
                <input
                  id="pack-price"
                  value={packPrice}
                  onChange={(e) => setPackPrice(e.target.value)}
                  inputMode="decimal"
                  className="w-full bg-transparent text-base text-foreground outline-none"
                />
              </div>
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                  Usuárias novas costumam vender mais rápido com valores entre{' '}
                  <strong className="font-semibold text-foreground">R$ 20,00</strong> e{' '}
                  <strong className="font-semibold text-foreground">R$ 70,00</strong>. Mas você é
                  livre para cobrar o valor que desejar!
                </p>
              </div>

              <label htmlFor="pack-desc" className="mb-1.5 block text-sm font-semibold text-foreground">
                Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <textarea
                id="pack-desc"
                value={packDesc}
                onChange={(e) => setPackDesc(e.target.value)}
                rows={3}
                placeholder="Descreva o conteúdo do pack..."
                className="mb-5 w-full resize-none rounded-xl border border-border bg-secondary px-3.5 py-3.5 text-base text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />

              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Fotos</span>
                <span className="rounded-full bg-positive/15 px-2.5 py-1 text-xs font-semibold text-positive">
                  {packPhotos.length} adicionadas
                </span>
              </div>
              {packPhotos.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2.5">
                  {packPhotos.map((src, i) => (
                    <div
                      key={src}
                      className="relative aspect-square overflow-hidden rounded-xl border border-border"
                    >
                      <img
                        src={src || '/placeholder.svg'}
                        alt={`Foto ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePackPhoto(src)}
                        className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-white shadow"
                        aria-label="Remover foto"
                      >
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label
                className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 py-3.5 text-sm font-semibold text-primary transition active:scale-[0.99] ${
                  uploadingPhoto ? 'pointer-events-none opacity-70' : ''
                }`}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-4" aria-hidden="true" />
                    Adicionar fotos
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,video/*,image/heic,image/heif,.heic,.heif,.mov,.mkv,.avi,.webm,.3gp"
                  multiple
                  className="sr-only"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    if (files.length) handleAddPackPhoto(files)
                    e.target.value = ''
                  }}
                />
              </label>

              {packError && (
                <p className="mt-3 text-center text-xs font-medium text-destructive">{packError}</p>
              )}
            </div>

            {/* Rodapé fixo */}
            <div className="shrink-0 border-t border-border/60 bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3.5">
              <button
                type="button"
                onClick={publishPack}
                disabled={publishing || uploadingPhoto || packPhotos.length === 0}
                className="luna-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-70"
              >
                {publishing ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    Publicando...
                  </>
                ) : uploadingPhoto ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    Carregando foto...
                  </>
                ) : (
                  <>
                    <Check className="size-5" aria-hidden="true" />
                    Criar pack
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela Chats
// ─────────────────────────────────────────────────────────────────────────────

function ChatsScreen({
  balance,
  chatUnlocked,
  giftsEnabled,
  userName,
  userEmail,
  packsCount,
  salesCount,
  chatPrice,
  giftPrice,
  onGoToPacks,
  onUnlockChat,
  onProfileRefresh,
}: {
  balance: number
  chatUnlocked: boolean
  giftsEnabled: boolean
  userName: string
  userEmail: string
  packsCount: number
  salesCount: number
  chatPrice: number
  giftPrice?: number
  onGoToPacks: () => void
  onUnlockChat: () => void
  onProfileRefresh: () => void
}) {
  // Chat ativo: lista de conversas com fluxo de presentes
  if (chatUnlocked) {
    return (
      <ChatsActive
        balance={balance}
        giftsEnabled={giftsEnabled}
        userName={userName}
        userEmail={userEmail}
        giftPrice={giftPrice}
        onProfileRefresh={onProfileRefresh}
      />
    )
  }

  const hasPacks = packsCount > 0

  // Depois da primeira venda e com pelo menos um pack publicado, o usuário já
  // pode desbloquear o chat com seus fãs. Mostramos o informe de desbloqueio.
  if (hasPacks && salesCount > 0) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/images/luna-prive-logo.png" alt="Luna Prive" className="h-9 w-auto" />
          </div>
          <div className="luna-border relative flex items-center gap-2.5 rounded-2xl bg-card/80 px-4 py-2.5 backdrop-blur-sm">
            <Wallet className="size-6 text-primary" aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-xl font-bold text-foreground">{brl(balance)}</p>
            </div>
          </div>
        </header>

        {/* Card: Chat com Fans (bloqueado) */}
        <div className="mt-6 luna-border overflow-hidden rounded-3xl bg-card">
          {/* Cabeçalho do card */}
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-base font-bold text-foreground">Chat com Fans</h2>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Lock className="size-3.5" aria-hidden="true" />
              Bloqueado
            </span>
          </div>

          {/* Prévia de mensagens (desfocada) */}
          <div className="relative px-5 pt-5">
            <div
              className="flex flex-col gap-3 opacity-40 blur-[1px]"
              aria-hidden="true"
            >
              <div className="flex items-center gap-2">
                <span className="size-9 shrink-0 rounded-full bg-muted" />
                <span className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                  Oi, amei seu pack!
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="rounded-2xl rounded-tr-sm bg-primary/25 px-3.5 py-2 text-sm text-foreground">
                  Obrigada amor!
                </span>
                <span className="size-9 shrink-0 rounded-full bg-primary/20" />
              </div>
              <div className="flex items-center gap-2">
                <span className="size-9 shrink-0 rounded-full bg-muted" />
                <span className="rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                  Quero encomendar um pack exclusivo...
                </span>
              </div>
            </div>

            {/* Overlay de desbloqueio */}
            <div className="mt-2 flex flex-col items-center px-1 pb-5 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
                <Lock className="size-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-xl font-bold text-foreground">Desbloqueie o Chat</h3>
              <p className="mt-2 max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
                Converse diretamente com seus fãs. Cada fã pagará{' '}
                <span className="font-semibold text-positive">{brl(chatPrice)}</span> para conversar
                com você e você recebe o valor{' '}
                <span className="font-semibold text-positive">integralmente</span> no seu saldo.
              </p>

              {/* Destaque social */}
              <div className="mt-4 flex w-full items-start gap-2.5 rounded-2xl border border-positive/25 bg-positive/5 p-3.5 text-left">
                <TrendingUp className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-bold text-positive">96% das usuárias</span> desbloqueiam o
                  chat pelo alto potencial de ganhos
                </p>
              </div>

              <button
                type="button"
                onClick={onUnlockChat}
                className="luna-gradient mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
              >
                <Lock className="size-5" aria-hidden="true" />
                Desbloquear Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/images/luna-prive-logo.png" alt="Luna Prive" className="h-9 w-auto" />
        </div>
        <div className="luna-border relative flex items-center gap-2.5 rounded-2xl bg-card/80 px-4 py-2.5 backdrop-blur-sm">
          <Wallet className="size-6 text-primary" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-xl font-bold text-foreground">{brl(balance)}</p>
          </div>
        </div>
      </header>

      {/* Titulo */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <MessageCircle className="size-6 text-primary-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
            </div>
            <p className="text-sm text-muted-foreground">Comece publicando seus packs</p>
          </div>
        </div>
      </div>

      {/* Estado inicial — oriente a publicar packs para atrair conversas */}
      <div className="mt-6">
        <div className="luna-border overflow-hidden rounded-3xl bg-card">
          <div className="bg-gradient-to-br from-primary/25 via-primary/10 to-transparent px-5 py-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <Package className="size-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <h2 className="mt-3 text-lg font-bold text-foreground">Publique seus packs</h2>
            <p className="mx-auto mt-1 max-w-xs text-pretty text-sm text-muted-foreground">
              Poste seus packs para que seus fãs descubram seu perfil e queiram conversar com você. Você decide quem aceita.
            </p>
          </div>
          <div className="px-5 py-5">
            <ul className="flex flex-col gap-2.5">
              {[
                'Seus packs aparecem para novos fãs',
                'Os fãs interessados pedem para conversar',
                'Você aceita quem quiser e recebe no seu saldo',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onGoToPacks}
              className="luna-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
            >
              <Package className="size-4" aria-hidden="true" />
              {hasPacks ? 'Gerenciar meus packs' : 'Publicar meu primeiro pack'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────���������──�����─────────────────────
// Tela Impulsionar
// ──────────────────────────────────────────────────────────��──────────────────

const boostPlans = [
  { days: 2, price: 28.0, pricePerDay: 14.0, discount: 0 },
  { days: 7, price: 56.0, pricePerDay: 8.0, discount: 43 },
  { days: 14, price: 70.0, pricePerDay: 5.0, discount: 64 },
  { days: 21, price: 84.0, pricePerDay: 4.0, discount: 71 },
  { days: 30, price: 99.0, pricePerDay: 3.3, discount: 76, popular: true },
]

/**
 * Monta os planos de boost a partir dos precos do painel (centavos por dias).
 * Recalcula preco/dia e o desconto relativo ao plano mais caro por dia.
 * Cai para os valores padrao se ainda nao houver precos carregados.
 */
function buildBoostPlans(boostCents?: Record<string, number>) {
  if (!boostCents) return boostPlans
  const base = boostPlans.map((p) => {
    const cents = boostCents[String(p.days)]
    const price = cents ? cents / 100 : p.price
    return { ...p, price, pricePerDay: price / p.days }
  })
  const maxPerDay = Math.max(...base.map((p) => p.pricePerDay))
  return base.map((p) => ({
    ...p,
    discount: maxPerDay > 0 ? Math.round((1 - p.pricePerDay / maxPerDay) * 100) : 0,
  }))
}

function ImpulsionarScreen({
  balance,
  boosts,
  userEmail,
  userName,
  boostPrices,
  onBoostActivated,
}: {
  balance: number
  boosts: Boost[]
  userEmail: string
  userName: string
  boostPrices?: Record<string, number>
  onBoostActivated: () => void
}) {
  const boostPlans = useMemo(() => buildBoostPlans(boostPrices), [boostPrices])
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showPix, setShowPix] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Boost ativo (perfil) que ainda nao expirou
  const activeBoost = boosts
    .filter((b) => b.boost_type === 'profile' && b.is_active && new Date(b.ends_at).getTime() > now)
    .sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime())[0]

  // Atualiza o contador regressivo a cada segundo enquanto houver boost ativo
  useEffect(() => {
    if (!activeBoost) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [activeBoost])

  const plan = boostPlans.find((p) => p.days === selectedPlan)

  function formatRemaining(endsAt: string) {
    const diff = new Date(endsAt).getTime() - now
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, total: 0 }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24))
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diff % (1000 * 60)) / 1000)
    return { d, h, m, s, total: diff }
  }

  function handleConfirmBoost() {
    setShowConfirm(false)
    setProcessing(true)
    // Pequena animacao antes de abrir o PIX
    setTimeout(() => {
      setProcessing(false)
      setShowPix(true)
    }, 1600)
  }

  const remaining = activeBoost ? formatRemaining(activeBoost.ends_at) : null

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-9 w-auto" />
        </div>
        <div className="luna-border relative flex items-center gap-2.5 rounded-2xl bg-card px-4 py-2.5">
          <Wallet className="size-6 text-primary" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-xl font-bold text-foreground">{brl(balance)}</p>
          </div>
        </div>
      </header>

      {/* Título */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
            <Rocket className="size-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Impulsionar</h1>
            <p className="text-sm text-muted-foreground">Aumente sua visibilidade</p>
          </div>
        </div>
      </div>

      {/* Impulsionamento ativo — contador regressivo */}
      {activeBoost && remaining && (
        <div className="animate-pop mt-5 overflow-hidden rounded-2xl border border-positive/40 bg-gradient-to-br from-positive/15 to-positive/5">
          <div className="flex items-center gap-2.5 border-b border-positive/20 px-4 py-3">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-positive" />
            </span>
            <p className="text-sm font-bold text-foreground">Impulsionamento ativo</p>
            <span className="ml-auto rounded-full bg-positive/20 px-2 py-0.5 text-[0.6rem] font-bold text-positive">
              {activeBoost.plan_name}
            </span>
          </div>
          <div className="px-4 py-4">
            <p className="mb-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5 text-positive" aria-hidden="true" />
              Tempo restante de destaque
            </p>
            <div className="flex items-stretch gap-2">
              {[
                { v: remaining.d, l: 'dias' },
                { v: remaining.h, l: 'horas' },
                { v: remaining.m, l: 'min' },
                { v: remaining.s, l: 'seg' },
              ].map((seg, i) => (
                <div
                  key={seg.l}
                  className="flex flex-1 flex-col items-center rounded-xl border border-border bg-card py-2.5"
                >
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {seg.v.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">{seg.l}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Seu perfil está em destaque para mais compradores. Você pode renovar a qualquer momento.
            </p>
          </div>
        </div>
      )}

      {/* Benefícios */}
      <div className="mt-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">Destaque seu perfil</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Seu perfil aparece em destaque para mais compradores. Quanto mais dias, mais visibilidade e vendas.
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 border-t border-primary/20 pt-3">
          <div className="flex items-center gap-1.5">
            <Eye className="size-4 text-positive" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">+300% views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-4 text-positive" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">+150% vendas</span>
          </div>
        </div>
      </div>

      {/* Planos */}
      <div className="mt-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Escolha seu plano</h2>
        <div className="flex flex-col gap-2.5">
          {boostPlans.map((plan) => (
            <button
              key={plan.days}
              type="button"
              onClick={() => setSelectedPlan(plan.days)}
              className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                selectedPlan === plan.days
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2 right-3 rounded-full bg-positive px-2 py-0.5 text-[0.6rem] font-bold text-white">
                  Mais popular
                </span>
              )}
              
              {/* Ícone de seleção */}
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  selectedPlan === plan.days
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30 bg-transparent'
                }`}
              >
                {selectedPlan === plan.days && (
                  <Check className="size-3.5 text-primary-foreground" aria-hidden="true" />
                )}
              </div>

              {/* Info do plano */}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-foreground">{plan.days} dias</span>
                  {plan.discount > 0 && (
                    <span className="rounded-full bg-positive/15 px-1.5 py-0.5 text-[0.6rem] font-bold text-positive">
                      -{plan.discount}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {brl(plan.pricePerDay)}/dia
                </p>
              </div>

              {/* Preço */}
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{brl(plan.price)}</p>
                {plan.discount > 0 && (
                  <p className="text-[0.65rem] text-muted-foreground line-through">
                    {brl(14 * plan.days)}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Botão de ação */}
      <div className="mt-6 pb-4">
        <button
          type="button"
          disabled={!selectedPlan}
          onClick={() => selectedPlan && setShowConfirm(true)}
          className="luna-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-50"
        >
          <Zap className="size-5" aria-hidden="true" />
          {selectedPlan
            ? `${activeBoost ? 'Renovar' : 'Impulsionar'} por ${brl(plan?.price || 0)}`
            : 'Selecione um plano'}
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          O impulsionamento começa imediatamente após a confirmação
        </p>
      </div>

      {/* Modal de confirmação */}
      {showConfirm && plan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
            aria-hidden="true"
          />
          <div className="animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary active:scale-95"
              aria-label="Fechar"
            >
              <X className="size-5" aria-hidden="true" />
            </button>

            <div className="bg-gradient-to-br from-primary/20 to-primary/5 px-5 pb-5 pt-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/20">
                <Rocket className="size-7 text-primary" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-lg font-bold text-foreground">Confirmar impulsionamento</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Geraremos um PIX no valor do seu plano
              </p>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duração do destaque</span>
                  <span className="text-sm font-bold text-foreground">{plan.days} dias</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                  <span className="text-sm text-muted-foreground">Valor por dia</span>
                  <span className="text-sm font-semibold text-foreground">{brl(plan.pricePerDay)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                  <span className="text-sm font-semibold text-foreground">Total via PIX</span>
                  <span className="text-xl font-bold text-primary">{brl(plan.price)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                  Seu perfil ficará em destaque por{' '}
                  <span className="font-semibold text-foreground">{plan.days} dias</span> assim que o
                  pagamento for confirmado. O tempo restante aparecerá aqui no topo.
                </p>
              </div>

              <button
                type="button"
                onClick={handleConfirmBoost}
                className="luna-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
              >
                <Zap className="size-5" aria-hidden="true" />
                Gerar PIX de {brl(plan.price)}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="mt-2 w-full rounded-xl py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animação de processamento */}
      {processing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
          <div className="animate-pop relative flex w-full max-w-xs flex-col items-center rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-2xl">
            <div className="relative flex size-20 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <Rocket className="size-8 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-5 text-base font-bold text-foreground">Gerando seu PIX...</p>
            <p className="mt-1 text-sm text-muted-foreground">Preparando o impulsionamento do seu perfil</p>
          </div>
        </div>
      )}

      {/* PIX do impulsionamento */}
      {showPix && plan && (
        <PixModal
          isOpen={showPix}
          onClose={() => setShowPix(false)}
          email={userEmail}
          amount={plan.price}
          userName={userName}
          type="boost"
          boostDays={plan.days}
          title="Impulsionar perfil"
          subtitle={`Destaque por ${plan.days} dias`}
          onPaymentConfirmed={() => {
            setShowPix(false)
            setSelectedPlan(null)
            onBoostActivated()
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────���─────────────────────��────────���
// Tela Inicio
// ─────────────────────────────────────────��─���───────��────────────────────��────

function HomeScreen({
  balance,
  today,
  views,
  vendas,
  profile,
  packs,
  pendingSales,
  completedSales,
  notifications,
  onAccept,
  onReject,
  balanceFlash,
}: {
  balance: number
  today: number
  views: number
  vendas: number
  profile: Profile | null | undefined
  packs: Pack[]
  pendingSales: Sale[]
  completedSales: Sale[]
  notifications: Notification[]
  onAccept: (id: string) => void
  onReject: (id: string) => void
  balanceFlash: boolean
}) {
  const [accepting, setAccepting] = useState<string | null>(null)
  const viewNotifs = notifications.filter(n => n.type === 'like' || n.type === 'follow').slice(0, 3)

  function handleAccept(id: string) {
    // Trava: enquanto um pedido esta sendo aceito, nenhum outro pode ser aceito.
    // Evita "aceitar tudo" em sequencia e da tempo do saldo (total e do dia) atualizar.
    if (accepting) return
    setAccepting(id)
    // Animacao de "Aceitando..." (1,5s) antes de confirmar e creditar o saldo
    setTimeout(() => {
      onAccept(id)
      setAccepting(null)
    }, 1500)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      {/* Header fixo */}
      <header className="sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 border-b border-border/40 bg-background/85 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-9 w-auto" />
        </div>
        <div
          className={`luna-border relative flex items-center gap-2 rounded-xl bg-card px-3 py-2 ${
            balanceFlash ? 'animate-balance-pop' : ''
          }`}
        >
          <Wallet className="size-5 text-primary" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-[0.65rem] text-muted-foreground">Saldo</p>
            <p className="text-base font-bold text-foreground">{brl(balance)}</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <StatCard icon={Wallet} label="Hoje" value={brl(today)} />
        <StatCard icon={Eye} label="Views" value={String(views)} />
        <StatCard icon={ShoppingBag} label="Vendas" value={String(vendas)} />
      </div>

      {/* Ativar notificacoes de venda no celular (some quando ja ativo) */}
      <div className="mt-3">
        <EnablePushBanner />
      </div>

      {/* Saldo pendente — soma dos pedidos ainda nao aceitos */}
      {pendingSales.length > 0 && (
        <div className="luna-border mt-2.5 flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Clock className="size-4 text-primary" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[0.7rem] text-muted-foreground">Saldo pendente</p>
            <p className="text-lg font-bold text-primary">
              {brl(pendingSales.reduce((sum, s) => sum + Number(s.amount), 0))}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[0.7rem] font-semibold text-primary">
            {pendingSales.length === 1 ? '1 pedido' : `${pendingSales.length} pedidos`}
          </span>
        </div>
      )}

      {/* Visualizações recentes */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Eye className="size-4 text-positive" aria-hidden="true" />
            Visualizações recentes
          </h3>
          <span className="rounded-full border border-positive/40 px-2 py-0.5 text-xs font-semibold text-positive">
            {views}
          </span>
        </div>
        {viewNotifs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/60 px-4 py-6">
            <p className="text-center text-xs text-muted-foreground">
              Crie seu primeiro pack para começar a receber visualizações
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card/60 px-3 py-1">
            {viewNotifs.map((n) => (
              <div key={n.id} className="flex items-center gap-2.5 border-b border-border/50 py-1.5 last:border-0">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-positive/10">
                  {n.type === 'follow' ? (
                    <Heart className="size-3 text-positive" aria-hidden="true" />
                  ) : (
                    <Eye className="size-3 text-positive" aria-hidden="true" />
                  )}
                </span>
                <p className="flex-1 truncate text-[0.7rem] text-muted-foreground">{n.description}</p>
                <span className="shrink-0 text-[0.6rem] text-muted-foreground/70">{relativeTime(n.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pedidos recentes (pedidos pendentes + histórico de aceitas) */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
            Pedidos recentes
          </h3>
          {pendingSales.length > 0 && (
            <span className="rounded-full border border-primary/40 px-2 py-0.5 text-xs font-semibold text-primary">
              {pendingSales.length === 1 ? '1 novo' : `${pendingSales.length} novos`}
            </span>
          )}
        </div>

        {/* Pedidos pendentes — aguardando aceite */}
        {pendingSales.map((sale) => (
          <div
            key={`pending-${sale.id}`}
            className={`luna-border relative mb-2 overflow-hidden rounded-2xl bg-card px-3 py-3 transition ${
              accepting === sale.id ? 'ring-1 ring-primary/40' : accepting ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <User className="size-4 text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 leading-snug">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[0.8rem] font-semibold text-foreground">
                    {sale.buyer_name}
                  </p>
                  <span className="shrink-0 text-[0.8rem] font-semibold text-primary">· Novo!</span>
                </div>
                <p className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                  <span className="truncate">Comprou “{sale.pack?.title || 'seu pack'}”</span>
                </p>
              </div>
              <div className="shrink-0 text-right leading-snug">
                <p className="text-sm font-bold text-positive">{brl(Number(sale.amount))}</p>
                <p className="text-[0.6rem] text-muted-foreground">{relativeTime(sale.created_at)}</p>
              </div>
            </div>

            {accepting === sale.id && (
              <span className="animate-money-float pointer-events-none absolute right-4 top-1 text-base font-bold text-positive">
                +{brl(Number(sale.net_amount))}
              </span>
            )}

            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                disabled={accepting !== null}
                onClick={() => onReject(sale.id)}
                className="flex flex-[0.7] items-center justify-center gap-1 rounded-lg border border-border bg-secondary py-2.5 text-[0.8rem] font-semibold text-muted-foreground transition active:scale-[0.98] disabled:opacity-60"
              >
                Recusar
              </button>
              <button
                type="button"
                disabled={accepting !== null}
                onClick={() => handleAccept(sale.id)}
                className="flex flex-[2] items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-[0.8rem] font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-90"
              >
                {accepting === sale.id ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Aceitando...
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" aria-hidden="true" />
                    Aceitar venda
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {/* Histórico de aceitas / vazio */}
        {pendingSales.length === 0 && completedSales.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/60 px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">
              {packs.length === 0
                ? 'Crie seu primeiro pack para começar a receber pedidos'
                : 'Seus pedidos aparecem aqui.'}
            </p>
          </div>
        ) : (
          completedSales.slice(0, 10).map((s) => (
            <div
              key={`done-${s.id}`}
              className="luna-border mb-2 flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                <User className="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="flex items-center gap-1 text-[0.8rem] font-semibold text-foreground">
                  {s.buyer_name}
                  <BadgeCheck className="size-3.5 text-positive" aria-hidden="true" />
                </p>
                <p className="truncate text-[0.7rem] text-muted-foreground">comprou {s.pack?.title || 'seu pack'}</p>
              </div>
              <span className="flex items-center gap-1 text-[0.8rem] font-bold text-positive">
                <Check className="size-3.5" aria-hidden="true" />
                {brl(Number(s.net_amount))}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ─────────────────────���─────��──────────��─────────────���───���────────���───────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-1.5 py-3.5 text-center">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-5 text-primary" aria-hidden="true" />
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="w-full truncate px-0.5 text-base font-bold leading-tight text-foreground">{value}</span>
    </div>
  )
}

// ��────────────────────────────────────────────────────────────────────────────
// Tela Packs
// ─────────────��────────────────────────────────────────────���──────────────────

function PacksScreen({
  balance,
  packs,
  onCreate,
  onSelect,
}: {
  balance: number
  packs: Pack[]
  onCreate: () => void
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/images/luna-prive-logo.png" alt="Luna Prive" className="h-9 w-auto" />
        </div>
        <div className="luna-border relative flex items-center gap-2.5 rounded-2xl bg-card px-4 py-2.5">
          <Wallet className="size-6 text-primary" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-xl font-bold text-foreground">{brl(balance)}</p>
          </div>
        </div>
      </header>

      {/* Titulo */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="leading-tight">
          <h1 className="text-xl font-bold text-foreground">Meus Packs</h1>
          <p className="text-xs text-muted-foreground">Sua vitrine de conteudo</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="luna-gradient flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
        >
          <Plus className="size-4" aria-hidden="true" />
          Criar Pack
        </button>
      </div>

      {/* Vitrine */}
      <div className="mt-5 flex flex-col gap-3">
        {packs.length === 0 ? (
          <div className="luna-border flex flex-col items-center justify-center rounded-2xl bg-card py-12 text-center">
            <Package className="size-12 text-muted-foreground/30" />
            <h3 className="mt-3 font-semibold text-foreground">Nenhum pack ainda</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie seu primeiro pack e comece a vender!
            </p>
            <button
              type="button"
              onClick={onCreate}
              className="luna-gradient mt-4 flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
            >
              <Plus className="size-4" aria-hidden="true" />
              Criar meu primeiro pack
            </button>
          </div>
        ) : (
          packs.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => onSelect(pack.id)}
              className="luna-border flex overflow-hidden rounded-2xl bg-card text-left transition active:scale-[0.99]"
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden bg-secondary">
                {pack.cover_image_url ? (
                  <img
                    src={pack.cover_image_url || "/placeholder.svg"}
                    alt={pack.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="size-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center px-3 py-2">
                <p className="truncate text-sm font-semibold text-foreground">{pack.title}</p>
                <p className="text-base font-bold text-positive">{brl(pack.price)}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                  <Eye className="size-3" aria-hidden="true" />
                  {pack.views_count} views · {pack.sales_count} vendas
                </p>
              </div>
              <div className="flex items-center pr-3">
                <ChevronRight className="size-5 text-muted-foreground/50" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────����──────────���─────────────────
// Tela Detalhe do Pack (visualizar, métricas e editar)
// ──────────────────────────────────────────────────────���──────────────────────

function PackDetailScreen({
  pack,
  sales,
  onClose,
  onUpdated,
}: {
  pack: Pack | null
  sales: Sale[]
  onClose: () => void
  onUpdated: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(pack?.title ?? '')
  const [price, setPrice] = useState(pack ? String(pack.price) : '')
  const [desc, setDesc] = useState(pack?.description ?? '')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sincroniza o formulário quando o pack muda
  useEffect(() => {
    if (!pack) return
    setTitle(pack.title)
    setPrice(String(pack.price))
    setDesc(pack.description ?? '')
    const imgs = (pack.images ?? [])
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((i) => i.image_url)
    setPhotos(imgs.length > 0 ? imgs : pack.cover_image_url ? [pack.cover_image_url] : [])
    setEditing(false)
    setConfirmDelete(false)
    setError(null)
  }, [pack])

  if (!pack) return null

  // Métricas
  const views = pack.views_count || 0
  const vendas = pack.sales_count || 0
  const likes = pack.likes_count || 0
  const conversao = views > 0 ? (vendas / views) * 100 : 0

  // Vendas reais registradas deste pack (podem ser menos que o contador agregado)
  const packSales = sales.filter((s) => s.pack_id === pack.id && s.status === 'completed')
  const realRevenue = packSales.reduce((sum, s) => sum + Number(s.net_amount), 0)
  // Valor liquido por venda: media das vendas reais ou, na ausencia delas, o preco do pack
  const netPerSale = packSales.length > 0 ? realRevenue / packSales.length : Number(pack.price) || 0
  // Faturamento sempre corresponde ao numero de vendas exibido
  const faturamento = Math.max(realRevenue, vendas * netPerSale)

  async function handleAddPhoto(files: File[]) {
    if (uploading || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Sessão expirada. Faça login novamente.')
        return
      }
      let hadError = false
      for (const file of files) {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${user.id}/packs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('media')
          .upload(path, file, { upsert: true, contentType: file.type })
        if (upErr) {
          hadError = true
          continue
        }
        const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
        setPhotos((prev) => [...prev, pub.publicUrl])
      }
      if (hadError) {
        setError('Alguns arquivos não puderam ser enviados.')
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (saving || !pack) return
    if (!title.trim()) {
      setError('Dê um nome ao seu pack.')
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const priceNum = parseFloat(price.replace(',', '.')) || 0

    const { error: upErr } = await supabase
      .from('packs')
      .update({
        title: title.trim(),
        description: desc.trim() || null,
        price: priceNum,
        cover_image_url: photos[0] || null,
      })
      .eq('id', pack.id)

    if (upErr) {
      setError('Não foi possível salvar. Tente novamente.')
      setSaving(false)
      return
    }

    // Recria as imagens do pack para refletir adições/remoç��es/ordem
    await supabase.from('pack_images').delete().eq('pack_id', pack.id)
    if (photos.length > 0) {
      await supabase.from('pack_images').insert(
        photos.map((url, i) => ({
          pack_id: pack.id,
          image_url: url,
          is_preview: i === 0,
          order_index: i,
        })),
      )
    }

    setSaving(false)
    setEditing(false)
    onUpdated()
  }

  async function handleDelete() {
    if (deleting || !pack) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('pack_images').delete().eq('pack_id', pack.id)
    await supabase.from('packs').delete().eq('id', pack.id)
    setDeleting(false)
    onUpdated()
    onClose()
  }

  return (
    <div className="absolute inset-0 z-[55] flex flex-col bg-background">
      {/* Cabeçalho */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 pb-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary active:scale-95"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <h2 className="flex-1 truncate text-center text-base font-bold text-foreground">
          {editing ? 'Editar pack' : pack.title}
        </h2>
        {editing ? (
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setError(null)
            }}
            className="text-sm font-semibold text-muted-foreground"
          >
            Cancelar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-secondary active:scale-95"
            aria-label="Editar"
          >
            <Edit3 className="size-5" aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        {/* Galeria de imagens */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {photos.map((src, i) => (
              <div
                key={src}
                className={`relative overflow-hidden rounded-2xl border border-border ${
                  i === 0 ? 'col-span-2 aspect-video' : 'aspect-square'
                }`}
              >
                <img src={src || '/placeholder.svg'} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[0.65rem] font-semibold text-foreground backdrop-blur-sm">
                    Capa
                  </span>
                )}
                {editing && (
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((u) => u !== src))}
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow"
                    aria-label="Remover foto"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="luna-border flex aspect-video items-center justify-center rounded-2xl bg-card">
            <Package className="size-10 text-muted-foreground/30" aria-hidden="true" />
          </div>
        )}

        {editing && (
          <label
            className={`mt-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 py-3 text-sm font-semibold text-primary transition active:scale-[0.99] ${
              uploading ? 'pointer-events-none opacity-70' : ''
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Enviando...
              </>
            ) : (
              <>
                <ImagePlus className="size-4" aria-hidden="true" />
                Adicionar fotos
              </>
            )}
            <input
              type="file"
              accept="image/*,video/*,image/heic,image/heif,.heic,.heif,.mov,.mkv,.avi,.webm,.3gp"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                if (files.length) handleAddPhoto(files)
                e.target.value = ''
              }}
            />
          </label>
        )}

        {editing ? (
          /* Formulário de edição */
          <div className="mt-5">
            <label htmlFor="edit-name" className="mb-1.5 block text-sm font-semibold text-foreground">
              Nome do pack
            </label>
            <input
              id="edit-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-5 w-full rounded-xl border border-border bg-secondary px-3.5 py-3.5 text-base text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />

            <label htmlFor="edit-price" className="mb-1.5 block text-sm font-semibold text-foreground">
              Preço (R$)
            </label>
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-3.5 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
              <span className="text-base font-medium text-muted-foreground">R$</span>
              <input
                id="edit-price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                className="w-full bg-transparent text-base text-foreground outline-none"
              />
            </div>

            <label htmlFor="edit-desc" className="mb-1.5 block text-sm font-semibold text-foreground">
              Descrição <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              id="edit-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-secondary px-3.5 py-3.5 text-base text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />

            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3 text-sm font-semibold text-destructive transition active:scale-[0.99]"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Excluir pack
            </button>
          </div>
        ) : (
          /* Visualização: preço, descrição e métricas */
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-2xl font-bold text-positive">{brl(pack.price)}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  pack.is_published ? 'bg-positive/15 text-positive' : 'bg-secondary text-muted-foreground'
                }`}
              >
                {pack.is_published ? 'Publicado' : 'Rascunho'}
              </span>
            </div>
            {pack.description && (
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{pack.description}</p>
            )}

            <h3 className="mb-2.5 mt-6 text-sm font-semibold text-foreground">Métricas</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <PackMetric icon={Eye} label="Visualizações" value={String(views)} />
              <PackMetric icon={ShoppingBag} label="Vendas" value={String(vendas)} />
              <PackMetric icon={TrendingUp} label="Conversão" value={`${conversao.toFixed(1)}%`} />
              <PackMetric icon={Heart} label="Curtidas" value={String(likes)} />
            </div>

            <div className="luna-border mt-2.5 flex items-center justify-between rounded-2xl bg-card px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-positive/15">
                  <Wallet className="size-4.5 text-positive" aria-hidden="true" />
                </span>
                <span className="text-sm text-muted-foreground">Faturamento</span>
              </div>
              <span className="text-lg font-bold text-positive">{brl(faturamento)}</span>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-center text-xs font-medium text-destructive">{error}</p>}
      </div>

      {/* Rodapé fixo no modo edição */}
      {editing && (
        <div className="shrink-0 border-t border-border/60 bg-card px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="luna-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="size-5" aria-hidden="true" />
                Salvar alterações
              </>
            )}
          </button>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !deleting && setConfirmDelete(false)}
            aria-hidden="true"
          />
          <div className="animate-pop relative w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-destructive/15">
                <Trash2 className="size-6 text-destructive" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-bold text-foreground">Excluir este pack?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Esta ação não pode ser desfeita. As fotos e métricas serão removidas.
              </p>
            </div>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-border bg-secondary py-3 text-sm font-semibold text-foreground transition active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-70"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PackMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home
  label: string
  value: string
}) {
  return (
    <div className="luna-border flex flex-col gap-1.5 rounded-2xl bg-card px-3.5 py-3">
      <span className="flex size-8 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  )
}

// ──────────────────────────────────────────────────────��──────────────────────
// Tela Carteira
// ─────────────────────��──────────────────────────────���────────────────────────

function WalletScreen({
  balance,
  pendingBalance,
  withdrawals,
  transactions,
  profile,
  userEmail,
  userName,
  onWithdrawalsChange,
  onProfileUpdated,
}: {
  balance: number
  pendingBalance: number
  withdrawals: Withdrawal[]
  transactions: Transaction[]
  profile: Profile | null | undefined
  userEmail: string
  userName: string
  onWithdrawalsChange: () => void
  onProfileUpdated: () => void
}) {
  // Etapas do fluxo de saque:
  // 'form' -> 'processing' (5s) -> 'new_account' (conta nova) -> 'verify_info' -> 'verify_processing' -> PIX
  // ou, se ja verificada: 'form' -> 'processing' -> 'requested' (saque solicitado / em analise)
  const [withdrawStep, setWithdrawStep] = useState<
    'form' | 'processing' | 'new_account' | 'verify_info' | 'verify_processing' | 'requested'
  >('form')
  const [showVerifyPix, setShowVerifyPix] = useState(false)
  const isVerified = !!profile?.withdrawal_verified
  // Valor da verificação de saque vem das configurações (painel). Fallback: R$ 49,90.
  const [VERIFICATION_PRICE, setVerificationPrice] = useState(49.9)
  useEffect(() => {
    let active = true
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((d) => {
        if (active && typeof d?.withdrawalVerificationAmountCents === 'number') {
          setVerificationPrice(d.withdrawalVerificationAmountCents / 100)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const [activeTab, setActiveTab] = useState<'resumo' | 'extrato' | 'saques'>('resumo')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [barsReady, setBarsReady] = useState(false)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const pixKey = profile?.pix_key || 'Nao cadastrada'

  // Modal de edicao da chave PIX
  const [showPixModal, setShowPixModal] = useState(false)
  const [pixForm, setPixForm] = useState({ type: profile?.pix_key_type || 'CPF', key: '' })
  const [savingPix, setSavingPix] = useState(false)
  const [pixError, setPixError] = useState<string | null>(null)

  function openPixModal() {
    setPixForm({ type: profile?.pix_key_type || 'CPF', key: profile?.pix_key || '' })
    setPixError(null)
    setShowPixModal(true)
  }

  async function savePixKey() {
    const trimmed = pixForm.key.trim()
    if (!trimmed) {
      setPixError('Informe sua chave PIX.')
      return
    }
    if (pixForm.type === 'Email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setPixError('E-mail inválido.')
      return
    }
    setSavingPix(true)
    setPixError(null)
    const res = await updateProfile({ pix_key: trimmed, pix_key_type: pixForm.type })
    setSavingPix(false)
    if (res?.error) {
      setPixError('Não foi possível salvar. Tente novamente.')
      return
    }
    setShowPixModal(false)
    onProfileUpdated()
  }

  const isEarning = (t: Transaction) => t.type === 'sale' || t.type === 'gift_received' || t.type === 'bonus'

  // Dispara a animacao das barras logo apos montar
  useEffect(() => {
    const id = requestAnimationFrame(() => setBarsReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Liquidacao automatica: ao montar e a cada 60s, marca como falhos os saques
  // cuja janela de analise de 24h ja expirou (recusa do banco).
  useEffect(() => {
    let mounted = true
    const run = async () => {
      const res = await settleExpiredWithdrawals()
      if (mounted && res.settled > 0) onWithdrawalsChange()
    }
    run()
    const interval = setInterval(run, 60_000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [onWithdrawalsChange])

  // Abre o modal de saque resetando o fluxo
  function openWithdraw() {
    setWithdrawStep('form')
    setWithdrawAmount('')
    setWithdrawError(null)
    setShowWithdrawModal(true)
  }

  function closeWithdraw() {
    setShowWithdrawModal(false)
    setWithdrawStep('form')
  }

  // Confirma o saque: roda 5s de animacao e decide o proximo passo
  function handleConfirmWithdraw() {
    const parsed = Number(withdrawAmount.replace(/\./g, '').replace(',', '.'))
    if (!parsed || parsed < 50) {
      setWithdrawError('O valor mínimo para saque é R$ 50,00.')
      return
    }
    if (parsed > balance) {
      setWithdrawError('Saldo insuficiente para este saque.')
      return
    }
    setWithdrawError(null)
    setWithdrawStep('processing')

    // Animacao de 5 segundos analisando a solicitacao
    setTimeout(async () => {
      if (isVerified) {
        // Conta verificada: registra o saque (entra em analise de 24h)
        const res = await requestWithdrawal(parsed)
        if (res?.error) {
          setWithdrawError(
            res.error === 'not_verified'
              ? 'Sua conta ainda não foi verificada.'
              : typeof res.error === 'string'
                ? res.error
                : 'Não foi possível solicitar o saque.',
          )
          setWithdrawStep('form')
          return
        }
        onWithdrawalsChange()
        setWithdrawStep('requested')
      } else {
        // Conta nova: exige verificacao
        setWithdrawStep('new_account')
      }
    }, 5000)
  }

  // Inicia a verificacao: animacao curta e abre o PIX de R$ 49
  function handleStartVerification() {
    setWithdrawStep('verify_processing')
    setTimeout(() => {
      setShowVerifyPix(true)
    }, 1600)
  }

  // Grafico: 6 meses comecando no mes atual (2026) e seguindo para os proximos
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      value: 0,
    }
  })
  transactions.forEach((t) => {
    if (!isEarning(t)) return
    const d = new Date(t.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = monthlyData.find((m) => m.key === key)
    if (bucket) bucket.value += Number(t.amount)
  })
  const chartYear = new Date(now.getFullYear(), now.getMonth(), 1).getFullYear()
  const maxValue = Math.max(...monthlyData.map((d) => d.value), 1)

  // Ganhos de hoje
  const todayEarnings = transactions
    .filter((t) => {
      const tDate = new Date(t.created_at)
      return isEarning(t) && tDate.toDateString() === now.toDateString()
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Ganhos do mes atual
  const monthEarnings = transactions
    .filter((t) => {
      const d = new Date(t.created_at)
      return isEarning(t) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Ganhos do mes anterior, para variacao percentual real
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEarnings = transactions
    .filter((t) => {
      const d = new Date(t.created_at)
      return isEarning(t) && d.getMonth() === prevMonth.getMonth() && d.getFullYear() === prevMonth.getFullYear()
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const monthDeltaPct =
    prevMonthEarnings > 0 ? Math.round(((monthEarnings - prevMonthEarnings) / prevMonthEarnings) * 100) : null

  // Total sacado (somente saques concluidos)
  const totalWithdrawn = withdrawals
    .filter((w) => ['completed', 'processing'].includes(String(w.status).toLowerCase()))
    .reduce((sum, w) => sum + Number(w.amount), 0)

  // Ganhos animados (contando de 0 ao entrar na tela)
  const animatedMonth = useCountUpOnMount(monthEarnings)
  const animatedWithdrawn = useCountUpOnMount(totalWithdrawn)
  const animatedToday = useCountUpOnMount(todayEarnings)

  // Vendas concluidas para "Ultimas vendas"
  const saleTransactions = transactions.filter((t) => t.type === 'sale')

  const formatDateTime = (iso: string) => {
    const d = new Date(iso)
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `ha ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `ha ${diffH}h`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const txLabel = (t: Transaction) => {
    if (t.description) return t.description
    if (t.type === 'sale') return 'Venda de pack'
    if (t.type === 'gift_received') return 'Presente recebido'
    if (t.type === 'withdrawal') return 'Saque via PIX'
    if (t.type === 'bonus') return 'Bonus'
    return 'Transacao'
  }

  const statusLabel: Record<string, string> = {
    completed: 'Concluido',
    processing: 'Em análise',
    pending: 'Pendente',
    failed: 'Recusado',
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header fixo */}
      <header className="shrink-0 px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <img src="/images/luna-prive-logo.png" alt="Luna Prive" className="h-9 w-auto" />
        </div>
      </header>

      {/* Card de saldo principal */}
      <div className="shrink-0 px-4 pt-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-5 ring-1 ring-primary/20">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-primary/5 blur-2xl" />

          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground">Saldo disponivel</p>
            <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">{brl(balance)}</p>

            {pendingBalance > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1">
                <Loader2 className="size-3.5 animate-spin text-amber-500" aria-hidden="true" />
                <span className="text-xs font-semibold text-amber-500">
                  {brl(pendingBalance)} pendente · aceite os pedidos
                </span>
              </div>
            )}

            <div className="mt-4 flex items-center gap-4">
              {todayEarnings > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-positive/15 px-3 py-1">
                  <TrendingUp className="size-3.5 text-positive" aria-hidden="true" />
                  <span className="text-xs font-semibold text-positive">+{brl(animatedToday)} hoje</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="size-2 animate-pulse rounded-full bg-positive" />
                <span className="text-xs text-muted-foreground">Atualizado agora</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botao de saque principal */}
      <div className="shrink-0 px-4 pt-4">
        <button
          type="button"
          onClick={openWithdraw}
          className="luna-gradient flex w-full items-center justify-center gap-2.5 rounded-2xl py-5 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/30 transition hover:brightness-110 active:scale-[0.98]"
        >
          <ArrowUpRight className="size-6" aria-hidden="true" />
          Sacar saldo
        </button>
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-border bg-card/60 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Saque mínimo de <span className="font-semibold text-foreground">R$ 50,00</span>. É descontada uma
            taxa de <span className="font-semibold text-foreground">R$ 1,99</span> por saque realizado.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 shrink-0 px-4">
        <div className="flex rounded-2xl bg-card/60 p-1 ring-1 ring-border">
          {(['resumo', 'extrato', 'saques'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'resumo' ? 'Resumo' : tab === 'extrato' ? 'Extrato' : 'Saques'}
            </button>
          ))}
        </div>
      </div>

      {/* Conteudo scrollavel */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-5">
        {activeTab === 'resumo' && (
          <>
            {/* Stats rapidos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-positive/15">
                    <TrendingUp className="size-4 text-positive" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Ganhos do mes</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{brl(animatedMonth)}</p>
                {monthDeltaPct !== null ? (
                  <p className={`mt-1 text-xs ${monthDeltaPct >= 0 ? 'text-positive' : 'text-destructive'}`}>
                    {monthDeltaPct >= 0 ? '+' : ''}
                    {monthDeltaPct}% vs mes anterior
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Neste mes</p>
                )}
              </div>
              <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/15">
                    <Wallet className="size-4 text-primary" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Total sacado</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{brl(animatedWithdrawn)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Desde o inicio</p>
              </div>
            </div>

            {/* Grafico de barras */}
            <div className="mt-5 rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Ganhos mensais</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {chartYear}
                </span>
              </div>
              <div className="flex h-36 items-end justify-between gap-2">
                {monthlyData.map((d, i) => {
                  const pct = barsReady ? Math.max((d.value / maxValue) * 100, d.value > 0 ? 6 : 2) : 0
                  return (
                    <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                      {d.value > 0 && (
                        <span
                          className="text-[0.6rem] font-semibold text-foreground transition-opacity duration-500"
                          style={{ opacity: barsReady ? 1 : 0 }}
                        >
                          {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : Math.round(d.value)}
                        </span>
                      )}
                      <div
                        className={`w-full rounded-lg ${
                          i === 0 ? 'bg-primary shadow-md shadow-primary/30' : 'bg-primary/30'
                        }`}
                        style={{
                          height: `${pct}%`,
                          minHeight: '6px',
                          transition: 'height 700ms cubic-bezier(0.22, 1, 0.36, 1)',
                          transitionDelay: `${i * 80}ms`,
                        }}
                      />
                      <span className={`text-[0.6rem] capitalize ${i === 0 ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ultimas vendas */}
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Ultimas vendas</h3>
              {saleTransactions.length === 0 ? (
                <div className="rounded-2xl bg-card/60 p-6 text-center ring-1 ring-border">
                  <p className="text-sm text-muted-foreground">Nenhuma venda ainda. Compartilhe seus packs!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {saleTransactions.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 rounded-2xl bg-card/80 p-3.5 ring-1 ring-border backdrop-blur-sm"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-positive/15">
                        <ShoppingBag className="size-5 text-positive" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{txLabel(t)}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-positive">+{brl(Number(t.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'extrato' && (
          <div className="flex flex-col gap-2">
            {transactions.length === 0 ? (
              <div className="rounded-2xl bg-card/60 p-6 text-center ring-1 ring-border">
                <p className="text-sm text-muted-foreground">Sem movimentacoes no extrato.</p>
              </div>
            ) : (
              transactions.map((t) => {
                const positive = isEarning(t)
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl bg-card/80 p-3.5 ring-1 ring-border backdrop-blur-sm"
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                        t.type === 'sale'
                          ? 'bg-positive/15'
                          : t.type === 'gift_received'
                            ? 'bg-amber-500/15'
                            : t.type === 'bonus'
                              ? 'bg-primary/15'
                              : 'bg-muted'
                      }`}
                    >
                      {t.type === 'sale' && <ShoppingBag className="size-5 text-positive" aria-hidden="true" />}
                      {t.type === 'gift_received' && <Gift className="size-5 text-amber-500" aria-hidden="true" />}
                      {t.type === 'bonus' && <Sparkles className="size-5 text-primary" aria-hidden="true" />}
                      {t.type === 'withdrawal' && <ArrowDownLeft className="size-5 text-muted-foreground" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{txLabel(t)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${positive ? 'text-positive' : 'text-foreground'}`}>
                      {positive ? '+' : '-'}
                      {brl(Math.abs(Number(t.amount)))}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'saques' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Info className="size-5 text-primary" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Saques via PIX</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saques sao processados em ate 24h uteis. O valor minimo para saque e de R$ 50,00.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
              <p className="text-xs font-medium text-muted-foreground">Chave PIX cadastrada</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{pixKey}</p>
                <button
                  type="button"
                  onClick={openPixModal}
                  className="text-xs font-semibold text-primary"
                >
                  {profile?.pix_key ? 'Alterar' : 'Cadastrar'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Historico de saques</h3>
              {withdrawals.length === 0 ? (
                <div className="rounded-2xl bg-card/60 p-6 text-center ring-1 ring-border">
                  <p className="text-sm text-muted-foreground">Voce ainda nao fez nenhum saque.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {withdrawals.map((w) => {
                    const st = String(w.status).toLowerCase()
                    const isFailed = st === 'failed'
                    const isProcessing = st === 'processing'
                    return (
                      <div
                        key={w.id}
                        className={`rounded-2xl bg-card/80 p-3.5 ring-1 backdrop-blur-sm ${
                          isFailed ? 'ring-destructive/30' : 'ring-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                              isFailed
                                ? 'bg-destructive/15'
                                : st === 'completed'
                                  ? 'bg-positive/15'
                                  : 'bg-amber-500/15'
                            }`}
                          >
                            {isFailed ? (
                              <XCircle className="size-5 text-destructive" aria-hidden="true" />
                            ) : st === 'completed' ? (
                              <CheckCircle2 className="size-5 text-positive" aria-hidden="true" />
                            ) : (
                              <Clock className="size-5 text-amber-500" aria-hidden="true" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">Saque via PIX</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(w.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">{brl(Number(w.amount))}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[0.6rem] font-semibold ${
                                st === 'completed'
                                  ? 'bg-positive/15 text-positive'
                                  : isFailed
                                    ? 'bg-destructive/15 text-destructive'
                                    : 'bg-amber-500/15 text-amber-500'
                              }`}
                            >
                              {statusLabel[st] ?? 'Pendente'}
                            </span>
                          </div>
                        </div>

                        {isProcessing && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5">
                            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-amber-500" aria-hidden="true" />
                            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                              Nossa equipe interna está analisando sua solicitação. A análise pode levar até
                              24 horas.
                            </p>
                          </div>
                        )}

                        {isFailed && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5">
                            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                            <p className="text-pretty text-xs leading-relaxed text-destructive">
                              {w.failure_reason || 'Seu banco recusou a transação. Tente novamente, por favor.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Saque */}
      {showPixModal && (
        <div className="absolute inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full animate-in slide-in-from-bottom rounded-t-[2rem] bg-card pb-8">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />

            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-lg font-bold text-foreground">
                {profile?.pix_key ? 'Alterar chave PIX' : 'Cadastrar chave PIX'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPixModal(false)}
                className="flex size-9 items-center justify-center rounded-full bg-muted/50 transition hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="size-5 text-muted-foreground" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5">
              <p className="mb-4 text-sm text-muted-foreground">
                Cadastre a chave PIX que receberá os seus saques. Confira os dados com atenção.
              </p>

              {/* Tipo de chave */}
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Tipo de chave
              </label>
              <div className="mb-4 flex flex-wrap gap-2">
                {['CPF', 'CNPJ', 'Telefone', 'Email', 'Chave Aleatoria'].map((opt) => {
                  const active = pixForm.type === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPixForm((f) => ({ ...f, type: opt }))}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {opt === 'Email' ? 'E-mail' : opt === 'Chave Aleatoria' ? 'Aleatória' : opt}
                    </button>
                  )
                })}
              </div>

              {/* Campo da chave */}
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Chave PIX
              </label>
              <input
                type={pixForm.type === 'Email' ? 'email' : 'text'}
                inputMode={
                  pixForm.type === 'CPF' || pixForm.type === 'CNPJ' || pixForm.type === 'Telefone'
                    ? 'numeric'
                    : 'text'
                }
                value={pixForm.key}
                onChange={(e) => setPixForm((f) => ({ ...f, key: e.target.value }))}
                placeholder={
                  pixForm.type === 'CPF'
                    ? '000.000.000-00'
                    : pixForm.type === 'CNPJ'
                      ? '00.000.000/0000-00'
                      : pixForm.type === 'Telefone'
                        ? '(00) 00000-0000'
                        : pixForm.type === 'Email'
                          ? 'seu@email.com'
                          : 'sua chave aleatória'
                }
                className="w-full rounded-2xl bg-muted/50 px-4 py-3.5 text-sm font-medium text-foreground outline-none ring-1 ring-border transition focus:ring-2 focus:ring-primary"
              />

              {pixError && (
                <p className="mt-2 text-xs font-medium text-destructive">{pixError}</p>
              )}

              <button
                type="button"
                onClick={savePixKey}
                disabled={savingPix}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {savingPix ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Salvando...
                  </>
                ) : (
                  'Salvar chave PIX'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full animate-in slide-in-from-bottom rounded-t-[2rem] bg-card pb-8">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />

            {/* Header dinamico */}
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-lg font-bold text-foreground">
                {withdrawStep === 'form' && 'Solicitar saque'}
                {withdrawStep === 'processing' && 'Processando saque'}
                {withdrawStep === 'new_account' && 'Verificação necessária'}
                {withdrawStep === 'verify_info' && 'Verificação completa'}
                {withdrawStep === 'verify_processing' && 'Gerando verificação'}
                {withdrawStep === 'requested' && 'Saque solicitado'}
              </h3>
              {(withdrawStep === 'form' ||
                withdrawStep === 'new_account' ||
                withdrawStep === 'verify_info' ||
                withdrawStep === 'requested') && (
                <button
                  type="button"
                  onClick={closeWithdraw}
                  className="flex size-9 items-center justify-center rounded-full bg-muted/50 transition hover:bg-muted"
                  aria-label="Fechar"
                >
                  <X className="size-5 text-muted-foreground" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="px-5">
              {/* Etapa 1: Formulario de saque */}
              {withdrawStep === 'form' && (
                <>
                  <div className="rounded-2xl bg-muted/50 p-4 text-center">
                    <p className="text-xs text-muted-foreground">Saldo disponivel para saque</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{brl(balance)}</p>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-foreground">Valor do saque</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">
                        R$
                      </span>
                      <input
                        type="text"
                        value={withdrawAmount}
                        onChange={(e) => {
                          setWithdrawAmount(e.target.value)
                          setWithdrawError(null)
                        }}
                        placeholder="0,00"
                        inputMode="decimal"
                        className="w-full rounded-2xl border-0 bg-muted/50 py-4 pl-12 pr-4 text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {[100, 500, 1000, balance].map((val, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setWithdrawAmount(val.toFixed(2).replace('.', ','))
                          setWithdrawError(null)
                        }}
                        className="flex-1 rounded-xl bg-muted/50 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                      >
                        {i === 3 ? 'Tudo' : brl(val)}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={openPixModal}
                    className="mt-5 flex w-full items-center justify-between gap-3 rounded-2xl bg-muted/30 p-4 text-left transition hover:bg-muted/50 active:scale-[0.99]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Chave PIX de destino</p>
                      <p
                        className={cn(
                          'mt-1 truncate text-sm font-semibold',
                          profile?.pix_key ? 'text-foreground' : 'text-primary',
                        )}
                      >
                        {profile?.pix_key ? pixKey : 'Cadastrar chave PIX'}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-primary">
                      {profile?.pix_key ? 'Alterar' : 'Adicionar'}
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </span>
                  </button>

                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3">
                    <span className="text-xs text-muted-foreground">Taxa por saque</span>
                    <span className="text-sm font-semibold text-foreground">- R$ 1,99</span>
                  </div>

                  {(() => {
                    const parsed = Number(withdrawAmount.replace(/\./g, '').replace(',', '.'))
                    if (!parsed || parsed < 50) return null
                    return (
                      <div className="mt-2 flex items-center justify-between rounded-2xl border border-positive/30 bg-positive/5 px-4 py-3">
                        <span className="text-xs font-medium text-foreground">Você recebe</span>
                        <span className="text-base font-bold text-positive">{brl(parsed - 1.99)}</span>
                      </div>
                    )
                  })()}

                  {withdrawError && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-destructive">
                      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                      {withdrawError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmWithdraw}
                    className="luna-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
                  >
                    <ArrowUpRight className="size-5" aria-hidden="true" />
                    Confirmar saque
                  </button>

                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Transferência via PIX imediata.
                  </p>
                </>
              )}

              {/* Etapa 2: Animacao de 5 segundos */}
              {withdrawStep === 'processing' && (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="relative flex size-20 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <ArrowUpRight className="size-8 text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-6 text-base font-bold text-foreground">Analisando sua solicitação...</p>
                  <p className="mt-1 text-sm text-muted-foreground">Aguarde enquanto validamos seu saque</p>
                </div>
              )}

              {/* Etapa 3: Conta nova — precisa verificar */}
              {withdrawStep === 'new_account' && (
                <div className="pb-2">
                  <div className="flex flex-col items-center text-center">
                    <span className="flex size-16 items-center justify-center rounded-full bg-amber-500/15">
                      <Shield className="size-8 text-amber-500" aria-hidden="true" />
                    </span>
                    <h4 className="mt-4 text-balance text-lg font-bold text-foreground">
                      Sua conta ainda é muito nova para realizar saques!
                    </h4>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                      Faça a verificação completa em sua conta para sacar imediatamente, ou aguarde 30 dias
                      para realizar seu primeiro saque. Após isso, todos os seus saques acontecerão de forma
                      imediata.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setWithdrawStep('verify_info')}
                    className="luna-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
                  >
                    <ShieldCheck className="size-5" aria-hidden="true" />
                    Fazer verificação completa
                  </button>
                  <button
                    type="button"
                    onClick={closeWithdraw}
                    className="mt-2 w-full rounded-2xl py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/50"
                  >
                    Aguardar 30 dias
                  </button>
                </div>
              )}

              {/* Etapa 4: Detalhes da verificacao (R$ 49) */}
              {withdrawStep === 'verify_info' && (
                <div className="pb-2">
                  <div className="flex flex-col items-center text-center">
                    <span className="flex size-16 items-center justify-center rounded-full bg-primary/15">
                      <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
                    </span>
                    <h4 className="mt-4 text-lg font-bold text-foreground">Verificação completa</h4>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                      A verificação completa habilita a total segurança da sua conta e libera seus saques
                      de forma imediata e definitiva.
                    </p>
                  </div>

                  <ul className="mt-5 flex flex-col gap-2.5">
                    {[
                      'Saques imediatos liberados na hora',
                      'Conta protegida com verificação de identidade',
                      'Selo de conta verificada no seu perfil',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden="true" />
                        <span className="text-sm text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted/50 p-4">
                    <span className="text-sm font-medium text-foreground">Valor da verificação</span>
                    <span className="text-xl font-bold text-primary">{brl(VERIFICATION_PRICE)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartVerification}
                    className="luna-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
                  >
                    <Unlock className="size-5" aria-hidden="true" />
                    Pagar e liberar agora!
                  </button>
                </div>
              )}

              {/* Etapa 5: Animacao de geracao da verificacao */}
              {withdrawStep === 'verify_processing' && (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="relative flex size-20 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-6 text-base font-bold text-foreground">Gerando seu PIX...</p>
                  <p className="mt-1 text-sm text-muted-foreground">Preparando a verificação da sua conta</p>
                </div>
              )}

              {/* Etapa 6: Saque solicitado (conta ja verificada) */}
              {withdrawStep === 'requested' && (
                <div className="pb-2">
                  <div className="flex flex-col items-center text-center">
                    <span className="flex size-16 items-center justify-center rounded-full bg-positive/15">
                      <CheckCircle2 className="size-8 text-positive" aria-hidden="true" />
                    </span>
                    <h4 className="mt-4 text-lg font-bold text-foreground">Saque solicitado!</h4>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                      Nossa equipe interna está analisando sua solicitação. A análise pode levar até 24
                      horas. Você poderá acompanhar o status na aba <span className="font-semibold text-foreground">Saques</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeWithdraw()
                      setActiveTab('saques')
                    }}
                    className="luna-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
                  >
                    Acompanhar saque
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIX de verificacao da conta */}
      {showVerifyPix && (
        <PixModal
          isOpen={showVerifyPix}
          onClose={() => {
            setShowVerifyPix(false)
            setWithdrawStep('verify_info')
          }}
          email={userEmail}
          amount={VERIFICATION_PRICE}
          userName={userName}
          type="verification"
          title="Verificação de conta"
          subtitle="Libere seus saques imediatos"
          onPaymentConfirmed={() => {
            setShowVerifyPix(false)
            closeWithdraw()
            onWithdrawalsChange()
          }}
        />
      )}
    </div>
  )
}

// ───────────────────────────────────────────────��──────���──��───────────────────
// Tela Perfil
// ─────────────────────────────────────────────────────────────────────��────���──

function ProfileScreen({ 
  profile: userProfile, 
  highlights: userHighlights,
  notifications: realNotifications,
  onLogout,
  onProfileUpdated,
  onHighlightsUpdated,
  onNotificationsChange,
}: { 
  profile: Profile | null | undefined
  highlights: Highlight[]
  notifications: Notification[]
  onLogout: () => void
  onProfileUpdated?: () => void
  onHighlightsUpdated?: () => void
  onNotificationsChange?: () => void
}) {
  const [currentView, setCurrentView] = useState<'main' | 'edit' | 'notifications' | 'settings' | 'help' | 'install'>('main')
  const [supportOpen, setSupportOpen] = useState(false)
  const [localProfile, setLocalProfile] = useState({
    username: userProfile?.username || '@usuario',
    displayName: userProfile?.display_name || 'Usuario',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    instagram: userProfile?.instagram || '',
  })
  const [editedProfile, setEditedProfile] = useState(localProfile)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [addingHighlight, setAddingHighlight] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userProfile?.avatar_url || null)
  const [addingAvatar, setAddingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  // Notificacoes reais vindas do banco (vendas, mensagens, follows, etc.)
  const notifications = useMemo(() => {
    function timeAgo(iso: string) {
      const diff = Date.now() - new Date(iso).getTime()
      const min = Math.floor(diff / 60000)
      if (min < 1) return 'agora mesmo'
      if (min < 60) return `ha ${min} min`
      const h = Math.floor(min / 60)
      if (h < 24) return `ha ${h} h`
      const d = Math.floor(h / 24)
      return d === 1 ? 'ha 1 dia' : `ha ${d} dias`
    }
    return (realNotifications || []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      desc: n.description || '',
      time: timeAgo(n.created_at),
      read: n.is_read,
    }))
  }, [realNotifications])
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    emailNotifications: false,
    privateProfile: false,
    showOnline: true,
    showLocation: true,
  })

  // Atualizar localProfile quando userProfile mudar
  useEffect(() => {
    if (userProfile) {
      setAvatarUrl(userProfile.avatar_url || null)
      setLocalProfile({
        username: userProfile.username || '@usuario',
        displayName: userProfile.display_name || 'Usuario',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        instagram: userProfile.instagram || '',
      })
      setEditedProfile({
        username: userProfile.username || '@usuario',
        displayName: userProfile.display_name || 'Usuario',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        instagram: userProfile.instagram || '',
      })
    }
  }, [userProfile])

  async function saveProfile() {
    if (savingProfile) return
    setSavingProfile(true)
    setProfileError(null)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

    if (!user) {
      setProfileError('Sessão expirada. Faça login novamente.')
      setSavingProfile(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        bio: editedProfile.bio.trim() || null,
        location: editedProfile.location.trim() || null,
        instagram: editedProfile.instagram.trim() || null,
      })
      .eq('id', user.id)

    setSavingProfile(false)

    if (error) {
      setProfileError('N��o foi possível salvar. Tente novamente.')
      return
    }

    setLocalProfile(editedProfile)
    onProfileUpdated?.()
    setCurrentView('main')
  }

  // Adicionar destaque com upload de imagem
  async function addHighlight(file: File) {
    if (addingHighlight) return
    setAddingHighlight(true)
    setProfileError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
      if (!user) {
        setProfileError('Sessão expirada. Faça login novamente.')
        return
      }
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/highlights/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) {
        setProfileError('Não foi possível enviar a imagem. Tente novamente.')
        return
      }
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
      const { error: insErr } = await supabase.from('highlights').insert({
        user_id: user.id,
        label: 'Destaque',
        image_url: pub.publicUrl,
        order_index: userHighlights.length,
      })
      if (insErr) {
        setProfileError('Não foi possível adicionar o destaque. Tente novamente.')
        return
      }
      onHighlightsUpdated?.()
    } finally {
      setAddingHighlight(false)
    }
  }

  function cancelEdit() {
    setEditedProfile(localProfile)
    setCurrentView('main')
  }

  // Enviar e salvar a foto de perfil
  async function uploadAvatar(file: File) {
    if (addingAvatar) return
    setAddingAvatar(true)
    setProfileError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setProfileError('Sessão expirada. Faça login novamente.')
        return
      }
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/avatar/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) {
        setProfileError('Não foi possível enviar a foto. Tente novamente.')
        return
      }
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: pub.publicUrl })
        .eq('id', user.id)
      if (updErr) {
        setProfileError('Não foi possível salvar a foto. Tente novamente.')
        return
      }
      setAvatarUrl(pub.publicUrl)
      onProfileUpdated?.()
    } finally {
      setAddingAvatar(false)
    }
  }

  async function markAllRead() {
    await markAllNotificationsAsRead()
    onNotificationsChange?.()
  }

  function toggleSetting(key: keyof typeof settings) {
    setSettings({ ...settings, [key]: !settings[key] })
  }

  // Header padrao para sub-telas
  function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
    return (
      <header className="flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-full transition hover:bg-muted active:scale-95"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </button>
        <h1 className="flex-1 text-base font-semibold text-foreground">{title}</h1>
      </header>
    )
  }

  // Tela de Notificacoes
  if (currentView === 'notifications') {
    const unreadCount = notifications.filter(n => !n.read).length
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setCurrentView('main')}
            className="flex size-9 items-center justify-center rounded-full transition hover:bg-muted active:scale-95"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </button>
          <h1 className="flex-1 text-base font-semibold text-foreground">Notificacoes</h1>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-primary"
            >
              Marcar todas lidas
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Bell className="size-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma notificacao</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={async () => {
                    if (!notif.read) {
                      await markNotificationAsRead(notif.id)
                      onNotificationsChange?.()
                    }
                  }}
                  className={`flex items-start gap-3 border-b border-border px-4 py-4 text-left transition active:bg-muted/50 ${
                    !notif.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                    notif.type === 'sale' ? 'bg-positive/15' :
                    notif.type === 'follow' ? 'bg-primary/15' :
                    notif.type === 'like' ? 'bg-red-500/15' :
                    'bg-blue-500/15'
                  }`}>
                    {notif.type === 'sale' && <ShoppingBag className="size-5 text-positive" />}
                    {notif.type === 'follow' && <User className="size-5 text-primary" />}
                    {notif.type === 'like' && <Heart className="size-5 text-red-500" />}
                    {notif.type === 'message' && <MessageCircle className="size-5 text-blue-500" />}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                      {!notif.read && <span className="size-2 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{notif.desc}</p>
                    <p className="mt-1 text-[0.65rem] text-muted-foreground/70">{notif.time}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Tela de Configuracoes
  if (currentView === 'settings') {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <SubHeader title="Configuracoes" onBack={() => setCurrentView('main')} />

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Notificacoes */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notificacoes</h2>
            <div className="flex flex-col rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <BellRing className="size-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Notificacoes push</span>
                </div>
                <button type="button" onClick={() => toggleSetting('notifications')}>
                  {settings.notifications ? (
                    <ToggleRight className="size-8 text-primary" />
                  ) : (
                    <ToggleLeft className="size-8 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Notificacoes por e-mail</span>
                </div>
                <button type="button" onClick={() => toggleSetting('emailNotifications')}>
                  {settings.emailNotifications ? (
                    <ToggleRight className="size-8 text-primary" />
                  ) : (
                    <ToggleLeft className="size-8 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Privacidade */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Privacidade</h2>
            <div className="flex flex-col rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Lock className="size-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Perfil privado</span>
                </div>
                <button type="button" onClick={() => toggleSetting('privateProfile')}>
                  {settings.privateProfile ? (
                    <ToggleRight className="size-8 text-primary" />
                  ) : (
                    <ToggleLeft className="size-8 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Eye className="size-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Mostrar status online</span>
                </div>
                <button type="button" onClick={() => toggleSetting('showOnline')}>
                  {settings.showOnline ? (
                    <ToggleRight className="size-8 text-primary" />
                  ) : (
                    <ToggleLeft className="size-8 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Zona de perigo */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-500/70">Zona de perigo</h2>
            <div className="flex flex-col rounded-2xl border border-red-500/20 bg-card">
              <button type="button" className="flex items-center gap-3 border-b border-red-500/20 px-4 py-3.5 text-left">
                <UserX className="size-5 text-red-500" />
                <span className="flex-1 text-sm text-red-500">Desativar conta</span>
              </button>
              <button type="button" className="flex items-center gap-3 px-4 py-3.5 text-left">
                <Trash2 className="size-5 text-red-500" />
                <span className="flex-1 text-sm text-red-500">Excluir conta</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Ajuda e Suporte
  if (currentView === 'install') {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <SubHeader title="Instalar o app" onBack={() => setCurrentView('main')} />
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Instale a Luna Privé como um app no seu celular para uma experiência mais rápida e para
            receber uma <strong className="text-foreground">notificação a cada venda</strong>, mesmo
            com o app fechado.
          </p>
          <InstallAppGuide className="mt-4" />
        </div>
      </div>
    )
  }

  if (currentView === 'help') {
    const faqItems = [
      { q: 'Como recebo meus pagamentos?', a: 'Os pagamentos sao processados automaticamente e enviados para sua conta cadastrada em ate 7 dias uteis apos a venda.' },
      { q: 'Como criar um pack de sucesso?', a: 'Use fotos de alta qualidade, escreva descricoes atraentes e defina um preco competitivo. Promova nas suas redes sociais!' },
      { q: 'Posso alterar o preco dos meus packs?', a: 'Sim! Va ate a aba Packs, selecione o pack que deseja editar e altere o preco a qualquer momento.' },
      { q: 'Como funciona o impulsionamento?', a: 'O impulsionamento coloca seu perfil em destaque para mais compradores, aumentando sua visibilidade e vendas.' },
    ]
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <SubHeader title="Ajuda e Suporte" onBack={() => setCurrentView('main')} />

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Contato rapido */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato rapido</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-4 transition active:scale-[0.98]"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="size-6 text-primary" />
                </span>
                <span className="text-sm font-medium text-foreground">Chat</span>
                <span className="text-[0.65rem] text-muted-foreground">Resposta rapida</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-4 transition active:scale-[0.98]"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="size-6 text-primary" />
                </span>
                <span className="text-sm font-medium text-foreground">E-mail</span>
                <span className="text-[0.65rem] text-muted-foreground">suporte@lunaprive.com</span>
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Perguntas frequentes</h2>
            <div className="flex flex-col gap-2">
              {faqItems.map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="flex-1 text-sm font-medium text-foreground">{item.q}</span>
                    <ChevronDown className={`size-5 text-muted-foreground transition ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="border-t border-border px-4 py-3">
                      <p className="text-sm text-muted-foreground">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Links uteis */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Links uteis</h2>
            <div className="flex flex-col rounded-2xl border border-border bg-card">
              <button type="button" className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-left">
                <FileText className="size-5 text-muted-foreground" />
                <span className="flex-1 text-sm text-foreground">Termos de uso</span>
                <ExternalLink className="size-4 text-muted-foreground" />
              </button>
              <button type="button" className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-left">
                <Shield className="size-5 text-muted-foreground" />
                <span className="flex-1 text-sm text-foreground">Politica de privacidade</span>
                <ExternalLink className="size-4 text-muted-foreground" />
              </button>
              <button type="button" className="flex items-center gap-3 px-4 py-3.5 text-left">
                <Info className="size-5 text-muted-foreground" />
                <span className="flex-1 text-sm text-foreground">Sobre o Luna Prive</span>
                <ExternalLink className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tela de edicao
  if (currentView === 'edit') {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={cancelEdit}
            className="flex size-9 items-center justify-center rounded-full transition hover:bg-muted active:scale-95"
          >
            <X className="size-5 text-foreground" />
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-foreground">Editar perfil</h1>
          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition active:scale-95 disabled:opacity-70"
          >
            {savingProfile && <Loader2 className="size-3.5 animate-spin" />}
            {savingProfile ? 'Salvando...' : 'Salvar'}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Foto de perfil */}
          <div className="flex flex-col items-center">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) uploadAvatar(file)
              }}
            />
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl || "/placeholder.svg"}
                  alt="Foto de perfil"
                  className="size-24 rounded-full object-cover ring-4 ring-primary/30"
                />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full bg-muted ring-4 ring-primary/20">
                  <User className="size-10 text-muted-foreground" />
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={addingAvatar}
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary shadow-lg transition active:scale-95 disabled:opacity-70"
              >
                {addingAvatar ? (
                  <Loader2 className="size-4 animate-spin text-primary-foreground" />
                ) : (
                  <Camera className="size-4 text-primary-foreground" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={addingAvatar}
              className="mt-3 text-sm font-semibold text-primary disabled:opacity-70"
            >
              {avatarUrl ? 'Alterar foto' : 'Adicionar foto'}
            </button>
          </div>

          {/* Campos editaveis */}
          <div className="mt-8 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Nome de usuario
              </label>
              <input
                type="text"
                value={editedProfile.username}
                readOnly
                disabled
                aria-label="Nome de usuario (nao editavel)"
                className="w-full cursor-not-allowed rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground focus:outline-none"
              />
              <p className="mt-1 text-[0.7rem] text-muted-foreground">O nome de usuario nao pode ser alterado.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Nome de exibicao
              </label>
              <input
                type="text"
                value={editedProfile.displayName}
                readOnly
                disabled
                aria-label="Nome de exibicao (nao editavel)"
                className="w-full cursor-not-allowed rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground focus:outline-none"
              />
              <p className="mt-1 text-[0.7rem] text-muted-foreground">O nome de exibicao nao pode ser alterado.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Bio
              </label>
              <textarea
                value={editedProfile.bio}
                onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Destaques */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Destaques do perfil</h2>
              <button type="button" className="text-xs font-semibold text-primary">
                Gerenciar
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {userHighlights.map((h) => (
                <div key={h.id} className="flex flex-col items-center gap-1.5">
                  <div className="relative size-16 overflow-hidden rounded-full ring-2 ring-primary/30">
                    <img src={h.image_url || '/placeholder.svg'} alt={h.label} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-[0.65rem] text-muted-foreground">{h.label}</span>
                </div>
              ))}
              <label
                className={`flex cursor-pointer flex-col items-center gap-1.5 ${
                  addingHighlight ? 'pointer-events-none opacity-70' : ''
                }`}
              >
                <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-primary/5">
                  {addingHighlight ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <Plus className="size-5 text-primary" />
                  )}
                </div>
                <span className="text-[0.65rem] text-muted-foreground">Adicionar</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={addingHighlight}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) addHighlight(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {profileError && (
              <p className="mt-3 text-xs font-medium text-destructive">{profileError}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Tela de perfil normal
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/images/luna-prive-logo.png" alt="Luna Prive" className="h-9 w-auto" />
        </div>
        <button
          type="button"
          onClick={() => setCurrentView('edit')}
          className="flex size-10 items-center justify-center rounded-full bg-card transition active:scale-95"
        >
          <Edit3 className="size-5 text-muted-foreground" />
        </button>
      </header>

      {/* Perfil — layout compacto */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl || "/placeholder.svg"}
                alt="Foto de perfil"
                className="size-20 rounded-full object-cover ring-2 ring-primary/30"
              />
            ) : (
              <button
                type="button"
                onClick={() => setCurrentView('edit')}
                aria-label="Adicionar foto de perfil"
                className="flex size-20 items-center justify-center rounded-full bg-muted ring-2 ring-primary/20 transition active:scale-95"
              >
                <User className="size-9 text-muted-foreground" />
              </button>
            )}
            <span className="absolute bottom-1 right-1 size-4 rounded-full border-2 border-card bg-positive" />
          </div>

          {/* Nome + métricas */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-lg font-bold text-foreground">{localProfile.displayName}</h1>
              {userProfile?.is_verified && <BadgeCheck className="size-4 shrink-0 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">{localProfile.username}</p>

            <div className="mt-3 flex items-center gap-4">
              <div>
                <p className="text-base font-bold leading-none text-foreground">{userProfile?.followers_count || 0}</p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Seguidores</p>
              </div>
              <div>
                <p className="text-base font-bold leading-none text-foreground">{userProfile?.sales_count || 0}</p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Vendas</p>
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  <p className="text-base font-bold leading-none text-foreground">{userProfile?.rating?.toFixed(1) || '0.0'}</p>
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                </div>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Avaliacao</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio + links (somente se houver) */}
        {(localProfile.bio || localProfile.location || localProfile.instagram) && (
          <div className="mt-3 border-t border-border pt-3">
            {localProfile.bio && (
              <p className="text-sm text-muted-foreground">{localProfile.bio}</p>
            )}
            {(localProfile.location || localProfile.instagram) && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {localProfile.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {localProfile.location}
                  </span>
                )}
                {localProfile.instagram && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Instagram className="size-3" />
                    {localProfile.instagram}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Destaques */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Destaques</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {userHighlights.length === 0 ? (
            <button
              type="button"
              onClick={() => setCurrentView('edit')}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-primary/5 ring-offset-2 ring-offset-background">
                <Plus className="size-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Adicionar</span>
            </button>
          ) : (
            <>
              {userHighlights.map((h) => (
                <div key={h.id} className="flex flex-col items-center gap-1.5">
                  <div className="size-20 overflow-hidden rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                    <img src={h.image_url} alt={h.label} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xs text-muted-foreground">{h.label}</span>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCurrentView('edit')}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-primary/5 ring-offset-2 ring-offset-background">
                  <Plus className="size-6 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Adicionar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setCurrentView('edit')}
          className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <User className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-semibold text-foreground">Editar perfil</span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
        
        <button
          type="button"
          onClick={() => setCurrentView('notifications')}
          className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Bell className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-semibold text-foreground">Notificacoes</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-bold text-primary-foreground">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
        
        <button
          type="button"
          onClick={() => setCurrentView('install')}
          className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-semibold text-foreground">Instalar o app</span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('settings')}
          className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Settings className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-semibold text-foreground">Configuracoes</span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
        
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <HelpCircle className="size-5 text-primary" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-semibold text-foreground">Ajuda e suporte</span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </button>
        
        <button
          type="button"
          onClick={onLogout}
          className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
            <LogOut className="size-5 text-red-500" aria-hidden="true" />
          </span>
          <span className="flex-1 text-sm font-semibold text-red-500">Sair da conta</span>
        </button>
      </div>

      {/* Versao */}
      <p className="mt-6 text-center text-xs text-muted-foreground/50">
        Luna Prive v1.0.0
      </p>

      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
