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
    text: 'E quando alguém quer um pack, cai um pedido aqui. Bora? Vou te mostrar como aceitar sua primeira venda.',
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
  const [views, setViews] = useState(312)
  const [pendingCount, setPendingCount] = useState(sales.length)
  const [saleIndex, setSaleIndex] = useState(0)
  const [activeSale, setActiveSale] = useState<number | null>(null)
  const [floats, setFloats] = useState<{ id: number; amount: number }[]>([])
  const [shake, setShake] = useState(false)
  const [refuseHint, setRefuseHint] = useState(false)

  const animatedBalance = useCountUp(balance)
  const animatedToday = useCountUp(today)
  const highlight = phase === 'tour' ? tour[tourStep].key : null

  // Visualizações sobem ao vivo durante o tour e as vendas
  useEffect(() => {
    if (phase === 'done') return
    const id = setInterval(() => {
      setViews((v) => v + Math.floor(Math.random() * 7) + 2)
    }, 900)
    return () => clearInterval(id)
  }, [phase])

  // Mostra o primeiro pedido ao entrar no modo de vendas
  useEffect(() => {
    if (phase !== 'selling') return
    const t = setTimeout(() => setActiveSale(saleIndex), 700)
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
    setPendingCount((p) => p - 1)
    const floatId = Date.now()
    setFloats((f) => [...f, { id: floatId, amount: sale.amount }])
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== floatId)), 1400)

    if (saleIndex < sales.length - 1) {
      const nextIndex = saleIndex + 1
      setTimeout(() => {
        setSaleIndex(nextIndex)
        setActiveSale(nextIndex)
      }, 1100)
    } else {
      setTimeout(() => setPhase('done'), 900)
    }
  }

  function tryRefuse() {
    setShake(true)
    setRefuseHint(true)
    setTimeout(() => setShake(false), 450)
    setTimeout(() => setRefuseHint(false), 2200)
  }

  const dim = (key: string) =>
    phase === 'tour' && highlight !== key ? 'opacity-40' : 'opacity-100'
  const ring = (key: string) =>
    highlight === key
      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      : ''

  return (
    <div className="animate-screen relative mt-4 flex flex-col">
      {/* Moldura do app */}
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-2xl">
        <div className="relative max-h-[60dvh] overflow-y-auto px-4 pb-24 pt-5">
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
              <p className="text-xl font-bold text-primary">{brl(pendingCount * 100)}</p>
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

          {/* Pedidos recentes */}
          <div className={`mt-5 transition-all duration-300 ${dim('orders')}`}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShoppingBag className="size-4 text-primary" aria-hidden="true" />
                Pedidos recentes
              </h3>
              <span className="rounded-full border border-primary/40 px-2 py-0.5 text-xs font-semibold text-primary">
                {pendingCount} novos
              </span>
            </div>
            <div className={`rounded-2xl transition-all duration-300 ${ring('orders')}`}>
              {sales.slice(0, saleIndex + (phase === 'done' ? 0 : 1)).map((s, i) => {
                const accepted = i < saleIndex || phase === 'done'
                return (
                  <div
                    key={s.handle}
                    className="luna-border mb-2 flex items-center gap-3 rounded-2xl bg-card px-3 py-3"
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-muted">
                      <User className="size-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        {s.handle}
                        <BadgeCheck className="size-3.5 text-positive" aria-hidden="true" />
                      </p>
                      <p className="truncate text-xs text-muted-foreground">quer comprar {s.pack}</p>
                    </div>
                    {accepted ? (
                      <span className="flex items-center gap-1 text-sm font-bold text-positive">
                        <Check className="size-4" aria-hidden="true" />
                        {brl(s.amount)}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-primary">{brl(s.amount)}</span>
                    )}
                  </div>
                )
              })}
            </div>
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
      </div>

      {/* Coach bar (tour) */}
      {phase === 'tour' && (
        <div className="luna-border mt-4 flex items-start gap-3 rounded-2xl bg-card px-4 py-3.5">
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
      )}

      {/* Estado final */}
      {phase === 'done' && (
        <div className="animate-item mt-4 flex flex-col">
          <div className="luna-border rounded-2xl bg-card px-4 py-4 text-center">
            <p className="text-sm text-muted-foreground">Você acabou de faturar</p>
            <p className="mt-1 text-3xl font-bold text-positive">{brl(balance)}</p>
            <p className="mt-1 text-pretty text-xs text-muted-foreground">
              em poucos cliques — e isso foi só uma simulação.
            </p>
          </div>
          <div className="mt-4">
            <CtaButton onClick={onComplete}>Quero vender de verdade</CtaButton>
          </div>
        </div>
      )}

      {/* Modal de venda pendente */}
      {activeSale !== null && phase === 'selling' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div
            className={`animate-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-primary/40 bg-card shadow-2xl ${
              shake ? 'animate-shake' : ''
            }`}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <h4 className="text-sm font-bold text-foreground">Venda pendente!</h4>
              <span className="ml-auto rounded-full border border-primary/40 px-2 py-0.5 text-xs font-semibold text-primary">
                {pendingCount}
              </span>
            </div>
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/15">
                  <Bell className="size-5 text-primary" aria-hidden="true" />
                </span>
                <div className="flex-1 leading-tight">
                  <p className="text-sm font-semibold text-foreground">
                    {sales[saleIndex].handle} quer comprar
                  </p>
                  <p className="text-sm font-semibold text-foreground">{sales[saleIndex].pack}</p>
                  <p className="text-xs text-muted-foreground">agora · {sales[saleIndex].purchases}</p>
                </div>
                <span className="text-lg font-bold text-positive">{brl(sales[saleIndex].amount)}</span>
              </div>

              {refuseHint && (
                <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary">
                  Aceite a venda para continuar o tour
                </p>
              )}

              <div className="mt-4 flex gap-2.5">
                <button
                  type="button"
                  onClick={tryRefuse}
                  className="flex-1 rounded-xl border border-border bg-secondary py-3 text-sm font-semibold text-muted-foreground transition active:scale-[0.98]"
                >
                  Recusar
                </button>
                <button
                  type="button"
                  onClick={acceptSale}
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, oklch(0.62 0.21 12) 0%, oklch(0.56 0.23 9) 50%, oklch(0.5 0.22 8) 100%)',
                  }}
                  className="flex flex-[1.4] items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98]"
                >
                  <Check className="size-4" aria-hidden="true" />
                  Aceitar venda
                </button>
              </div>
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
