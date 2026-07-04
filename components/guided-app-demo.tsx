'use client'

import { useEffect, useRef, useState } from 'react'
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
  Info,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Lock,
  Heart,
  TrendingUp,
  Sparkles,
  Star,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { CtaButton } from '@/components/cta-button'
import { primeSounds, playNewSale, playSaleAccepted, playSuccess } from '@/lib/sounds'
import { SignupFlow } from '@/components/signup-flow'

interface GuidedAppDemoProps {
  onComplete: () => void
}

const sales = [
  { handle: '@fan_secreto', pack: 'Pack 03', amount: 89.9 },
 { handle: '@serg10.tp', pack: 'Pack 07', amount: 129.9 },
 { handle: '@lobo_solitario', pack: 'Pack 01', amount: 69.9 },
 { handle: '@colecionador_x', pack: 'Pack 12', amount: 199.9 },
]

// Segunda rodada de pedidos — após criar o pack.
// Os pedidos sempre se referem ao pack que a usuária acabou de criar,
// então pack/valor são preenchidos dinamicamente dentro do componente.
const sales2Buyers = [
  { handle: '@admirador_vip' },
  { handle: '@cliente_fiel' },
  { handle: '@noturno.br' },
]

// "29,90" -> 29.9 (com proteção contra valores inválidos)
function parsePrice(input: string) {
  const n = Number.parseFloat(input.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 29.9
}

const tour = [
  {
    key: 'balance' as const,
    text: 'Esse é o seu painel no Luna Privé. Aqui em cima fica o seu saldo disponível pra sacar a qualquer momento.',
  },
  {
    key: 'stats' as const,
    text: 'Aqui você acompanha o que ganhou hoje, quantas pessoas viram o seu perfil e o total de vendas.',
  },
  {
    key: 'views' as const,
    text: 'Olha só: suas visualizações já estão subindo sozinhas. Quanto mais gente vê, mais você vende.',
  },
  {
    key: 'orders' as const,
    text: 'E quando alguém quer um pack, cai um pedido bem aqui. Bora aceitar sua primeira venda?',
  },
]

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

export function GuidedAppDemo({ onComplete }: GuidedAppDemoProps) {
  const [phase, setPhase] = useState<
    'tour' | 'selling' | 'done' | 'selling2' | 'celebrate' | 'projection' | 'wallet' | 'profile' | 'signup'
  >('tour')
  const [showSellModal, setShowSellModal] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [tourDirection, setTourDirection] = useState<'forward' | 'backward'>('forward')
  const [isTransitioning, setIsTransitioning] = useState(false)
  // Pack de referência usado nos pedidos da segunda rodada.
  // A criação de pack foi removida do fluxo, então usamos um pack fixo.
  const packName = 'Pés & Saltos'
  const packPrice = '29,90'
  const [balance, setBalance] = useState(0)
  const [vendas, setVendas] = useState(0)
  const [today, setToday] = useState(0)
  const [views, setViews] = useState(0)
  const [saleIndex, setSaleIndex] = useState(0)
  const [activeSale, setActiveSale] = useState<number | null>(null)
  const [floats, setFloats] = useState<{ id: number; amount: number }[]>([])
  const [shake, setShake] = useState(false)
  const [refuseHint, setRefuseHint] = useState(false)
  const [toast, setToast] = useState<{ id: number; amount: number } | null>(null)
  const [blockedToast, setBlockedToast] = useState<{ x: number; y: number } | null>(null)
  const [moneyParticles, setMoneyParticles] = useState<{ id: number; x: number; y: number }[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const viewsRef = useRef<HTMLDivElement>(null)
  const ordersRef = useRef<HTMLDivElement>(null)
  const animatedBalance = useCountUp(balance)
  const animatedToday = useCountUp(today)
  const highlight = phase === 'tour' ? tour[tourStep].key : null

  // Pack de referência usado nos pedidos da segunda rodada.
  const packLabel = packName.trim() || 'Pés & Saltos'
  const packAmount = parsePrice(packPrice)

  // Segunda rodada: todos os pedidos são do mesmo pack de referência.
  const sales2 = sales2Buyers.map((b) => ({
    ...b,
    pack: packLabel,
    amount: packAmount,
  }))

  // Lista de pedidos da rodada atual (primeira venda ou segunda rodada após o pack)
  const sellingList = phase === 'selling2' ? sales2 : sales

  // O saldo pendente só existe quando há um pedido pendente aparecendo na tela.
  const pendingCount = activeSale !== null ? 1 : 0

  // Visualizações sobem ao vivo durante o tour e as vendas
  useEffect(() => {
    if (phase === 'done') return
    const id = setInterval(() => {
      setViews((v) => v + Math.floor(Math.random() * 7) + 2)
    }, 900)
    return () => clearInterval(id)
  }, [phase])

  // Durante o tour, rola até a seção destacada pela mentora
  useEffect(() => {
    if (phase !== 'tour') return
    const map = {
      balance: headerRef,
      stats: statsRef,
      views: viewsRef,
      orders: ordersRef,
    }
    const key = tour[tourStep].key
    const t = setTimeout(() => {
      map[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)
    return () => clearTimeout(t)
  }, [phase, tourStep])

  // Mostra o primeiro pedido ao entrar no modo de vendas.
  // Não rolamos a tela aqui: o pedido aparece sozinho sem mover a página.
  useEffect(() => {
    if (phase !== 'selling' && phase !== 'selling2') return
    const t = setTimeout(() => {
      setActiveSale(saleIndex)
      // Som de novo pedido chegando (igual ao /minha-conta).
      playNewSale()
    }, 500)
    return () => clearTimeout(t)
  }, [phase, saleIndex])

  // Confetes na tela de parabéns
  useEffect(() => {
    if (phase !== 'celebrate') return
    // Som de sucesso suave sincronizado com o confete.
    playSuccess()
    const colors = ['#ff3d77', '#ff7aa2', '#ffd1dc', '#ffffff']
    const end = Date.now() + 1600
    confetti({ particleCount: 35, spread: 60, startVelocity: 30, origin: { y: 0.4 }, colors, zIndex: 100 })
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 40, origin: { x: 0 }, colors, zIndex: 100 })
      confetti({ particleCount: 2, angle: 120, spread: 40, origin: { x: 1 }, colors, zIndex: 100 })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [phase])

  function advanceTour() {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTourDirection('forward')
    
    setTimeout(() => {
      if (tourStep < tour.length - 1) {
        setTourStep((s) => s + 1)
      } else {
        setPhase('selling')
      }
      setIsTransitioning(false)
    }, 50)
  }

  function acceptSale(e: React.MouseEvent) {
    const list = phase === 'selling2' ? sales2 : sales
    const sale = list[saleIndex]

    // Libera o áudio e toca o som de venda aceita (dinheiro creditado).
    primeSounds()
    playSaleAccepted()

    // Criar partículas de dinheiro no local do clique
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const baseX = e.clientX
    const baseY = rect.top
    const particles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: baseX + (Math.random() - 0.5) * 60,
      y: baseY,
    }))
    setMoneyParticles(particles)
    setTimeout(() => setMoneyParticles([]), 1200)
    
    setActiveSale(null)
    setBalance((b) => b + sale.amount)
    setToday((t) => t + sale.amount)
    setVendas((v) => v + 1)
    const floatId = Date.now()
    setFloats((f) => [...f, { id: floatId, amount: sale.amount }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== floatId)), 1400)

    // Notificaç��o push estilo celular
    const toastId = floatId
    setToast({ id: toastId, amount: sale.amount })
    setTimeout(() => setToast((cur) => (cur?.id === toastId ? null : cur)), 3000)

    if (saleIndex < list.length - 1) {
      setTimeout(() => setSaleIndex((i) => i + 1), 1100)
    } else if (phase === 'selling2') {
      setTimeout(() => setPhase('celebrate'), 900)
    } else {
      // Fim da primeira rodada — segue direto para mais pedidos (sem criar pack).
      setTimeout(() => {
        setSaleIndex(0)
        setPhase('selling2')
      }, 900)
    }
  }

  function tryRefuse() {
    setShake(true)
    setRefuseHint(true)
    setTimeout(() => setShake(false), 450)
    setTimeout(() => setRefuseHint(false), 2400)
  }

  function showBlockedToast(e: React.MouseEvent) {
    e.stopPropagation()
    const x = e.clientX
    const y = e.clientY
    setBlockedToast({ x, y })
    setTimeout(() => setBlockedToast(null), 1200)
  }

  const activeTab =
    phase === 'wallet'
      ? 'Carteira'
      : phase === 'profile' || phase === 'signup'
        ? 'Perfil'
        : 'Início'

  const currentSale = activeSale !== null ? sellingList[activeSale] : null
  const saleActive = currentSale !== null && (phase === 'selling' || phase === 'selling2')

  const dim = (key: string) =>
  phase === 'tour' && highlight !== key
    ? 'opacity-55 brightness-90 transition-all duration-500 ease-out'
    : saleActive && key !== 'orders'
      ? 'opacity-55 brightness-90 transition-all duration-500 ease-out'
      : 'opacity-100 transition-all duration-500 ease-out'

  const ring = (key: string) => (highlight === key ? 'animate-highlight ring-2 ring-primary/50 transition-all duration-500' : 'ring-0 transition-all duration-500')

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Notificação push estilo celular */}
      {toast && (
        <div
          key={toast.id}
          className="animate-notif pointer-events-none absolute inset-x-0 top-0 z-[60] px-3 pt-3"
        >
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-md">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <img src="/images/luna-icon.png" alt="Luna Privé" className="size-6 object-contain" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-bold text-foreground">Você vendeu um Pack!</p>
              <p className="text-xs text-muted-foreground">agora</p>
            </div>
            <span className="text-sm font-bold text-positive">+{brl(toast.amount)}</span>
          </div>
        </div>
      )}

      {/* Toast de ação bloqueada */}
      {blockedToast && (
        <div
          className="pointer-events-none fixed z-[70] animate-blocked-toast"
          style={{ 
            left: Math.max(20, Math.min(blockedToast.x - 70, typeof window !== 'undefined' ? window.innerWidth - 180 : 300)),
            top: blockedToast.y - 40,
          }}
        >
          <div className="flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg ring-1 ring-border/50 backdrop-blur-sm">
            <Lock className="size-3" aria-hidden="true" />
            <span>Complete o tutorial</span>
          </div>
        </div>
      )}

      {/* Partículas de dinheiro subindo */}
      {moneyParticles.map((particle, i) => (
        <div
          key={particle.id}
          className="pointer-events-none fixed z-[70] animate-money-float text-lg font-bold text-positive"
          style={{ 
            left: particle.x,
            top: particle.y,
            animationDelay: `${i * 50}ms`,
          }}
        >
          R$
        </div>
      ))}

      {/* Conteúdo rolável do app */}
      {phase === 'wallet' ? (
        <div key="wallet-screen" className="animate-slide-in-right flex min-h-0 flex-1 flex-col">
          <WalletScreen onDone={() => setPhase('profile')} />
        </div>
      ) : phase === 'profile' || phase === 'signup' ? (
        <div key="profile-screen" className="animate-slide-in-right flex min-h-0 flex-1 flex-col">
          <ProfileScreen onDone={() => setShowSellModal(true)} hideHint={phase === 'signup'} />
        </div>
      ) : (
      <div key="home-screen" ref={scrollRef} className="animate-screen flex-1 overflow-y-auto px-4 pb-6">
        {/* Header fixo */}
        <header
          ref={headerRef}
          className={`sticky top-0 z-30 -mx-4 flex items-center justify-between gap-3 border-b border-border/40 bg-background/85 px-4 py-3 backdrop-blur-md transition-opacity duration-300 ${dim('balance')}`}
        >
          <div className="flex items-center gap-2.5">
            <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-9 w-auto" />
          </div>
          <div
            className={`luna-border relative flex items-center gap-2 rounded-xl bg-card px-3 py-2 transition-all duration-300 ${ring('balance')}`}
          >
            <Wallet className="size-5 text-primary" aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-[0.65rem] text-muted-foreground">Saldo</p>
              <p className="text-base font-bold text-foreground">{brl(animatedBalance)}</p>
            </div>
            {floats.map((f) => (
              <span
                key={f.id}
                className="animate-float-up pointer-events-none absolute -top-1 right-2 text-sm font-bold text-positive"
              >
                +{brl(f.amount)}
              </span>
            ))}
          </div>
        </header>

        {/* Stats */}
        <div
          ref={statsRef}
          className={`mt-4 grid grid-cols-3 gap-2.5 rounded-2xl transition-all duration-300 ${dim('stats')} ${ring('stats')} ${
            highlight === 'stats' ? 'scale-[1.01]' : ''
          }`}
        >
          <StatCard icon={CalendarDays} label="Hoje" value={brl(animatedToday)} highlighted={highlight === 'stats'} />
          <StatCard icon={Eye} label="Views" value={String(views)} highlighted={highlight === 'stats'} />
          <StatCard icon={ShoppingBag} label="Vendas" value={String(vendas)} highlighted={highlight === 'stats'} />
        </div>

        {/* Visualizações recentes */}
        <div ref={viewsRef} className={`mt-5 transition-all duration-300 ${dim('views')}`}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Eye className="size-4 text-positive" aria-hidden="true" />
              Visualizações recentes
            </h3>
            <span className="rounded-full border border-positive/40 px-2 py-0.5 text-xs font-semibold text-positive">
              {views}
            </span>
          </div>
          <div
            className={`rounded-2xl border border-border bg-card/60 px-4 py-3 transition-all duration-300 ${ring('views')}`}
          >
            {[
              { name: 'Wagner Souza', t: 'agora' },
              { name: 'Diego Martins', t: '1 min' },
              { name: 'Eduardo Santos', t: '3 min' },
            ].map((v) => (
              <div key={v.name} className="flex items-center gap-3 border-b border-border/50 py-2 last:border-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-positive/10">
                  <Heart className="size-4 text-positive" aria-hidden="true" />
                </span>
                <p className="flex-1 text-pretty text-xs text-muted-foreground">
                  {v.name} começou a seguir você
                </p>
                <span className="shrink-0 text-[0.65rem] text-muted-foreground/70">{v.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pedidos recentes (pedido pendente + histórico de aceitas) */}
        <div ref={ordersRef} className={`mt-5 transition-all duration-300 ${dim('orders')}`}>
          <div className={`mb-2 flex items-center justify-between transition-all duration-300 ${saleActive ? 'opacity-25 blur-[1px] brightness-75' : 'opacity-100'}`}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
              Pedidos recentes
            </h3>
            {pendingCount > 0 && (
              <span className="rounded-full border border-primary/40 px-2 py-0.5 text-xs font-semibold text-primary">
                {pendingCount} novos
              </span>
            )}
          </div>

          {/* Pedido pendente ativo — compacto */}
          {currentSale && (phase === 'selling' || phase === 'selling2') && (
            <div
              key={`order-${activeSale}`}
              className={`luna-border relative z-[45] mb-2 overflow-hidden rounded-2xl bg-card px-4 py-4 ${ring('orders')} ${
                shake ? 'animate-shake' : 'animate-card-enter'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Bell className="size-5 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="line-clamp-2 text-balance break-words text-[0.95rem] font-semibold text-foreground">
                    {currentSale.handle} quer comprar o {currentSale.pack}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">agora</p>
                </div>
                <span className="text-base font-bold text-positive">{brl(currentSale.amount)}</span>
              </div>

              {refuseHint && (
                <p className="mt-3 rounded-lg bg-primary/10 px-2.5 py-1.5 text-center text-[0.7rem] font-medium text-primary">
                  Aceite a venda para continuar
                </p>
              )}

              <div className="mt-4 flex gap-2.5">
                <button
                  type="button"
                  onClick={tryRefuse}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary py-3.5 text-[0.9rem] font-semibold text-muted-foreground transition active:scale-[0.98]"
                >
                  <X className="size-4" aria-hidden="true" />
                  Recusar
                </button>
                <button
                  type="button"
                  onClick={acceptSale}
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, oklch(0.62 0.17 158) 0%, oklch(0.55 0.16 158) 100%)',
                  }}
                  className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl py-3.5 text-[0.9rem] font-bold text-white shadow-lg shadow-positive/20 transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Check className="size-4" aria-hidden="true" />
                  Aceitar venda
                </button>
              </div>
            </div>
          )}

          {/* Histórico de aceitas / vazio */}
          {vendas === 0 && !currentSale ? (
            <div className={`rounded-2xl border border-border bg-card/60 px-4 py-6 text-center transition-all duration-300 ${ring('orders')}`}>
              <p className="text-xs text-muted-foreground">
                Seus pedidos aparecem aqui.
              </p>
            </div>
          ) : (
            <div className={`transition-all duration-300 ${saleActive ? 'opacity-25 blur-[1px] brightness-75' : 'opacity-100'}`}>
              {[...sales, ...sales2].slice(0, vendas).reverse().map((s, i) => (
                <div
                  key={s.handle}
                  className="luna-border animate-notification-in mb-2 flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5"
                  style={{ animationDelay: `${i * 50}ms` }}
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
          )}
        </div>
      </div>
      )}

      {/* Bloqueio de interação durante tutorial - captura cliques fora das áreas permitidas */}
      {phase === 'tour' && (
        <div 
          className="absolute inset-0 z-[43]"
          onClick={showBlockedToast}
          aria-hidden="true"
        />
      )}

      {/* Bottom nav */}
      <nav className="flex items-center justify-around border-t border-border bg-card/80 px-2 pb-3 pt-2 backdrop-blur">
        {[
          { icon: Home, label: 'Início' },
          { icon: Package, label: 'Packs' },
          { icon: Rocket, label: 'Boost', center: true },
          { icon: Wallet, label: 'Carteira' },
          { icon: User, label: 'Perfil' },
        ].map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
            {item.center ? (
              <span className="luna-gradient -mt-6 flex size-12 items-center justify-center rounded-full shadow-lg shadow-primary/40">
                <item.icon className="size-5 text-primary-foreground" aria-hidden="true" />
              </span>
            ) : (
              <item.icon
                className={`size-5 transition-colors ${item.label === activeTab ? 'text-primary' : 'text-muted-foreground/40'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`text-[0.6rem] transition-colors ${
                item.label === activeTab ? 'font-semibold text-primary' : 'text-muted-foreground/40'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Coach bar (tour) — flutua sobre o app, acima da nav */}
      {phase === 'tour' && (
        <>
          {/* Scrim escuro com degradê suave para dar destaque à barra da mentora */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[45] h-[26rem]"
            style={{
              background:
                'linear-gradient(to top, oklch(0 0 0 / 0.6) 0%, oklch(0 0 0 / 0.5) 22%, oklch(0 0 0 / 0.35) 45%, oklch(0 0 0 / 0.16) 68%, transparent 100%)',
            }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-14 z-[46] px-4">
            <div className="luna-border animate-coach-glow pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-primary/30">
              <img
                src="/images/mentor.png"
                alt="Camila"
                className="size-10 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
              />
            <div className="flex-1">
              <p 
                key={`tour-text-${tourStep}`} 
                className={`text-pretty text-base leading-relaxed text-foreground ${
                  tourDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'
                }`}
              >
                {tour[tourStep].text}
              </p>
              <button
                type="button"
                onClick={advanceTour}
                disabled={isTransitioning}
                className="animate-cta-breathe mt-3 w-full rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              >
                {tourStep < tour.length - 1 ? 'Entendi, próximo' : 'Ver meu primeiro pedido'}
              </button>
            </div>
            </div>
          </div>
        </>
      )}

      {/* Barra da mentora — segunda rodada de pedidos */}
      {phase === 'selling2' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-[46] px-4">
          <div className="luna-border animate-coach-glow mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-primary/30">
            <img
              src="/images/mentor.png"
              alt="Camila"
              className="size-9 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
            />
            <p className="flex-1 text-pretty text-sm leading-relaxed text-foreground">
              Vamos aceitar mais alguns pedidos? Faltam{' '}
              <span className="font-bold text-primary">{sales2.length - saleIndex}</span> pra
              continuar.
            </p>
          </div>
        </div>
      )}

      {/* Overlay — Parabéns (segunda rodada concluída) com confetes */}
      {phase === 'celebrate' && (
        <div className="absolute inset-0 z-[58] flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
          <div className="animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-primary/40 bg-card text-center shadow-2xl shadow-primary/25 ring-1 ring-primary/10">
            {/* brilho sutil no topo */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/25),transparent_70%)]"
              aria-hidden="true"
            />
            <div className="relative px-6 pb-6 pt-7">
              <div className="animate-card-enter relative mx-auto w-fit" style={{ animationDelay: '100ms' }}>
                <img
                  src="/images/mentor.png"
                  alt="Camila"
                  className="size-16 rounded-full object-cover ring-2 ring-primary/50"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-positive shadow">
                  <Check className="size-3.5 text-white" aria-hidden="true" />
                </span>
              </div>

              <p className="animate-card-enter mt-4 text-xl font-bold text-foreground" style={{ animationDelay: '150ms' }}>
                Meus parabéns!
              </p>

              <div className="animate-card-enter luna-gradient mx-auto mt-5 w-full rounded-2xl px-5 py-4 shadow-lg shadow-primary/30" style={{ animationDelay: '200ms' }}>
                <p className="flex items-center justify-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-primary-foreground/85">
                  <TrendingUp className="size-3.5" aria-hidden="true" />
                  No app real você já teria ganho
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-primary-foreground">
                  {brl(balance)}
                </p>
              </div>

              <p className="animate-card-enter mt-5 text-pretty text-sm leading-relaxed text-muted-foreground" style={{ animationDelay: '250ms' }}>
                Neste ritmo, tenho certeza que a sua jornada aqui vai ser maravilhosa! Vamos
                descobrir como você saca os seus ganhos no{' '}
                <span className="font-semibold text-foreground">Luna Privé</span>?
              </p>

              <div className="animate-card-enter mt-6" style={{ animationDelay: '300ms' }}>
                <CtaButton onClick={() => setPhase('projection')}>Ver minha projeção</CtaButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay — Projeção de ganhos (30 dias e 1 ano) */}
      {phase === 'projection' && (
        <div className="absolute inset-0 z-[58] flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
          <div className="animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-primary/40 bg-card shadow-2xl shadow-primary/25 ring-1 ring-primary/10">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/25),transparent_70%)]"
              aria-hidden="true"
            />
            <div className="relative px-6 pb-6 pt-7">
              <div
                className="animate-card-enter mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary"
                style={{ animationDelay: '100ms' }}
              >
                <TrendingUp className="size-6" aria-hidden="true" />
              </div>

              <p
                className="animate-card-enter mt-4 text-center text-xl font-bold text-foreground"
                style={{ animationDelay: '150ms' }}
              >
                Olha até onde você pode chegar
              </p>
              <p
                className="animate-card-enter mt-1.5 text-center text-pretty text-sm leading-relaxed text-muted-foreground"
                style={{ animationDelay: '200ms' }}
              >
                Mantendo o ritmo que você acabou de ver, esta é a sua projeção de ganhos:
              </p>

              <div
                className="animate-card-enter mt-5 rounded-2xl border border-border/60 bg-background/50 p-4"
                style={{ animationDelay: '250ms' }}
              >
                <p className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="size-3.5 text-primary" aria-hidden="true" />
                  Em 30 dias
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
                  {brl(balance * 30)}
                </p>
              </div>

              <div
                className="animate-card-enter luna-gradient mt-3 rounded-2xl px-4 py-4 shadow-lg shadow-primary/30"
                style={{ animationDelay: '300ms' }}
              >
                <p className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-primary-foreground/85">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Em 1 ano
                </p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-primary-foreground">
                  {brl(balance * 30 * 12)}
                </p>
              </div>

              <p
                className="animate-card-enter mt-4 text-center text-[0.72rem] leading-relaxed text-muted-foreground"
                style={{ animationDelay: '350ms' }}
              >
                Projeção estimada com base no seu ritmo de vendas. Quanto mais você se dedica, mais
                longe pode chegar no <span className="font-semibold text-foreground">Luna Privé</span>.
              </p>

              <div className="animate-card-enter mt-5" style={{ animationDelay: '400ms' }}>
                <CtaButton onClick={() => setPhase('wallet')}>Ver minha carteira</CtaButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Vamos vender de verdade? */}
      {showSellModal && phase !== 'signup' && (
        <div className="absolute inset-0 z-[58] flex items-center justify-center px-5">
          {/* Backdrop sem dismiss: este é um passo obrigatório do fluxo.
              Fechar por clique no fundo travava a demo (coach já oculto). */}
          <div
            className="absolute inset-0 bg-background/85 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-primary/40 bg-card shadow-2xl shadow-primary/25 ring-1 ring-primary/10">
            {/* Topo com a logo da Luna */}
            <div className="flex items-center justify-center border-b border-border/60 bg-secondary/40 px-6 py-4">
              <img
                src="/images/luna-prive-logo.png"
                alt="Luna Privé"
                className="h-7 w-auto"
              />
            </div>

            <div className="px-6 pb-7 pt-6">
              {/* Mentora + título centralizados */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img
                    src="/images/mentor.png"
                    alt="Camila"
                    className="size-16 rounded-full object-cover ring-2 ring-primary/50"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full border-2 border-card bg-primary">
                    <BadgeCheck className="size-3.5 text-primary-foreground" aria-hidden="true" />
                  </span>
                </div>
                <h2 className="mt-4 text-balance text-xl font-bold leading-tight text-foreground">
                  Vamos agora vender de verdade?
                </h2>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  Você viu como é simples. Crie sua conta na{' '}
                  <span className="font-semibold text-foreground">Luna Privé</span> e comece a
                  faturar com seus packs — leva menos de 2 minutos.
                </p>
              </div>

              {/* Benefícios rápidos */}
              <ul className="mt-5 flex flex-col gap-2.5">
                {[
                  'Mais de 120 mil compradores ativos',
                  'Sem nenhum contato com os compradores',
                  'Receba direto no seu PIX, 100% anônimo',
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-positive/15">
                      <Check className="size-3 text-positive" aria-hidden="true" />
                    </span>
                    <span className="text-[0.8rem] font-medium leading-snug text-foreground/90">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => {
                  setShowSellModal(false)
                  setPhase('signup')
                }}
                className="luna-gradient animate-cta-pulse mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-extrabold text-primary-foreground shadow-xl shadow-primary/40 ring-2 ring-primary/50 transition active:scale-[0.98]"
              >
                Criar minha conta
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>

              <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">
                +120 mil compradores ativos esperando pelos seus packs
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overlay — Cadastro (app opaco ao fundo) */}
      {phase === 'signup' && <SignupFlow onComplete={onComplete} />}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlighted,
}: {
  icon: typeof Home
  label: string
  value: string
  highlighted?: boolean
}) {
  return (
  <div
  className={`flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border bg-card px-1.5 py-3.5 text-center transition-all duration-300 ${
  highlighted ? 'border-primary/50' : 'border-border'
  }`}
  >
  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
  <Icon className="size-5 text-primary" aria-hidden="true" />
  </span>
  <span className="text-xs text-muted-foreground">{label}</span>
  <span className="w-full truncate px-0.5 text-base font-bold leading-tight text-foreground">{value}</span>
  </div>
  )
}

const withdrawals = [
  { label: 'Saque PIX', date: 'Hoje, 14:32', amount: 4280.0 },
  { label: 'Saque PIX', date: 'Ontem, 09:10', amount: 2150.0 },
  { label: 'Saque PIX', date: '12 mai, 18:47', amount: 3890.0 },
]

const monthlyChart = [
  { label: 'Jun', value: 18541.67, current: true },
  { label: 'Jul', value: 0 },
  { label: 'Ago', value: 0 },
  { label: 'Set', value: 0 },
  { label: 'Out', value: 0 },
  { label: 'Nov', value: 0 },
]

function WalletScreen({ onDone, hideHint }: { onDone: () => void; hideHint?: boolean }) {
  const [showHint, setShowHint] = useState(true)
  const [activeTab, setActiveTab] = useState<'resumo' | 'extrato' | 'saques'>('resumo')
  const available = 18541.67
  const maxValue = Math.max(...monthlyChart.map((d) => d.value), 1)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="shrink-0 px-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-9 w-auto" />
          </div>
        </header>

        {/* Card de saldo principal */}
        <div className="shrink-0 px-4 pt-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-5 ring-1 ring-primary/20">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-primary/5 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-medium text-muted-foreground">Saldo disponível</p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">{brl(available)}</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5 rounded-full bg-positive/15 px-3 py-1">
                  <TrendingUp className="size-3.5 text-positive" aria-hidden="true" />
                  <span className="text-xs font-semibold text-positive">+{brl(1664.97)} hoje</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 animate-pulse rounded-full bg-positive" />
                  <span className="text-xs text-muted-foreground">Atualizado agora</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de saque + aviso */}
        <div className="shrink-0 px-4 pt-4">
          <button
            type="button"
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

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-5">
          {activeTab === 'resumo' && (
            <>
              {/* Stats rápidos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-positive/15">
                      <TrendingUp className="size-4 text-positive" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Ganhos do mês</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{brl(18541.67)}</p>
                  <p className="mt-1 text-xs text-positive">+24% vs mês anterior</p>
                </div>
                <div className="rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/15">
                      <Wallet className="size-4 text-primary" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Total sacado</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-foreground">{brl(94614.76)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Desde o início</p>
                </div>
              </div>

              {/* Gráfico de ganhos mensais */}
              <div className="mt-5 rounded-2xl bg-card/80 p-4 ring-1 ring-border backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Ganhos mensais</h3>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    2026
                  </span>
                </div>
                <div className="flex h-36 items-end justify-between gap-2">
                  {monthlyChart.map((d) => {
                    const pct = Math.max((d.value / maxValue) * 100, d.value > 0 ? 6 : 2)
                    return (
                      <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        {d.value > 0 && (
                          <span className="text-[0.6rem] font-semibold text-foreground">
                            {(d.value / 1000).toFixed(1)}k
                          </span>
                        )}
                        <div
                          className={`w-full rounded-lg ${
                            d.current ? 'bg-primary shadow-md shadow-primary/30' : 'bg-primary/30'
                          }`}
                          style={{ height: `${pct}%`, minHeight: '6px' }}
                        />
                        <span className={`text-[0.6rem] ${d.current ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                          {d.label}
                        </span>
                      </div>
                    )
                  })}
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
            </>
          )}

          {activeTab !== 'resumo' && (
            <div className="rounded-2xl bg-card/60 p-8 text-center ring-1 ring-border">
              <p className="text-sm text-muted-foreground">
                {activeTab === 'extrato'
                  ? 'Seu extrato completo aparece aqui.'
                  : 'Seus saques aparecem aqui.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Coach — mentora explicando a carteira */}
      {showHint && !hideHint && (
        <>
          {/* Scrim de tela cheia: escurece o app (menos destaque) e captura/trava os toques por trás */}
          <button
            type="button"
            aria-label="Continuar"
            onClick={() => {
              setShowHint(false)
              onDone()
            }}
            className="absolute inset-0 z-[50] cursor-default bg-background/70"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[55] px-3 pb-3">
            <div className="luna-border animate-pop animate-coach-glow pointer-events-auto relative flex items-start gap-3 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-primary/30">
              <img
                src="/images/mentor.png"
                alt="Camila"
                className="size-10 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
              />
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-1.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full ${i === 4 ? 'w-5 bg-primary' : 'w-3 bg-primary/30'}`}
                    />
                  ))}
                </div>
                <p className="animate-item text-pretty text-base leading-relaxed text-foreground">
                  Essa é a sua <span className="font-bold text-primary">carteira</span>: aqui você
                  acompanha seu saldo, seus ganhos e pode transferir tudo para sua conta via PIX a
                  qualquer momento.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowHint(false)
                    onDone()
                  }}
                className="animate-cta-breathe mt-3 w-full rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ProfileScreen({ onDone, hideHint }: { onDone: () => void; hideHint?: boolean }) {
  const [showHint, setShowHint] = useState(true)

  const menu = [
    { icon: User, label: 'Editar perfil' },
    { icon: Bell, label: 'Notificações', badge: 3 },
    { icon: Settings, label: 'Configurações' },
    { icon: HelpCircle, label: 'Ajuda e suporte' },
  ]

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 pt-6">
        {/* Header */}
        <header className="shrink-0">
          <div className="flex items-center justify-between gap-3">
            <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-9 w-auto" />
            <span className="flex size-9 items-center justify-center rounded-full bg-card ring-1 ring-border">
              <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
            </span>
          </div>
        </header>

        {/* Card de perfil */}
        <div className="luna-border mt-5 rounded-2xl bg-card p-4">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <span className="flex size-20 items-center justify-center rounded-full bg-muted ring-2 ring-primary/30">
                <User className="size-9 text-muted-foreground" aria-hidden="true" />
              </span>
              <span className="absolute bottom-1 right-1 size-4 rounded-full border-2 border-card bg-positive" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-lg font-bold text-foreground">Seu perfil</h1>
                <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
              </div>
              <p className="text-xs text-muted-foreground">@seuusuario</p>
              <div className="mt-3 flex items-center gap-4">
                <div>
                  <p className="text-base font-bold leading-none text-foreground">447</p>
                  <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Seguidores</p>
                </div>
                <div>
                  <p className="text-base font-bold leading-none text-foreground">146</p>
                  <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Vendas</p>
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    <p className="text-base font-bold leading-none text-foreground">4.9</p>
                    <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  </div>
                  <p className="mt-0.5 text-[0.65rem] text-muted-foreground">Avaliação</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Destaques */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Destaques</h2>
          <div className="flex gap-4 overflow-x-auto pb-1">
            <button type="button" className="flex flex-col items-center gap-1.5">
              <div className="flex size-20 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-primary/5">
                <Plus className="size-6 text-primary" aria-hidden="true" />
              </div>
              <span className="text-xs text-muted-foreground">Adicionar</span>
            </button>
          </div>
        </div>

        {/* Menu */}
        <div className="mt-6 flex flex-col gap-2">
          {menu.map((item) => (
            <div
              key={item.label}
              className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-semibold text-foreground">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              ) : null}
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
          ))}
          <div className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left">
            <span className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
              <LogOut className="size-5 text-red-500" aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm font-semibold text-red-500">Sair da conta</span>
          </div>
        </div>
      </div>

      {/* Coach — mentora explicando o perfil */}
      {showHint && !hideHint && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[50] h-72 bg-gradient-to-t from-background via-background/90 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 z-[55] px-3 pb-3">
            <div className="luna-border animate-pop animate-coach-glow relative flex items-start gap-3 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-primary/30">
              <img
                src="/images/mentor.png"
                alt="Camila"
                className="size-10 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
              />
              <div className="flex-1">
                <p className="animate-item text-pretty text-base leading-relaxed text-foreground">
                  E aqui é o seu <span className="font-bold text-primary">perfil</span>: você
                  configura seus dados pessoais, foto, bio e seus destaques. É o seu cartão de
                  visitas para os compradores.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowHint(false)
                    onDone()
                  }}
                  className="animate-cta-breathe mt-3 w-full rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
