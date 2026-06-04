'use client'

import { useState, useRef, useEffect } from 'react'
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
} from 'lucide-react'

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
// Dados mockados
// ─────────────────────────────────────────────────────────────────────────────

const examplePhotos = [
  '/images/pack-photo-1.png',
  '/images/pack-photo-2.png',
  '/images/pack-photo-3.png',
]

const examplePacks = [
  {
    name: 'Pés & Saltos',
    price: 'R$ 24,90',
    photo: '/images/pack-photo-2.png',
    views: '1.2k views',
    sales: '84 vendas',
  },
  {
    name: 'Ensaio Premium',
    price: 'R$ 39,90',
    photo: '/images/pack-photo-3.png',
    views: '876 views',
    sales: '52 vendas',
  },
  {
    name: 'Coleção VIP',
    price: 'R$ 59,90',
    photo: '/images/pack-photo-1.png',
    views: '2.4k views',
    sales: '137 vendas',
  },
]

const withdrawals = [
  { label: 'Saque PIX', date: 'Hoje, 14:32', amount: 4280.0 },
  { label: 'Saque PIX', date: 'Ontem, 09:10', amount: 2150.0 },
  { label: 'Saque PIX', date: '12 mai, 18:47', amount: 3890.0 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Componente Principal
// ─────────────────────────────────────────────────────────────────────────────

export default function MinhaContaPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)
    // Simula login (qualquer credencial é válida)
    setTimeout(() => {
      setIsLoading(false)
      setIsLoggedIn(true)
    }, 1000)
  }

  if (!isLoggedIn) {
    return <LoginScreen email={email} setEmail={setEmail} password={password} setPassword={setPassword} isLoading={isLoading} onSubmit={handleLogin} />
  }

  return <AppDashboard />
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela de Login
// ─────────────────────────────────────────────────────────────────────────────

function LoginScreen({
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  onSubmit,
}: {
  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
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
          alt="Luna Privé"
          className="mb-8 h-10 w-auto"
        />

        {/* Card de Login */}
        <div className="w-full max-w-sm">
          <div className="luna-border rounded-3xl bg-card p-6 shadow-2xl">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Entrar</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesse sua conta Luna Privé
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
              Ainda não tem conta?{' '}
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
// Dashboard do App (mesmo layout do GuidedAppDemo)
// ─────────────────────────────────────────────────────────────────────────────

function AppDashboard() {
  const [activeTab, setActiveTab] = useState<'Início' | 'Packs' | 'Impulsionar' | 'Carteira' | 'Perfil'>('Início')
  const [balance, setBalance] = useState(639.10)
  const [vendas, setVendas] = useState(7)
  const [today, setToday] = useState(189.90)
  const [views, setViews] = useState(734)
  const [showCreate, setShowCreate] = useState(false)
  const [packName, setPackName] = useState('Pés & Saltos')
  const [packPrice, setPackPrice] = useState('29,90')
  const [packDesc, setPackDesc] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [createdPack, setCreatedPack] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [welcomeClosing, setWelcomeClosing] = useState(false)

  const animatedBalance = useCountUp(balance)
  const animatedToday = useCountUp(today)

  // Visualizações sobem ao vivo
  useEffect(() => {
    const id = setInterval(() => {
      setViews((v) => v + Math.floor(Math.random() * 5) + 1)
    }, 2000)
    return () => clearInterval(id)
  }, [])

  function publishPack() {
    if (publishing) return
    setPublishing(true)
    setTimeout(() => {
      setPublishing(false)
      setShowCreate(false)
      setCreatedPack(packName.trim() || 'Pés & Saltos')
    }, 1300)
  }

  function closeWelcome() {
    setWelcomeClosing(true)
    setTimeout(() => {
      setShowWelcome(false)
      setWelcomeClosing(false)
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
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
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl shadow-2xl">
            <img
              src="/images/welcome-banner.png"
              alt="Seja Bem Vinda ao Luna Privé!"
              className="h-auto w-full"
            />
          </div>
        </div>
      )}

      {/* Conteúdo rolável do app */}
      {activeTab === 'Carteira' ? (
        <WalletScreen balance={animatedBalance} />
      ) : activeTab === 'Packs' ? (
        <PacksScreen
          balance={animatedBalance}
          createdPack={createdPack}
          packPrice={packPrice}
          onCreate={() => setShowCreate(true)}
        />
      ) : activeTab === 'Perfil' ? (
        <ProfileScreen />
      ) : activeTab === 'Impulsionar' ? (
        <ImpulsionarScreen balance={animatedBalance} />
      ) : (
        <HomeScreen
          balance={animatedBalance}
          today={animatedToday}
          views={views}
          vendas={vendas}
        />
      )}

      {/* Bottom nav */}
      <nav className="flex items-center justify-around border-t border-border bg-card/80 px-2 pb-3 pt-2 backdrop-blur">
        {[
          { icon: Home, label: 'Início' as const },
          { icon: Package, label: 'Packs' as const },
          { icon: Rocket, label: 'Impulsionar' as const, center: true },
          { icon: Wallet, label: 'Carteira' as const },
          { icon: User, label: 'Perfil' as const },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setActiveTab(item.label as any)}
            className="flex flex-1 flex-col items-center gap-1"
          >
            {item.center ? (
              <span className="luna-gradient -mt-6 flex size-12 items-center justify-center rounded-full shadow-lg shadow-primary/40">
                <item.icon className="size-5 text-primary-foreground" aria-hidden="true" />
              </span>
            ) : (
              <item.icon
                className={`size-5 ${item.label === activeTab ? 'text-primary' : 'text-muted-foreground'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`text-[0.6rem] ${
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
                  {examplePhotos.length} adicionadas
                </span>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-2.5">
                {examplePhotos.map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-square overflow-hidden rounded-xl border border-border"
                  >
                    <img
                      src={src || '/placeholder.svg'}
                      alt={`Foto de exemplo ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-positive shadow">
                      <Check className="size-3 text-white" aria-hidden="true" />
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 py-3.5 text-sm font-semibold text-primary transition active:scale-[0.99]"
              >
                <ImagePlus className="size-4" aria-hidden="true" />
                Adicionar fotos ou vídeos
              </button>
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
// Tela Impulsionar
// ─────────────────────────────────────────────────────────────────────────────

const boostPlans = [
  { days: 2, price: 28.0, pricePerDay: 14.0, discount: 0 },
  { days: 7, price: 56.0, pricePerDay: 8.0, discount: 43 },
  { days: 14, price: 70.0, pricePerDay: 5.0, discount: 64 },
  { days: 21, price: 84.0, pricePerDay: 4.0, discount: 71 },
  { days: 30, price: 99.0, pricePerDay: 3.3, discount: 76, popular: true },
]

function ImpulsionarScreen({ balance }: { balance: number }) {
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
// Tela Início
// ─────────────────────────────────────────────────────────────────────────────

function HomeScreen({
  balance,
  today,
  views,
  vendas,
}: {
  balance: number
  today: number
  views: number
  vendas: number
}) {
  // Lista de visualizações com novas entrando
  const allViews = [
    { tag: 'SP', text: 'alguém de São Paulo viu seu perfil' },
    { tag: 'RJ', text: 'um comprador do Rio abriu seus packs' },
    { tag: 'MG', text: 'visitante de BH favoritou seu perfil' },
    { tag: 'RS', text: 'novo fã de Porto Alegre curtiu seu pack' },
    { tag: 'BA', text: 'comprador de Salvador viu seu perfil' },
    { tag: 'PR', text: 'visitante de Curitiba abriu seus packs' },
    { tag: 'PE', text: 'alguém de Recife favoritou seu perfil' },
    { tag: 'CE', text: 'fã de Fortaleza viu seu conteúdo' },
    { tag: 'GO', text: 'comprador de Goiânia curtiu seu pack' },
    { tag: 'SC', text: 'visitante de Floripa abriu seu perfil' },
  ]
  
  const [viewList, setViewList] = useState([
    { ...allViews[0], t: 'agora', id: 0 },
    { ...allViews[1], t: '1 min', id: 1 },
    { ...allViews[2], t: '3 min', id: 2 },
  ])
  const [nextId, setNextId] = useState(3)

  // Adiciona nova visualização a cada 3-5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setViewList((prev) => {
        const newView = {
          ...allViews[nextId % allViews.length],
          t: 'agora',
          id: nextId,
        }
        // Atualiza tempos das visualizações existentes
        const updated = prev.map((v, i) => ({
          ...v,
          t: i === 0 ? '1 min' : i === 1 ? '2 min' : `${i + 2} min`,
        }))
        // Adiciona nova no topo e mantém apenas 3
        return [newView, ...updated].slice(0, 3)
      })
      setNextId((n) => n + 1)
    }, 3500)
    return () => clearInterval(interval)
  }, [nextId])

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
        <div className="rounded-2xl border border-border bg-card/60 px-4 py-3">
          {viewList.map((v, index) => (
            <div 
              key={v.id} 
              className={`flex items-center gap-3 border-b border-border/50 py-2 last:border-0 ${
                index === 0 ? 'animate-notification-in' : ''
              }`}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-positive/10 text-[0.65rem] font-bold text-positive">
                {v.tag}
              </span>
              <p className="flex-1 text-pretty text-xs text-muted-foreground">{v.text}</p>
              <span className="text-[0.65rem] text-muted-foreground/70">{v.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pedidos recentes */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
            Pedidos recentes
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { handle: '@fan_secreto', pack: 'Pack 03', amount: 89.9 },
            { handle: '@serg10.tp', pack: 'Pack 07', amount: 129.9 },
            { handle: '@lobo_solitario', pack: 'Pack 01', amount: 69.9 },
          ].map((s) => (
            <div
              key={s.handle}
              className="luna-border flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                <User className="size-4 text-muted-foreground" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="flex items-center gap-1 text-[0.8rem] font-semibold text-foreground">
                  {s.handle}
                  <BadgeCheck className="size-3.5 text-positive" aria-hidden="true" />
                </p>
                <p className="truncate text-[0.7rem] text-muted-foreground">comprou {s.pack}</p>
              </div>
              <span className="flex items-center gap-1 text-[0.8rem] font-bold text-positive">
                <Check className="size-3.5" aria-hidden="true" />
                {brl(s.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
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
// ─────────────────────────────────────────────────────────────────────────────

function PacksScreen({
  balance,
  createdPack,
  packPrice,
  onCreate,
}: {
  balance: number
  createdPack: string | null
  packPrice: string
  onCreate: () => void
}) {
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
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="leading-tight">
          <h1 className="text-xl font-bold text-foreground">Meus Packs</h1>
          <p className="text-xs text-muted-foreground">Sua vitrine de conteúdo</p>
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
        {createdPack && (
          <article className="luna-border animate-pop flex overflow-hidden rounded-2xl bg-card ring-1 ring-primary/30">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden">
              <img
                src="/images/pack-photo-1.png"
                alt={createdPack}
                className="h-full w-full object-cover"
              />
              <span className="luna-gradient absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold text-primary-foreground">
                Novo
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center px-3 py-2">
              <p className="truncate text-sm font-semibold text-foreground">{createdPack}</p>
              <p className="text-base font-bold text-positive">R$ {packPrice}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                <Eye className="size-3" aria-hidden="true" />
                0 views · 0 vendas
              </p>
            </div>
            <div className="flex items-center pr-3">
              <ChevronRight className="size-5 text-muted-foreground/50" />
            </div>
          </article>
        )}
        {examplePacks.map((pack) => (
          <article key={pack.name} className="luna-border flex overflow-hidden rounded-2xl bg-card">
            <div className="h-24 w-24 shrink-0 overflow-hidden">
              <img
                src={pack.photo || '/placeholder.svg'}
                alt={pack.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col justify-center px-3 py-2">
              <p className="truncate text-sm font-semibold text-foreground">{pack.name}</p>
              <p className="text-base font-bold text-positive">{pack.price}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                <Eye className="size-3" aria-hidden="true" />
                {pack.views} · {pack.sales}
              </p>
            </div>
            <div className="flex items-center pr-3">
              <ChevronRight className="size-5 text-muted-foreground/50" />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela Carteira
// ─────────��──────���─�����──────────────────────────────────────────────────────────

function WalletScreen({ balance }: { balance: number }) {
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
      <div className="mt-5 leading-tight">
        <h1 className="text-xl font-bold text-foreground">Carteira</h1>
        <p className="text-xs text-muted-foreground">Saldo, ganhos e transferências</p>
      </div>

      {/* Card saldo disponível */}
      <div className="luna-border mt-4 rounded-3xl bg-card px-5 py-6 text-center shadow-lg shadow-primary/10">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Saldo disponível
        </p>
        <p className="mt-1.5 text-4xl font-bold text-foreground">{brl(balance)}</p>
        <p className="mt-1.5 flex items-center justify-center gap-1 text-sm font-semibold text-positive">
          <ArrowUpRight className="size-4" aria-hidden="true" />
          {brl(1664.97)} hoje
        </p>
      </div>

      {/* Ações */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="luna-gradient flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
          Transferir PIX
        </button>
        <button
          type="button"
          className="luna-border flex items-center justify-center gap-2 rounded-2xl bg-card py-3.5 text-sm font-semibold text-foreground"
        >
          <Receipt className="size-4 text-primary" aria-hidden="true" />
          Extrato
        </button>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="luna-border rounded-2xl bg-card p-3.5">
          <p className="flex items-center gap-1 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
            <ArrowUpRight className="size-3 text-positive" aria-hidden="true" />
            Ganhos mês
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">{brl(18541.67)}</p>
        </div>
        <div className="luna-border rounded-2xl bg-card p-3.5">
          <p className="flex items-center gap-1 text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
            <ArrowDownRight className="size-3 text-primary" aria-hidden="true" />
            Sacado
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">{brl(94614.76)}</p>
        </div>
      </div>

      {/* Saques realizados */}
      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ArrowDownLeft className="size-4 text-primary" aria-hidden="true" />
          Saques realizados
        </p>
        <div className="flex flex-col gap-2">
          {withdrawals.map((w, i) => (
            <div
              key={i}
              className="luna-border flex items-center justify-between rounded-2xl bg-card px-3.5 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                  <ArrowDownLeft className="size-4 text-primary" aria-hidden="true" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-foreground">{w.label}</p>
                  <p className="text-[0.65rem] text-muted-foreground">{w.date}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-foreground">-{brl(w.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela Perfil
// ─────────────────────────────────────────────────────────────────────────────

function ProfileScreen() {
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-9 w-auto" />
        </div>
      </header>

      {/* Perfil */}
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="relative">
          <img
            src="/images/mentor.png"
            alt="Foto de perfil"
            className="size-24 rounded-full object-cover ring-4 ring-primary/30"
          />
          <span className="absolute bottom-1 right-1 size-5 rounded-full border-2 border-background bg-positive" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-foreground">@voce</h1>
        <p className="text-sm text-muted-foreground">Luna desde maio 2024</p>
        
        <div className="mt-4 flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">1.2k</p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">847</p>
            <p className="text-xs text-muted-foreground">Vendas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">4.9</p>
            <p className="text-xs text-muted-foreground">Avaliação</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="mt-8 flex flex-col gap-2">
        {[
          { label: 'Editar perfil', icon: User },
          { label: 'Configurações', icon: Package },
          { label: 'Ajuda e suporte', icon: Info },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <item.icon className="size-5 text-primary" aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-semibold text-foreground">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
