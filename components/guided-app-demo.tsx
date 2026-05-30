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
} from 'lucide-react'
import { CtaButton } from '@/components/cta-button'

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

export function GuidedAppDemo({ onComplete }: GuidedAppDemoProps) {
  const [phase, setPhase] = useState<'tour' | 'selling' | 'done'>('tour')
  const [tourStep, setTourStep] = useState(0)
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
  const ordersRef = useRef<HTMLDivElement>(null)
  const animatedBalance = useCountUp(balance)
  const animatedToday = useCountUp(today)
  const highlight = phase === 'tour' ? tour[tourStep].key : null

  const pendingCount = sales.length - vendas
  const pendingValue = sales.slice(vendas).reduce((sum, s) => sum + s.amount, 0)

  // Visualizações sobem ao vivo durante o tour e as vendas
  useEffect(() => {
    if (phase === 'done') return
    const id = setInterval(() => {
      setViews((v) => v + Math.floor(Math.random() * 7) + 2)
    }, 900)
    return () => clearInterval(id)
  }, [phase])

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
      setTimeout(() => setPhase('done'), 900)
    }
  }

  function tryRefuse() {
    setShake(true)
    setRefuseHint(true)
    setTimeout(() => setShake(false), 450)
    setTimeout(() => setRefuseHint(false), 2400)
  }

  const dim = (key: string) =>
    phase === 'tour' && highlight !== key ? 'opacity-40' : 'opacity-100'
  const ring = (key: string) =>
    highlight === key
      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      : ''

  const currentSale = activeSale !== null ? sales[activeSale] : null

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
        {/* Header */}
        <header
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
          className={`mt-4 grid grid-cols-3 gap-2.5 transition-all duration-300 ${dim('stats')} ${
            highlight === 'stats' ? 'scale-[1.01]' : ''
          }`}
        >
          <StatCard icon={CalendarDays} label="Hoje" value={brl(animatedToday)} highlighted={highlight === 'stats'} />
          <StatCard icon={Eye} label="Views" value={String(views)} highlighted={highlight === 'stats'} />
          <StatCard icon={ShoppingBag} label="Vendas" value={String(vendas)} highlighted={highlight === 'stats'} />
        </div>

        {/* Saldo pendente */}
        <div className="luna-border mt-3 flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <PiggyBank className="size-5 text-primary" aria-hidden="true" />
          </span>
          <div className="flex-1 leading-tight">
            <p className="text-xs text-muted-foreground">Saldo pendente</p>
            <p className="text-xl font-bold text-primary">{brl(pendingValue)}</p>
          </div>
          <span className="rounded-full border border-primary/40 px-2.5 py-1 text-xs font-semibold text-primary">
            {pendingCount} pedidos
          </span>
        </div>

        {/* Visualizações recentes */}
        <div className={`mt-5 transition-all duration-300 ${dim('views')}`}>
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
          <div className="mb-2 flex items-center justify-between">
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
              className={`luna-border animate-pop mb-2 rounded-2xl bg-card px-3 py-3 ${ring('orders')} ${
                shake ? 'animate-shake' : ''
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
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                Seus pedidos aparecem aqui.
              </p>
            </div>
          ) : (
            <div>
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

      {/* Bottom nav */}
      <nav className="flex items-center justify-around border-t border-border bg-card/80 px-2 pb-3 pt-2 backdrop-blur">
        {[
          { icon: Home, label: 'Início', active: true },
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
                className={`size-5 ${item.active ? 'text-primary' : 'text-muted-foreground'}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`text-[0.6rem] ${
                item.active ? 'font-semibold text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Coach bar (tour) — flutua sobre o app, acima da nav */}
      {phase === 'tour' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 px-4">
          <div className="luna-border pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-card/95 px-4 py-3.5 shadow-2xl backdrop-blur">
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
      )}

      {/* Estado final — overlay dentro do app */}
      {phase === 'done' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
          <div className="animate-pop relative w-full max-w-sm rounded-3xl border border-positive/40 bg-card p-6 text-center shadow-2xl">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-positive/15">
              <Check className="size-7 text-positive" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm text-muted-foreground">Você acabou de faturar</p>
            <p className="mt-1 text-4xl font-bold text-positive">{brl(balance)}</p>
            <p className="mt-2 text-pretty text-xs text-muted-foreground">
              em poucos cliques — e isso foi só uma simulação.
            </p>
            <div className="mt-6">
              <CtaButton onClick={onComplete}>Quero vender de verdade</CtaButton>
            </div>
          </div>
        </div>
      )}
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
