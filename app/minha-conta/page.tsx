'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import useSWR from 'swr'
import {
  Home,
  Package,
  Rocket,
  Wallet,
  User,
  CalendarDays,
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
  HelpCircle,
  LogOut,
  Star,
  Heart,
  MapPin,
  Instagram,
  Edit3,
  Shield,
  CreditCard,
  Globe,
  Moon,
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
} from 'lucide-react'
import type { Profile, Pack, Sale, Transaction, Withdrawal, Conversation, Boost, Notification, Highlight } from './actions'
import { generatePackActivity, acceptSale, rejectSale } from './actions'

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

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Data Fetching
// ─────────────────────────────────────────────────────────────────────────────

async function fetchProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  return (data || []) as Transaction[]
}

async function fetchWithdrawals() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  return (data || []) as Notification[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Dados mockados (REMOVIDOS - agora usamos dados reais)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────────────────────

export default function MinhaContaPage() {
  const [authState, setAuthState] = useState<'checking' | 'logged_in' | 'logged_out'>('checking')
  
  // Verificar autenticacao
  useEffect(() => {
    const supabase = createClient()
    
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setAuthState(user ? 'logged_in' : 'logged_out')
    }
    
    checkAuth()
    
    // Escutar mudancas de autenticacao
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuthState('logged_out')
      } else if (event === 'SIGNED_IN' && session?.user) {
        setAuthState('logged_in')
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  if (authState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }
  
  if (authState === 'logged_out') {
    return <LoginScreen onSuccess={() => setAuthState('logged_in')} />
  }

  return <AppDashboard />
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela de Login (integrada)
// ─────────────────────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    
    setIsLoading(true)
    setError('')
    
    const supabase = createClient()
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    
    if (signInError) {
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
    
    // Verificar se o convite está pago
    try {
      const inviteResponse = await fetch(`/api/pix/status?email=${encodeURIComponent(email.trim())}`)
      const inviteData = await inviteResponse.json()
      
      if (!inviteData.hasPaidInvite) {
        // Fazer logout e redirecionar para página de convite
        await supabase.auth.signOut()
        setIsLoading(false)
        setError('Seu convite ainda não foi pago. Complete o pagamento para acessar.')
        return
      }
    } catch (err) {
      console.error('[v0] Erro ao verificar convite:', err)
      // Em caso de erro, permitir login (fail-open para não bloquear usuários)
    }
    
    setIsLoading(false)
    onSuccess()
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
          </div>
        </div>
      </div>
    </div>
  )
}
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard do App (com dados reais do Supabase)
// ────────────────────────────────────────────────────────────────────────────������

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
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeClosing, setWelcomeClosing] = useState(false)
  const [balanceFlash, setBalanceFlash] = useState(false)

  // Fetch dados reais do Supabase usando SWR
  const { data: profile, mutate: mutateProfile } = useSWR('profile', fetchProfile)
  const { data: packs = [], mutate: mutatePacks } = useSWR('packs', fetchPacks)
  const { data: sales = [], mutate: mutateSales } = useSWR('sales', fetchSales)
  const { data: transactions = [], mutate: mutateTransactions } = useSWR('transactions', fetchTransactions)
  const { data: withdrawals = [] } = useSWR('withdrawals', fetchWithdrawals)
  const { data: conversations = [] } = useSWR('conversations', fetchConversations)
  const { data: boosts = [] } = useSWR('boosts', fetchBoosts)
  const { data: highlights = [], mutate: mutateHighlights } = useSWR('highlights', fetchHighlights)
  const { data: notifications = [], mutate: mutateNotifications } = useSWR('notifications', fetchNotifications)

  // Calcular estatisticas
  const balance = profile?.balance || 0
  const pendingSales = sales.filter(s => s.status === 'pending')
  const pendingBalance = pendingSales.reduce((sum, s) => sum + Number(s.net_amount), 0)
  const completedSales = sales.filter(s => s.status === 'completed')
  // "Hoje" = ganhos confirmados hoje (transacoes de venda criadas hoje no aceite)
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    )
  }
  const todayEarnings = transactions
    .filter(t => t.type === 'sale' && isToday(t.created_at))
    .reduce((sum, t) => sum + Number(t.amount), 0)
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

  // Motor de atividade: enquanto houver packs publicados, gera views/pedidos periodicamente
  useEffect(() => {
    if (packs.length === 0) return
    const interval = setInterval(async () => {
      await generatePackActivity()
      refreshActivity()
    }, 25000)
    return () => clearInterval(interval)
  }, [packs.length, refreshActivity])

  // Aceitar / recusar pedidos (atualizacao otimista = instantaneo)
  async function handleAcceptSale(saleId: string) {
    const sale = sales.find(s => s.id === saleId)
    if (!sale) return
    const net = Number(sale.net_amount)

    // Atualiza a UI imediatamente, sem esperar o servidor
    mutateSales(
      sales.map(s => (s.id === saleId ? { ...s, status: 'completed' } : s)),
      { revalidate: false },
    )
    mutateProfile(
      profile
        ? {
            ...profile,
            balance: Number(profile.balance) + net,
            total_earned: Number(profile.total_earned) + net,
            sales_count: Number(profile.sales_count) + 1,
          }
        : profile,
      { revalidate: false },
    )
    // Dispara destaque no saldo
    setBalanceFlash(true)
    setTimeout(() => setBalanceFlash(false), 1200)

    // Persiste no servidor em segundo plano e revalida
    acceptSale(saleId).then(() => refreshActivity())
  }
  async function handleRejectSale(saleId: string) {
    // Remove da lista imediatamente
    mutateSales(
      sales.map(s => (s.id === saleId ? { ...s, status: 'cancelled' } : s)),
      { revalidate: false },
    )
    rejectSale(saleId).then(() => refreshActivity())
  }

  // Upload de uma foto para o Storage e retorno da URL publica
  async function handleAddPackPhoto(file: File) {
    if (uploadingPhoto) return
    setUploadingPhoto(true)
    setPackError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setPackError('Sessão expirada. Faça login novamente.')
        return
      }
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/packs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) {
        setPackError('Não foi possível enviar a foto. Tente novamente.')
        return
      }
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path)
      setPackPhotos((prev) => [...prev, pub.publicUrl])
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
    if (!packName.trim()) {
      setPackError('Dê um nome ao seu pack.')
      return
    }
    setPublishing(true)
    setPackError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

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

    // Dispara a atividade inicial: views, pedidos pendentes e notificacoes
    generatePackActivity({ initial: true }).then(() => {
      refreshActivity()
    })
  }

  function closeWelcome() {
    setWelcomeClosing(true)
    setTimeout(() => {
      setShowWelcome(false)
      setWelcomeClosing(false)
    }, 400)
  }

  // Logout
  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Imagem de fundo */}
      <div 
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/app-background.webp)' }}
      >
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Modal de boas-vindas */}
      {showWelcome && (
        <div
          className={`absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm ${
            welcomeClosing ? 'animate-welcome-out' : 'animate-welcome-in'
          }`}
          onClick={closeWelcome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && closeWelcome()}
        >
          <div className="relative w-full max-w-sm rounded-[28px] bg-gradient-to-br from-primary via-primary/70 to-primary/40 p-[3px] shadow-2xl shadow-primary/30">
            <div className="overflow-hidden rounded-[25px]">
              <img
                src="/images/welcome-banner.png"
                alt="Seja Bem Vinda ao Luna Prive!"
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Conteudo rolavel do app */}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
      {activeTab === 'Carteira' ? (
                <WalletScreen balance={animatedBalance} pendingBalance={pendingBalance} withdrawals={withdrawals} transactions={transactions} profile={profile} />
      ) : activeTab === 'Packs' ? (
        <PacksScreen
          balance={animatedBalance}
          packs={packs}
          onCreate={() => setShowCreate(true)}
        />
      ) : activeTab === 'Perfil' ? (
        <ProfileScreen profile={profile} highlights={highlights} onLogout={handleLogout} onProfileUpdated={mutateProfile} onHighlightsUpdated={mutateHighlights} />
      ) : activeTab === 'Impulsionar' ? (
        <ImpulsionarScreen balance={animatedBalance} boosts={boosts} />
      ) : activeTab === 'Chats' ? (
        <ChatsScreen balance={animatedBalance} />
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
            onClick={() => setActiveTab(item.label as any)}
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

      {/* Modal — Criar Pack */}
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
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3.5 py-3.5 transition focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
                <span className="text-base font-medium text-muted-foreground">R$</span>
                <input
                  id="pack-price"
                  value={packPrice}
                  onChange={(e) => setPackPrice(e.target.value)}
                  inputMode="decimal"
                  className="w-full bg-transparent text-base text-foreground outline-none"
                />
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
                  accept="image/*"
                  className="sr-only"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleAddPackPhoto(file)
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
                disabled={publishing}
                className="luna-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-70"
              >
                {publishing ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    Publicando...
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

function ChatsScreen({ balance }: { balance: number }) {
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
            <p className="text-sm text-muted-foreground">
              0 conversas
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Chats - Estado vazio */}
      <div className="mt-6">
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-10 text-center">
          <MessageCircle className="mx-auto size-12 text-muted-foreground/30" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium text-foreground">Nenhuma conversa ainda</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Suas mensagens com compradores aparecerão aqui
          </p>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────���─────�����─────────────────────
// Tela Impulsionar
// ─────────────────────────────────────────────────────────────────────────────

const boostPlans = [
  { days: 2, price: 28.0, pricePerDay: 14.0, discount: 0 },
  { days: 7, price: 56.0, pricePerDay: 8.0, discount: 43 },
  { days: 14, price: 70.0, pricePerDay: 5.0, discount: 64 },
  { days: 21, price: 84.0, pricePerDay: 4.0, discount: 71 },
  { days: 30, price: 99.0, pricePerDay: 3.3, discount: 76, popular: true },
]

function ImpulsionarScreen({ balance, boosts }: { balance: number; boosts: Boost[] }) {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)

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
          className="luna-gradient flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:opacity-50"
        >
          <Zap className="size-5" aria-hidden="true" />
          {selectedPlan
            ? `Impulsionar por ${brl(boostPlans.find((p) => p.days === selectedPlan)?.price || 0)}`
            : 'Selecione um plano'}
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          O impulsionamento começa imediatamente após a confirmação
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela Inicio
// ─────────────────────────────────────────────────────────────────────────────

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
    setAccepting(id)
    // Deixa a animacao de saida rodar antes de remover da lista
    setTimeout(() => {
      onAccept(id)
      setAccepting(null)
    }, 450)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-9 w-auto" />
        </div>
        <div
          className={`luna-border relative flex items-center gap-2.5 rounded-2xl bg-card px-4 py-2.5 ${
            balanceFlash ? 'animate-balance-pop' : ''
          }`}
        >
          <Wallet className="size-6 text-primary" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-xl font-bold text-foreground">{brl(balance)}</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <StatCard icon={CalendarDays} label="Hoje" value={brl(today)} />
        <StatCard icon={Eye} label="Views" value={String(views)} />
        <StatCard icon={ShoppingBag} label="Vendas" value={String(vendas)} />
      </div>

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
          <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
            {viewNotifs.map((n) => (
              <div key={n.id} className="flex items-center gap-3 border-b border-border/50 py-2 last:border-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-positive/10">
                  {n.type === 'follow' ? (
                    <Heart className="size-4 text-positive" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4 text-positive" aria-hidden="true" />
                  )}
                </span>
                <p className="flex-1 text-pretty text-xs text-muted-foreground">{n.description}</p>
                <span className="shrink-0 text-[0.65rem] text-muted-foreground/70">{relativeTime(n.created_at)}</span>
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
              {pendingSales.length} novos
            </span>
          )}
        </div>

        {/* Pedidos pendentes — aguardando aceite */}
        {pendingSales.map((sale) => (
          <div
            key={`pending-${sale.id}`}
            className={`luna-border relative mb-2 rounded-2xl bg-card px-3 py-3 ${
              accepting === sale.id ? 'animate-accept-out' : 'overflow-hidden'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Bell className="size-4 text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 leading-snug">
                <p className="truncate text-[0.8rem] font-semibold text-foreground">
                  {sale.buyer_name} quer {sale.pack?.title || 'seu pack'}
                </p>
                <p className="text-[0.65rem] text-muted-foreground">
                  {relativeTime(sale.created_at)} · você recebe {brl(Number(sale.net_amount))}
                </p>
              </div>
              <span className="text-sm font-bold text-positive">{brl(Number(sale.amount))}</span>
            </div>

            {accepting === sale.id && (
              <span className="animate-money-float pointer-events-none absolute right-4 top-1 text-base font-bold text-positive">
                +{brl(Number(sale.net_amount))}
              </span>
            )}

            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                disabled={accepting === sale.id}
                onClick={() => onReject(sale.id)}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-secondary py-2 text-[0.8rem] font-semibold text-muted-foreground transition active:scale-[0.98] disabled:opacity-60"
              >
                <X className="size-3.5" aria-hidden="true" />
                Recusar
              </button>
              <button
                type="button"
                disabled={accepting === sale.id}
                onClick={() => handleAccept(sale.id)}
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, oklch(0.62 0.17 158) 0%, oklch(0.55 0.16 158) 100%)',
                }}
                className="flex flex-[1.4] items-center justify-center gap-1 rounded-lg py-2 text-[0.8rem] font-bold text-white shadow-lg shadow-positive/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                <Check className="size-3.5" aria-hidden="true" />
                Aceitar venda
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

// ────────────────────────────────────────────────────────���────────────────────
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
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-2 py-3.5 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-5 text-primary" aria-hidden="true" />
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela Packs
// ─────────────��───────────────────────────────────────────────────────────────

function PacksScreen({
  balance,
  packs,
  onCreate,
}: {
  balance: number
  packs: Pack[]
  onCreate: () => void
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
            <article key={pack.id} className="luna-border flex overflow-hidden rounded-2xl bg-card">
              <div className="h-24 w-24 shrink-0 overflow-hidden bg-secondary">
                {pack.cover_image_url ? (
                  <img
                    src={pack.cover_image_url}
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
            </article>
          ))
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela Carteira
// ──────────────���────────────��──��─��────────────────────────────────────────────

function WalletScreen({ 
  balance,
  pendingBalance,
  withdrawals,
  transactions,
  profile
}: { 
  balance: number
  pendingBalance: number
  withdrawals: Withdrawal[]
  transactions: Transaction[]
  profile: Profile | null | undefined
}) {
  const [activeTab, setActiveTab] = useState<'resumo' | 'extrato' | 'saques'>('resumo')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const pixKey = profile?.pix_key || ''

  // Calcular dados do grafico baseado em transacoes reais
  const monthlyData = [
    { month: 'Jan', value: 0 },
    { month: 'Fev', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Abr', value: 0 },
    { month: 'Mai', value: 0 },
    { month: 'Jun', value: 0 },
  ]
  
  // Preencher dados dos ultimos meses com transacoes reais
  transactions.forEach(t => {
    if (t.type === 'sale' || t.type === 'gift_received') {
      const date = new Date(t.created_at)
      const monthIndex = date.getMonth()
      if (monthIndex >= 0 && monthIndex < 6) {
        monthlyData[monthIndex].value += Number(t.amount)
      }
    }
  })
  
  const maxValue = Math.max(...monthlyData.map(d => d.value), 1)

  // Calcular ganhos de hoje
  const todayEarnings = transactions
    .filter(t => {
      const today = new Date()
      const tDate = new Date(t.created_at)
      return tDate.toDateString() === today.toDateString() && t.amount > 0
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Ganhos do mes atual (transacoes de entrada: vendas e presentes)
  const now = new Date()
  const isEarning = (t: Transaction) => t.type === 'sale' || t.type === 'gift_received'
  const monthEarnings = transactions
    .filter(t => {
      const d = new Date(t.created_at)
      return isEarning(t) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)

  // Ganhos do mes anterior, para calcular a variacao percentual real
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEarnings = transactions
    .filter(t => {
      const d = new Date(t.created_at)
      return isEarning(t) && d.getMonth() === prevMonth.getMonth() && d.getFullYear() === prevMonth.getFullYear()
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const monthDeltaPct =
    prevMonthEarnings > 0
      ? Math.round(((monthEarnings - prevMonthEarnings) / prevMonthEarnings) * 100)
      : null

  // Total sacado (somente saques concluidos)
  const totalWithdrawn = withdrawals
    .filter(w => ['completed', 'approved', 'paid', 'done'].includes(String(w.status).toLowerCase()))
    .reduce((sum, w) => sum + Number(w.amount), 0)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header fixo */}
      <header className="shrink-0 px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/images/luna-prive-logo.png" alt="Luna Prive" className="h-9 w-auto" />
          </div>
          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="luna-gradient flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95"
          >
            <ArrowUpRight className="size-4" />
            Sacar
          </button>
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
                <Loader2 className="size-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-500">
                  {brl(pendingBalance)} pendente · aceite os pedidos
                </span>
              </div>
            )}
            
            <div className="mt-4 flex items-center gap-4">
              {todayEarnings > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-positive/15 px-3 py-1">
                  <TrendingUp className="size-3.5 text-positive" />
                  <span className="text-xs font-semibold text-positive">+{brl(todayEarnings)} hoje</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-positive animate-pulse" />
                <span className="text-xs text-muted-foreground">Atualizado agora</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 mt-5 px-4">
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
            {/* Stats rápidos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-positive/15">
                    <TrendingUp className="size-4 text-positive" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Ganhos do mes</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{brl(monthEarnings)}</p>
                {monthDeltaPct !== null ? (
                  <p className={`mt-1 text-xs ${monthDeltaPct >= 0 ? 'text-positive' : 'text-destructive'}`}>
                    {monthDeltaPct >= 0 ? '+' : ''}{monthDeltaPct}% vs mes anterior
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Neste mes</p>
                )}
              </div>
              <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/15">
                    <Wallet className="size-4 text-primary" />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">Total sacado</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{brl(totalWithdrawn)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Desde o inicio</p>
              </div>
            </div>

            {/* Grafico de barras */}
            <div className="mt-5 rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Ganhos mensais</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">2024</span>
              </div>
              <div className="flex h-32 items-end justify-between gap-2">
                {monthlyData.map((d, i) => (
                  <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <div 
                      className={`w-full rounded-lg transition-all ${
                        i === monthlyData.length - 1 ? 'bg-primary shadow-md shadow-primary/30' : 'bg-primary/30'
                      }`}
                      style={{ height: `${(d.value / maxValue) * 100}%`, minHeight: '8px' }}
                    />
                    <span className="text-[0.6rem] text-muted-foreground">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ultimas vendas */}
            <div className="mt-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Ultimas vendas</h3>
              <div className="flex flex-col gap-2">
                {transactions.filter(t => t.type === 'sale').slice(0, 3).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card/80 p-3.5 ring-1 ring-border backdrop-blur-sm">
                    <span className="flex size-10 items-center justify-center rounded-full bg-positive/15">
                      <ShoppingBag className="size-5 text-positive" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{t.desc}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                    <span className="text-sm font-bold text-positive">+{brl(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'extrato' && (
          <div className="flex flex-col gap-2">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card/80 p-3.5 ring-1 ring-border backdrop-blur-sm">
                <span className={`flex size-10 items-center justify-center rounded-full ${
                  t.type === 'sale' ? 'bg-positive/15' :
                  t.type === 'gift' ? 'bg-amber-500/15' :
                  'bg-primary/15'
                }`}>
                  {t.type === 'sale' && <ShoppingBag className="size-5 text-positive" />}
                  {t.type === 'gift' && <Gift className="size-5 text-amber-500" />}
                  {t.type === 'withdraw' && <ArrowDownLeft className="size-5 text-primary" />}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{t.desc}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
                <span className={`text-sm font-bold ${t.amount > 0 ? 'text-positive' : 'text-foreground'}`}>
                  {t.amount > 0 ? '+' : ''}{brl(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'saques' && (
          <div className="flex flex-col gap-4">
            {/* Info de saque */}
            <div className="rounded-2xl bg-primary/10 p-4 ring-1 ring-primary/20">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Info className="size-5 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Saques via PIX</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saques sao processados em ate 24h uteis. O valor minimo para saque e de R$ 50,00.
                  </p>
                </div>
              </div>
            </div>

            {/* Chave PIX */}
            <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
              <p className="text-xs font-medium text-muted-foreground">Chave PIX cadastrada</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{pixKey}</p>
                <button type="button" className="text-xs font-semibold text-primary">
                  Alterar
                </button>
              </div>
            </div>

            {/* Historico de saques */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Historico de saques</h3>
              <div className="flex flex-col gap-2">
                {withdrawals.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-card/80 p-3.5 ring-1 ring-border backdrop-blur-sm">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/15">
                      <ArrowDownLeft className="size-5 text-primary" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{w.label}</p>
                      <p className="text-xs text-muted-foreground">{w.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{brl(w.amount)}</p>
                      <span className="rounded-full bg-positive/15 px-2 py-0.5 text-[0.6rem] font-semibold text-positive">
                        Concluido
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Saque */}
      {showWithdrawModal && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full animate-in slide-in-from-bottom rounded-t-[2rem] bg-card pb-8">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-muted" />
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-lg font-bold text-foreground">Solicitar saque</h3>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="flex size-9 items-center justify-center rounded-full bg-muted/50 transition hover:bg-muted"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5">
              {/* Saldo disponivel */}
              <div className="rounded-2xl bg-muted/50 p-4 text-center">
                <p className="text-xs text-muted-foreground">Saldo disponivel para saque</p>
                <p className="mt-1 text-3xl font-bold text-foreground">{brl(balance)}</p>
              </div>

              {/* Input de valor */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-foreground">Valor do saque</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">R$</span>
                  <input
                    type="text"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-2xl border-0 bg-muted/50 py-4 pl-12 pr-4 text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Atalhos de valor */}
              <div className="mt-3 flex gap-2">
                {[100, 500, 1000, balance].map((val, i) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setWithdrawAmount(val.toFixed(2).replace('.', ','))}
                    className="flex-1 rounded-xl bg-muted/50 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                  >
                    {i === 3 ? 'Tudo' : brl(val)}
                  </button>
                ))}
              </div>

              {/* Chave PIX */}
              <div className="mt-5 rounded-2xl bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Chave PIX de destino</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{pixKey}</p>
              </div>

              {/* Botao de saque */}
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="luna-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
              >
                <ArrowUpRight className="size-5" />
                Confirmar saque
              </button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                O valor sera creditado em ate 24h uteis
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela Perfil
// ─────────────────────────────────────────────────────────────────────────────

function ProfileScreen({ 
  profile: userProfile, 
  highlights: userHighlights,
  onLogout,
  onProfileUpdated,
  onHighlightsUpdated,
}: { 
  profile: Profile | null | undefined
  highlights: Highlight[]
  onLogout: () => void
  onProfileUpdated?: () => void
  onHighlightsUpdated?: () => void
}) {
  const [currentView, setCurrentView] = useState<'main' | 'edit' | 'notifications' | 'settings' | 'help'>('main')
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
  const [notifications, setNotifications] = useState<Array<{id: number; type: string; title: string; desc: string; time: string; read: boolean}>>([])
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
    const { data: { user } } = await supabase.auth.getUser()

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
      setProfileError('Não foi possível salvar. Tente novamente.')
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
      const { data: { user } } = await supabase.auth.getUser()
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

  function markAllRead() {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
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
                  onClick={() => setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n))}
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
          {/* Aparencia */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aparencia</h2>
            <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Moon className="size-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Modo escuro</span>
                </div>
                <button type="button" onClick={() => toggleSetting('darkMode')}>
                  {settings.darkMode ? (
                    <ToggleRight className="size-8 text-primary" />
                  ) : (
                    <ToggleLeft className="size-8 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

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
              <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
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
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <MapPin className="size-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Mostrar localizacao</span>
                </div>
                <button type="button" onClick={() => toggleSetting('showLocation')}>
                  {settings.showLocation ? (
                    <ToggleRight className="size-8 text-primary" />
                  ) : (
                    <ToggleLeft className="size-8 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Conta */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conta</h2>
            <div className="flex flex-col rounded-2xl border border-border bg-card">
              <button type="button" className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-left">
                <CreditCard className="size-5 text-muted-foreground" />
                <span className="flex-1 text-sm text-foreground">Metodos de pagamento</span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
              <button type="button" className="flex items-center gap-3 border-b border-border px-4 py-3.5 text-left">
                <Shield className="size-5 text-muted-foreground" />
                <span className="flex-1 text-sm text-foreground">Seguranca</span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
              <button type="button" className="flex items-center gap-3 px-4 py-3.5 text-left">
                <Globe className="size-5 text-muted-foreground" />
                <span className="flex-1 text-sm text-foreground">Idioma</span>
                <span className="text-xs text-muted-foreground">Portugues</span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
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
            <div className="relative">
              <img
                src="/images/mentor.png"
                alt="Foto de perfil"
                className="size-24 rounded-full object-cover ring-4 ring-primary/30"
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary shadow-lg transition active:scale-95"
              >
                <Camera className="size-4 text-primary-foreground" />
              </button>
            </div>
            <button type="button" className="mt-3 text-sm font-semibold text-primary">
              Alterar foto
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
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Localizacao <span className="text-muted-foreground/60">(opcional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={editedProfile.location}
                  onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                  placeholder="Ex: Sao Paulo, SP"
                  className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Instagram <span className="text-muted-foreground/60">(opcional)</span>
              </label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={editedProfile.instagram}
                  onChange={(e) => setEditedProfile({ ...editedProfile, instagram: e.target.value })}
                  placeholder="@seuusuario"
                  className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
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

      {/* Perfil */}
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="relative">
          <img
            src="/images/mentor.png"
            alt="Foto de perfil"
            className="size-28 rounded-full object-cover ring-4 ring-primary/30"
          />
          <span className="absolute bottom-2 right-2 size-5 rounded-full border-2 border-background bg-positive" />
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          <h1 className="text-xl font-bold text-foreground">{localProfile.displayName}</h1>
          {userProfile?.is_verified && <BadgeCheck className="size-5 text-primary" />}
        </div>
        <p className="text-sm text-muted-foreground">{localProfile.username}</p>
        
        {/* Bio */}
        {localProfile.bio && (
          <p className="mt-3 max-w-[280px] text-sm text-muted-foreground">{localProfile.bio}</p>
        )}
        
        {/* Links */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
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
        
        {/* Stats */}
        <div className="mt-5 flex gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{userProfile?.followers_count || 0}</p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{userProfile?.sales_count || 0}</p>
            <p className="text-xs text-muted-foreground">Vendas</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-foreground">{userProfile?.rating?.toFixed(1) || '0.0'}</p>
              <Star className="size-4 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-xs text-muted-foreground">Avaliacao</p>
          </div>
        </div>
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
          onClick={() => setCurrentView('help')}
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
    </div>
  )
}
