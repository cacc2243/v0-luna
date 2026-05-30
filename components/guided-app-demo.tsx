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
  PiggyBank,
  X,
  Ghost,
  Plus,
  ImagePlus,
  Info,
  Loader2,
  Lightbulb,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Receipt,
  ChevronRight,
} from 'lucide-react'
import { CtaButton } from '@/components/cta-button'
import { SignupFlow } from '@/components/signup-flow'

interface GuidedAppDemoProps {
  onComplete: () => void
}

const sales = [
  { handle: '@fan_secreto', pack: 'Pack 03', amount: 89.9, purchases: '+12 compras realizadas' },
  { handle: '@serg10.tp', pack: 'Pack 07', amount: 129.9, purchases: '+28 compras realizadas' },
  { handle: '@lobo_solitario', pack: 'Pack 01', amount: 69.9, purchases: '+5 compras realizadas' },
  { handle: '@colecionador_x', pack: 'Pack 12', amount: 199.9, purchases: '+41 compras realizadas' },
]

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

const examplePhotos = [
  '/images/pack-photo-1.png',
  '/images/pack-photo-2.png',
  '/images/pack-photo-3.png',
]

export function GuidedAppDemo({ onComplete }: GuidedAppDemoProps) {
  const [phase, setPhase] = useState<
    'tour' | 'selling' | 'done' | 'packs' | 'wallet' | 'signup'
  >('tour')
  const [showSellModal, setShowSellModal] = useState(false)
  const [tourStep, setTourStep] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [packName, setPackName] = useState('Pés & Saltos')
  const [packPrice, setPackPrice] = useState('29,90')
  const [packDesc, setPackDesc] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [createdPack, setCreatedPack] = useState<string | null>(null)
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

  const scrollRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const viewsRef = useRef<HTMLDivElement>(null)
  const ordersRef = useRef<HTMLDivElement>(null)
  const animatedBalance = useCountUp(balance)
  const animatedToday = useCountUp(today)
  const highlight = phase === 'tour' ? tour[tourStep].key : null

  // O saldo pendente só existe quando há um pedido pendente aparecendo na tela.
  const pendingCount = activeSale !== null ? 1 : 0
  const pendingValue = activeSale !== null ? sales[activeSale].amount : 0

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

  // Mostra o primeiro pedido ao entrar no modo de vendas + rola para o topo
  useEffect(() => {
    if (phase !== 'selling') return
    const t = setTimeout(() => {
      setActiveSale(saleIndex)
      ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 500)
    return () => clearTimeout(t)
  }, [phase, saleIndex])

  function advanceTour() {
    if (tourStep < tour.length - 1) {
      setTourStep((s) => s + 1)
    } else {
      setPhase('selling')
    }
  }

  function acceptSale() {
    const sale = sales[saleIndex]
    setActiveSale(null)
    setBalance((b) => b + sale.amount)
    setToday((t) => t + sale.amount)
    setVendas((v) => v + 1)
    const floatId = Date.now()
    setFloats((f) => [...f, { id: floatId, amount: sale.amount }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== floatId)), 1400)

    // Notificação push estilo celular
    const toastId = floatId
    setToast({ id: toastId, amount: sale.amount })
    setTimeout(() => setToast((cur) => (cur?.id === toastId ? null : cur)), 3000)

    if (saleIndex < sales.length - 1) {
      setTimeout(() => setSaleIndex((i) => i + 1), 1100)
    } else {
      setTimeout(() => setPhase('packs'), 900)
    }
  }

  function tryRefuse() {
    setShake(true)
    setRefuseHint(true)
    setTimeout(() => setShake(false), 450)
    setTimeout(() => setRefuseHint(false), 2400)
  }

  function publishPack() {
    if (publishing) return
    setPublishing(true)
    setTimeout(() => {
      setPublishing(false)
      setShowCreate(false)
      setCreatedPack(packName.trim() || 'Pés & Saltos')
    }, 1300)
  }

  const activeTab =
    phase === 'packs'
      ? 'Packs'
      : phase === 'wallet' || phase === 'signup'
        ? 'Carteira'
        : 'Início'

  const currentSale = activeSale !== null ? sales[activeSale] : null
  const saleActive = currentSale !== null && phase === 'selling'

  const dim = (key: string) =>
  phase === 'tour' && highlight !== key
    ? 'opacity-25 blur-[1px] brightness-75 transition-all duration-300'
    : saleActive && key !== 'orders'
      ? 'opacity-25 blur-[1px] brightness-75 transition-all duration-300'
      : 'opacity-100 transition-all duration-300'

  const ring = (key: string) => (highlight === key ? 'animate-highlight' : '')

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      {/* Notificação push estilo celular */}
      {toast && (
        <div
          key={toast.id}
          className="animate-notif pointer-events-none absolute inset-x-0 top-0 z-[60] px-3 pt-3"
        >
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-md">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Ghost className="size-5 text-primary" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-bold text-foreground">Você vendeu um Pack!</p>
              <p className="text-xs text-muted-foreground">agora</p>
            </div>
            <span className="text-sm font-bold text-positive">+{brl(toast.amount)}</span>
          </div>
        </div>
      )}

      {/* Conteúdo rolável do app */}
      {phase === 'wallet' || phase === 'signup' ? (
        <WalletScreen
          onDone={() => setShowSellModal(true)}
          hideHint={phase === 'signup'}
        />
      ) : phase === 'packs' ? (
        <PacksScreen
          balance={balance}
          createdPack={createdPack}
          onCreate={() => setShowCreate(true)}
        />
      ) : (
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
        {/* Header */}
        <header
          ref={headerRef}
          className={`flex items-center justify-between gap-3 transition-opacity duration-300 ${dim('balance')}`}
        >
          <div className="flex items-center gap-2.5">
            <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-7 w-auto" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">@voce</p>
              <span className="flex items-center gap-1 text-xs text-positive">
                <span className="size-1.5 rounded-full bg-positive" />
                Online
              </span>
            </div>
          </div>
          <div
            className={`luna-border relative flex items-center gap-2 rounded-2xl bg-card px-3 py-2 transition-all duration-300 ${ring('balance')}`}
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

        {/* Saldo pendente — só aparece quando há pedido pendente */}
        {pendingCount > 0 && (
          <div className={`luna-border mt-3 flex items-center gap-3 rounded-2xl bg-card px-4 py-3 transition-all duration-300 ${saleActive ? 'opacity-25 blur-[1px] brightness-75' : 'opacity-100'}`}>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <PiggyBank className="size-5 text-primary" aria-hidden="true" />
            </span>
            <div className="flex-1 leading-tight">
              <p className="text-xs text-muted-foreground">Saldo pendente</p>
              <p className="text-xl font-bold text-primary">{brl(pendingValue)}</p>
            </div>
            <span className="rounded-full border border-primary/40 px-2.5 py-1 text-xs font-semibold text-primary">
              {pendingCount} {pendingCount === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>
        )}

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
              { tag: 'SP', text: 'alguém de São Paulo viu seu perfil', t: 'agora' },
              { tag: 'RJ', text: 'um comprador do Rio abriu seus packs', t: '1 min' },
              { tag: 'MG', text: 'visitante de BH favoritou seu perfil', t: '3 min' },
            ].map((v) => (
              <div key={v.text} className="flex items-center gap-3 border-b border-border/50 py-2 last:border-0">
                <span className="flex size-8 items-center justify-center rounded-full bg-positive/10 text-[0.65rem] font-bold text-positive">
                  {v.tag}
                </span>
                <p className="flex-1 text-pretty text-xs text-muted-foreground">{v.text}</p>
                <span className="text-[0.65rem] text-muted-foreground/70">{v.t}</span>
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
          {currentSale && phase === 'selling' && (
            <div
              key={`order-${activeSale}`}
              className={`luna-border relative z-10 mb-2 rounded-2xl bg-card px-3 py-3 ${ring('orders')} ${
                shake ? 'animate-shake' : 'animate-soft-pulse'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Bell className="size-4 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 leading-snug">
                  <p className="truncate text-[0.8rem] font-semibold text-foreground">
                    {currentSale.handle} quer {currentSale.pack}
                  </p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    agora · {currentSale.purchases}
                  </p>
                </div>
                <span className="text-sm font-bold text-positive">{brl(currentSale.amount)}</span>
              </div>

              {refuseHint && (
                <p className="mt-2 rounded-lg bg-primary/10 px-2.5 py-1.5 text-center text-[0.7rem] font-medium text-primary">
                  Aceite a venda para continuar
                </p>
              )}

              <div className="mt-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={tryRefuse}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-secondary py-2 text-[0.8rem] font-semibold text-muted-foreground transition active:scale-[0.98]"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  Recusar
                </button>
                <button
                  type="button"
                  onClick={acceptSale}
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, oklch(0.62 0.17 158) 0%, oklch(0.55 0.16 158) 100%)',
                  }}
                  className="flex flex-[1.4] items-center justify-center gap-1 rounded-lg py-2 text-[0.8rem] font-bold text-white shadow-lg shadow-positive/20 transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Check className="size-3.5" aria-hidden="true" />
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
              {sales.slice(0, vendas).map((s) => (
                <div
                  key={s.handle}
                  className="luna-border mb-2 flex items-center gap-3 rounded-2xl bg-card px-3 py-2.5"
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
          </div>
        ))}
      </nav>

      {/* Coach bar (tour) — flutua sobre o app, acima da nav */}
      {phase === 'tour' && (
        <>
          {/* Scrim escuro para dar destaque à barra da mentora */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[45] h-72"
            style={{
              background:
                'linear-gradient(to top, oklch(0 0 0 / 0.7) 0%, oklch(0 0 0 / 0.45) 45%, transparent 100%)',
            }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-20 z-[46] px-4">
            <div className="luna-border pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-[0_18px_50px_-12px_oklch(0_0_0/0.85)] ring-1 ring-primary/30">
              <img
                src="/images/mentor.png"
                alt="Camila"
                className="size-10 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
              />
            <div className="flex-1">
              <p key={tourStep} className="animate-item text-pretty text-sm leading-relaxed text-foreground">
                {tour[tourStep].text}
              </p>
              <button
                type="button"
                onClick={advanceTour}
                className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
              >
                {tourStep < tour.length - 1 ? 'Entendi, próximo' : 'Ver meu primeiro pedido'}
              </button>
            </div>
            </div>
          </div>
        </>
      )}

      {/* Modal — Criar Pack */}
      {showCreate && !createdPack && (
        <div className="absolute inset-0 z-[55] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => !publishing && setShowCreate(false)}
            aria-hidden="true"
          />
          <div className="animate-sheet-up relative flex max-h-[92%] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl">
            {/* Cabeçalho fixo */}
            <div className="shrink-0 border-b border-border/60 px-5 pb-4 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" aria-hidden="true" />
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

      {/* Overlay — Pack publicado com sucesso */}
      {createdPack && (
        <div className="absolute inset-0 z-[58] flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
          <div className="animate-pop relative w-full max-w-sm rounded-3xl border border-primary/40 bg-card p-6 text-center shadow-2xl shadow-primary/20 ring-1 ring-primary/10">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-positive/15 ring-4 ring-positive/10">
              <Check className="size-7 text-positive" aria-hidden="true" />
            </span>
            <p className="mt-4 text-lg font-bold text-foreground">Fotos publicadas com sucesso!</p>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
              Seu pack <span className="font-semibold text-primary">{createdPack}</span> foi
              publicado com sucesso e já está na vitrine.
            </p>
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-3.5 py-3 text-left">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-pretty text-[0.72rem] leading-relaxed text-foreground">
                No app real, você cria seus packs antes de começar a vender. Agora
                veja onde o seu dinheiro cai.
              </p>
            </div>
            <div className="mt-5">
              <CtaButton
                onClick={() => {
                  setCreatedPack(null)
                  setPhase('wallet')
                }}
              >
                Ver minha carteira
              </CtaButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Vamos vender de verdade? */}
      {showSellModal && phase !== 'signup' && (
        <div className="absolute inset-0 z-[58] flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-background/85 backdrop-blur-sm"
            onClick={() => setShowSellModal(false)}
            aria-hidden="true"
          />
          <div className="animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-primary/40 bg-card shadow-2xl shadow-primary/25 ring-1 ring-primary/10">
            {/* Topo com a logo da Luna */}
            <div className="flex items-center justify-center border-b border-border/60 bg-secondary/40 px-6 py-5">
              <img
                src="/images/luna-prive-logo.png"
                alt="Luna Privé"
                className="h-8 w-auto"
              />
            </div>

            <div className="px-6 pb-6 pt-5">
              {/* Mentora falando */}
              <div className="flex items-start gap-3">
                <img
                  src="/images/mentor.png"
                  alt="Camila"
                  className="size-12 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
                />
                <div className="flex-1">
                  <p className="text-pretty text-lg font-bold leading-tight text-foreground">
                    Vamos agora vender de verdade?
                  </p>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                    Você viu como é simples. Crie sua conta na{' '}
                    <span className="font-semibold text-foreground">Luna Privé</span> e comece a
                    faturar com seus packs de verdade — leva menos de 2 minutos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSellModal(false)
                  setPhase('signup')
                }}
                className="luna-gradient mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
              >
                Criar minha conta
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
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
      className={`flex flex-col items-center gap-1.5 rounded-2xl border bg-card px-2 py-3 text-center transition-all duration-300 ${
        highlighted ? 'border-primary/50' : 'border-border'
      }`}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </span>
      <span className="text-[0.65rem] text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  )
}

function PacksScreen({
  balance,
  createdPack,
  onCreate,
}: {
  balance: number
  createdPack: string | null
  onCreate: () => void
}) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto px-4 pb-6 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-7 w-auto" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">@voce</p>
            <span className="flex items-center gap-1 text-xs text-positive">
              <span className="size-1.5 rounded-full bg-positive" />
              Online
            </span>
          </div>
        </div>
        <div className="luna-border flex items-center gap-2 rounded-2xl bg-card px-3 py-2">
          <Wallet className="size-5 text-primary" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-[0.65rem] text-muted-foreground">Saldo</p>
            <p className="text-base font-bold text-foreground">{brl(balance)}</p>
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
          className={`luna-gradient flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98] ${
            createdPack ? '' : 'animate-highlight'
          }`}
        >
          <Plus className="size-4" aria-hidden="true" />
          Criar Pack
        </button>
      </div>

      {/* Vitrine */}
      {createdPack ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <article className="luna-border overflow-hidden rounded-2xl bg-card">
            <div className="aspect-square overflow-hidden">
              <img
                src="/images/pack-photo-1.png"
                alt={createdPack}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-semibold text-foreground">{createdPack}</p>
              <p className="text-sm font-bold text-positive">R$ 29,90</p>
              <p className="mt-1 flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                <Eye className="size-3" aria-hidden="true" />
                0 views · 0 vendas
              </p>
            </div>
          </article>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-card/40 px-4 py-10 text-center">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Package className="size-6 text-primary" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-foreground">Nenhum pack ainda</p>
          <p className="mt-1 text-pretty text-xs text-muted-foreground">
            Crie seu primeiro pack para aparecer na vitrine.
          </p>
        </div>
      )}
      </div>

      {/* Mentora conduzindo — popup na base */}
      {!createdPack && (
        <>
          <div
            className="absolute inset-x-0 bottom-0 z-[50] h-40 bg-gradient-to-t from-background via-background/80 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 z-[55] px-3 pb-3">
            <div className="luna-border animate-pop flex items-start gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-[0_18px_50px_-12px_oklch(0_0_0/0.85)] ring-1 ring-primary/30">
              <img
                src="/images/mentor.png"
                alt="Camila"
                className="size-11 shrink-0 rounded-full object-cover ring-2 ring-primary/40"
              />
              <p className="animate-item flex-1 text-pretty text-sm leading-relaxed text-foreground">
                Aqui é a sua vitrine! No app real, você monta seus packs{' '}
                <span className="font-bold">antes de começar a vender</span>. Toque em{' '}
                <span className="font-bold text-primary">Criar Pack</span> que eu te mostro como é
                rápido montar o seu primeiro.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const withdrawals = [
  { label: 'Saque PIX', date: 'Hoje, 14:32', amount: 4280.0 },
  { label: 'Saque PIX', date: 'Ontem, 09:10', amount: 2150.0 },
  { label: 'Saque PIX', date: '12 mai, 18:47', amount: 3890.0 },
]

function WalletScreen({ onDone, hideHint }: { onDone: () => void; hideHint?: boolean }) {
  const [showHint, setShowHint] = useState(true)
  const available = 18541.67

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto px-4 pb-6 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-7 w-auto" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">@voce</p>
              <span className="flex items-center gap-1 text-xs text-positive">
                <span className="size-1.5 rounded-full bg-positive" />
                Online
              </span>
            </div>
          </div>
          <div className="luna-border flex items-center gap-2 rounded-2xl bg-card px-3 py-2">
            <Wallet className="size-5 text-primary" aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-[0.65rem] text-muted-foreground">Saldo</p>
              <p className="text-base font-bold text-foreground">{brl(available)}</p>
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
          <p className="mt-1.5 text-4xl font-bold text-foreground">{brl(available)}</p>
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

      {/* Coach — mentora explicando a carteira */}
      {showHint && !hideHint && (
        <>
          {/* Scrim escuro que deixa o app mais opaco e dá destaque à mentora */}
          <div
            className="absolute inset-0 z-[50] bg-background/55 backdrop-blur-[1px]"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 z-[55] px-3 pb-3">
            <div className="luna-border animate-pop relative flex items-start gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-[0_18px_50px_-12px_oklch(0_0_0/0.85)] ring-1 ring-primary/30">
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
                <p className="animate-item text-pretty text-sm leading-relaxed text-foreground">
                  Essa é a sua <span className="font-bold text-primary">carteira</span>: aqui você
                  acompanha seu saldo, seus ganhos e pode transferir tudo para sua conta via PIX a
                  qualquer momento.
                </p>
                <button
                  type="button"
                  onClick={onDone}
                  className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
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
