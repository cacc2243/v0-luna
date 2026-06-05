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
  Link,
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
  Gift,
  Gem,
  Crown,
  Flower2,
  Wine,
  Car,
  Plane,
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
  const [activeTab, setActiveTab] = useState<'Início' | 'Packs' | 'Impulsionar' | 'Carteira' | 'Chats' | 'Perfil'>('Início')
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
          <div className="relative w-full max-w-sm rounded-[28px] bg-gradient-to-br from-primary via-primary/70 to-primary/40 p-[3px] shadow-2xl shadow-primary/30">
            <div className="overflow-hidden rounded-[25px]">
              <img
                src="/images/welcome-banner.png"
                alt="Seja Bem Vinda ao Luna Privé!"
                className="h-auto w-full"
              />
            </div>
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
      ) : activeTab === 'Chats' ? (
        <ChatsScreen balance={animatedBalance} />
      ) : (
        <HomeScreen
          balance={animatedBalance}
          today={animatedToday}
          views={views}
          vendas={vendas}
        />
      )}

      {/* Bottom nav */}
      <nav className="flex items-end justify-around border-t border-border bg-card/95 px-2 pb-4 pt-3 backdrop-blur-md">
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
// Tela Chats
// ─────────────────────────────────────────────────────────────────────────────

const mockChats = [
  {
    id: 1,
    name: '@fan_secreto',
    avatar: null,
    lastMessage: 'Oi! Adorei seu pack novo',
    time: '2 min',
    unread: 3,
    online: true,
    lastSeen: 'Online agora',
    messages: [
      { id: 1, text: 'Oi! Vi seu perfil e adorei', sent: false, time: '14:30' },
      { id: 2, text: 'Obrigada! Fico feliz que gostou', sent: true, time: '14:32' },
      { id: 3, text: 'Você tem mais conteúdo assim?', sent: false, time: '14:33' },
      { id: 4, text: 'Tenho sim! Dá uma olhada nos meus packs', sent: true, time: '14:35' },
      { id: 5, text: 'Oi! Adorei seu pack novo', sent: false, time: '14:58' },
    ],
  },
  {
    id: 2,
    name: '@comprador_sp',
    avatar: null,
    lastMessage: 'Você aceita PIX?',
    time: '15 min',
    unread: 1,
    online: true,
    lastSeen: 'Online agora',
    messages: [
      { id: 1, text: 'Boa tarde!', sent: false, time: '13:20' },
      { id: 2, text: 'Oi! Tudo bem?', sent: true, time: '13:25' },
      { id: 3, text: 'Você aceita PIX?', sent: false, time: '13:45' },
    ],
  },
  {
    id: 3,
    name: '@admirador_rj',
    avatar: null,
    lastMessage: 'Obrigado pelo conteúdo!',
    time: '1h',
    unread: 0,
    online: false,
    lastSeen: 'Visto há 1h',
    messages: [
      { id: 1, text: 'Comprei seu pack!', sent: false, time: '12:00' },
      { id: 2, text: 'Muito obrigada pelo apoio!', sent: true, time: '12:05' },
      { id: 3, text: 'Obrigado pelo conteúdo!', sent: false, time: '12:10' },
    ],
  },
  {
    id: 4,
    name: '@cliente_vip',
    avatar: null,
    lastMessage: 'Quando sai o próximo pack?',
    time: '3h',
    unread: 0,
    online: false,
    lastSeen: 'Visto há 3h',
    messages: [
      { id: 1, text: 'Quando sai o próximo pack?', sent: false, time: '10:30' },
    ],
  },
  {
    id: 5,
    name: '@novo_seguidor',
    avatar: null,
    lastMessage: 'Acabei de assinar!',
    time: '5h',
    unread: 0,
    online: true,
    lastSeen: 'Online agora',
    messages: [
      { id: 1, text: 'Acabei de assinar!', sent: false, time: '08:00' },
      { id: 2, text: 'Seja bem-vindo!', sent: true, time: '08:15' },
    ],
  },
]

const giftOptions = [
  { id: 1, name: 'Rosa', icon: Flower2, price: 20, color: 'text-pink-400' },
  { id: 2, name: 'Coracao', icon: Heart, price: 50, color: 'text-red-500' },
  { id: 3, name: 'Estrela', icon: Star, price: 100, color: 'text-amber-400' },
  { id: 4, name: 'Vinho', icon: Wine, price: 250, color: 'text-purple-500' },
  { id: 5, name: 'Presente', icon: Gift, price: 500, color: 'text-primary' },
  { id: 6, name: 'Diamante', icon: Gem, price: 1000, color: 'text-cyan-400' },
  { id: 7, name: 'Coroa', icon: Crown, price: 2500, color: 'text-amber-500' },
  { id: 8, name: 'Carro', icon: Car, price: 5000, color: 'text-slate-400' },
  { id: 9, name: 'Viagem', icon: Plane, price: 10000, color: 'text-sky-400' },
]

function ChatsScreen({ balance }: { balance: number }) {
  const [activeChat, setActiveChat] = useState<typeof mockChats[0] | null>(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<typeof mockChats[0]['messages']>([])
  const [showEmojis, setShowEmojis] = useState(false)
  const [showGifts, setShowGifts] = useState(false)
  const [sendingGift, setSendingGift] = useState<number | null>(null)

  const emojis = ['😊', '😍', '🥰', '😘', '💕', '❤️', '🔥', '💋', '😏', '🙈', '💖', '✨']

  function openChat(chat: typeof mockChats[0]) {
    setActiveChat(chat)
    setMessages(chat.messages)
    setShowEmojis(false)
    setShowGifts(false)
  }

  function closeChat() {
    setActiveChat(null)
    setMessage('')
    setShowEmojis(false)
    setShowGifts(false)
  }

  function sendMessage() {
    if (!message.trim()) return
    const newMsg = {
      id: Date.now(),
      text: message.trim(),
      sent: true,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, newMsg])
    setMessage('')
    setShowEmojis(false)
  }

  function addEmoji(emoji: string) {
    setMessage((prev) => prev + emoji)
  }

  function sendGift(gift: typeof giftOptions[0]) {
    setSendingGift(gift.id)
    setTimeout(() => {
      const newMsg = {
        id: Date.now(),
        text: `Enviou um presente: ${gift.name}`,
        sent: true,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isGift: true,
        giftIcon: gift.icon,
        giftColor: gift.color,
        giftPrice: gift.price,
      }
      setMessages((prev) => [...prev, newMsg as any])
      setSendingGift(null)
      setShowGifts(false)
    }, 1000)
  }

  // Tela de conversa aberta
  if (activeChat) {
    return (
      <div className="flex flex-1 flex-col bg-background">
        {/* Header da conversa */}
        <header className="flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={closeChat}
            className="flex size-9 items-center justify-center rounded-full transition hover:bg-muted active:scale-95"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </button>
          
          <div className="relative">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-base font-bold text-muted-foreground">
              {activeChat.name.charAt(1).toUpperCase()}
            </div>
            {activeChat.online && (
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-positive" />
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{activeChat.name}</p>
            <p className={`text-xs ${activeChat.online ? 'text-positive' : 'text-muted-foreground'}`}>
              {activeChat.lastSeen}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full transition hover:bg-muted active:scale-95"
            >
              <Phone className="size-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full transition hover:bg-muted active:scale-95"
            >
              <Video className="size-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full transition hover:bg-muted active:scale-95"
            >
              <MoreVertical className="size-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
              >
                {(msg as any).isGift ? (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 px-6 py-4">
                    {(() => {
                      const GiftIcon = (msg as any).giftIcon
                      return <GiftIcon className={`size-10 ${(msg as any).giftColor}`} />
                    })()}
                    <p className="text-xs font-medium text-foreground">Presente enviado!</p>
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                      {brl((msg as any).giftPrice)}
                    </span>
                    <p className="text-[0.6rem] text-muted-foreground">{msg.time}</p>
                  </div>
                ) : (
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.sent
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-card text-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`mt-1 text-right text-[0.6rem] ${
                        msg.sent ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {msg.time}
                      {msg.sent && (
                        <Check className="ml-1 inline size-3" />
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Painel de emojis */}
        {showEmojis && (
          <div className="border-t border-border bg-card px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="flex size-10 items-center justify-center rounded-xl text-xl transition hover:bg-muted active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal de presentes */}
        {showGifts && (
          <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full animate-in slide-in-from-bottom rounded-t-3xl bg-card pb-6">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <h3 className="text-base font-semibold text-foreground">Enviar presente</h3>
                <button
                  type="button"
                  onClick={() => setShowGifts(false)}
                  className="flex size-8 items-center justify-center rounded-full transition hover:bg-muted"
                >
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 px-4 pt-4">
                {giftOptions.map((gift) => (
                  <button
                    key={gift.id}
                    type="button"
                    onClick={() => sendGift(gift)}
                    disabled={sendingGift !== null}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/30 p-4 transition hover:border-primary/40 hover:bg-primary/5 active:scale-95 disabled:opacity-50"
                  >
                    {sendingGift === gift.id ? (
                      <Loader2 className={`size-8 animate-spin ${gift.color}`} />
                    ) : (
                      <gift.icon className={`size-8 ${gift.color}`} />
                    )}
                    <span className="text-xs font-medium text-foreground">{gift.name}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                      {brl(gift.price)}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-4 px-4 text-center text-xs text-muted-foreground">
                O valor do presente sera adicionado ao saldo da criadora
              </p>
            </div>
          </div>
        )}

        {/* Input de mensagem */}
        <div className="border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => { setShowEmojis(!showEmojis); setShowGifts(false); }}
              className={`flex size-10 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
                showEmojis ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Smile className="size-5" />
            </button>
            
            <button
              type="button"
              onClick={() => { setShowGifts(!showGifts); setShowEmojis(false); }}
              className={`flex size-10 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
                showGifts ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Gift className="size-5" />
            </button>
            
            <button
              type="button"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted active:scale-95"
            >
              <Image className="size-5" />
            </button>
            
            <div className="relative flex-1">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite uma mensagem..."
                className="w-full rounded-2xl border border-border bg-muted/50 px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {message.trim() ? (
              <button
                type="button"
                onClick={sendMessage}
                className="luna-gradient flex size-10 shrink-0 items-center justify-center rounded-full shadow-md shadow-primary/30 transition active:scale-95"
              >
                <Send className="size-4 text-primary-foreground" />
              </button>
            ) : (
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted active:scale-95"
              >
                <Mic className="size-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Lista de chats
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
              <MessageCircle className="size-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mensagens</h1>
              <p className="text-sm text-muted-foreground">{mockChats.filter(c => c.unread > 0).length} não lidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Chats */}
      <div className="mt-5 flex flex-col gap-2">
        {mockChats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            onClick={() => openChat(chat)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary/40 active:scale-[0.99]"
          >
            {/* Avatar */}
            <div className="relative">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
                {chat.name.charAt(1).toUpperCase()}
              </div>
              {chat.online && (
                <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-positive" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{chat.name}</p>
                <span className="shrink-0 text-[0.65rem] text-muted-foreground">{chat.time}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{chat.lastMessage}</p>
            </div>

            {/* Badge de não lidas */}
            {chat.unread > 0 && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground">
                {chat.unread}
              </span>
            )}
          </button>
        ))}
      </div>
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
    { text: 'alguem viu seu perfil' },
    { text: 'alguem curtiu seu pack' },
    { text: 'alguem favoritou seu perfil' },
    { text: 'alguem abriu seus packs' },
    { text: 'alguem viu seu conteudo' },
    { text: 'alguem salvou seu perfil' },
    { text: 'alguem compartilhou seu pack' },
    { text: 'alguem visitou seu perfil' },
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
              <span className="flex size-8 items-center justify-center rounded-full bg-positive/10">
                <Eye className="size-4 text-positive" />
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
  const [currentView, setCurrentView] = useState<'main' | 'edit' | 'notifications' | 'settings' | 'help'>('main')
  const [profile, setProfile] = useState({
    username: '@sua_luna',
    displayName: 'Sua Luna',
    bio: 'Criadora de conteudo exclusivo. Bem-vinda ao meu cantinho privado.',
    location: 'Sao Paulo, SP',
    instagram: '@sua_luna',
    website: 'lunaprive.com/sua_luna',
  })
  const [editedProfile, setEditedProfile] = useState(profile)
  const [highlights, setHighlights] = useState([
    { id: 1, image: '/images/pack-photo-1.png', label: 'Favoritos' },
    { id: 2, image: '/images/pack-photo-2.png', label: 'Premium' },
    { id: 3, image: '/images/pack-photo-3.png', label: 'Novos' },
  ])
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'sale', title: 'Nova venda!', desc: 'Voce vendeu Pack Premium', time: '2 min', read: false },
    { id: 2, type: 'follow', title: 'Novo seguidor', desc: '@fan_secreto comecou a seguir voce', time: '15 min', read: false },
    { id: 3, type: 'like', title: 'Novo like', desc: 'Alguem curtiu seu Pack Exclusivo', time: '1h', read: false },
    { id: 4, type: 'message', title: 'Nova mensagem', desc: '@comprador_sp enviou uma mensagem', time: '2h', read: true },
    { id: 5, type: 'sale', title: 'Nova venda!', desc: 'Voce vendeu Colecao VIP', time: '5h', read: true },
  ])
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    emailNotifications: false,
    privateProfile: false,
    showOnline: true,
    showLocation: true,
  })

  function saveProfile() {
    setProfile(editedProfile)
    setCurrentView('main')
  }

  function cancelEdit() {
    setEditedProfile(profile)
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
      <div className="flex flex-1 flex-col bg-background">
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
      <div className="flex flex-1 flex-col bg-background">
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
      <div className="flex flex-1 flex-col bg-background">
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
      <div className="flex flex-1 flex-col bg-background">
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
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition active:scale-95"
          >
            Salvar
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
                onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Nome de exibicao
              </label>
              <input
                type="text"
                value={editedProfile.displayName}
                onChange={(e) => setEditedProfile({ ...editedProfile, displayName: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
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
                Localizacao
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={editedProfile.location}
                  onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Instagram
              </label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={editedProfile.instagram}
                  onChange={(e) => setEditedProfile({ ...editedProfile, instagram: e.target.value })}
                  className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Website
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={editedProfile.website}
                  onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
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
              {highlights.map((h) => (
                <div key={h.id} className="flex flex-col items-center gap-1.5">
                  <div className="relative size-16 overflow-hidden rounded-full ring-2 ring-primary/30">
                    <img src={h.image} alt={h.label} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100"
                    >
                      <Edit3 className="size-4 text-white" />
                    </button>
                  </div>
                  <span className="text-[0.65rem] text-muted-foreground">{h.label}</span>
                </div>
              ))}
              <button
                type="button"
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-primary/5">
                  <Plus className="size-5 text-primary" />
                </div>
                <span className="text-[0.65rem] text-muted-foreground">Adicionar</span>
              </button>
            </div>
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
          <h1 className="text-xl font-bold text-foreground">{profile.displayName}</h1>
          <BadgeCheck className="size-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{profile.username}</p>
        
        {/* Bio */}
        <p className="mt-3 max-w-[280px] text-sm text-muted-foreground">{profile.bio}</p>
        
        {/* Links */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {profile.location}
          </span>
          <span className="flex items-center gap-1 text-xs text-primary">
            <Instagram className="size-3" />
            {profile.instagram}
          </span>
        </div>
        
        {/* Stats */}
        <div className="mt-5 flex gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">1.2k</p>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">847</p>
            <p className="text-xs text-muted-foreground">Vendas</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-foreground">4.9</p>
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
          {highlights.map((h) => (
            <div key={h.id} className="flex flex-col items-center gap-1.5">
              <div className="size-20 overflow-hidden rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <img src={h.image} alt={h.label} className="h-full w-full object-cover" />
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
