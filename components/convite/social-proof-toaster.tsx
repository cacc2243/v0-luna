'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Notificações de prova social no topo da tela /convite.
// Aparecem em loop (uma de cada vez) depois que o modal de convite é fechado.
// Estilo idêntico ao toaster do /minha-conta: card escuro arredondado, ícone
// circular com a logo (fantasminha) à esquerda e valor destacado em verde.
// ─────────────────────────────────────────────────────────────────────────────

type Kind = 'withdraw' | 'gift'

type ToastData = {
  key: string
  username: string
  kind: Kind
  amount: number
}

const DISPLAY_MS = 4200
const GAP_MS = 2600
const FIRST_DELAY_MS = 1200

// Nomes de usuária no estilo @arroba para dar realismo.
const USERNAMES = [
  'mari.silva_',
  'ju.almeida',
  'bibi.rocha',
  'lala.martins',
  'nay.oliveira',
  'duda.costa_',
  're.fernandes',
  'gabi.souza',
  'isa.lima_',
  'lari.moraes',
  'thay.ribeiro',
  'pa.cardoso',
]

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function randomInRange(min: number, max: number) {
  // Valores "redondos" terminando em ,00 dão sensação mais natural de saque/presente
  const value = Math.random() * (max - min) + min
  return Math.round(value)
}

function buildToast(): ToastData {
  const username = USERNAMES[Math.floor(Math.random() * USERNAMES.length)]
  const isWithdraw = Math.random() < 0.55
  if (isWithdraw) {
    return {
      key: `${Date.now()}-${Math.random()}`,
      username,
      kind: 'withdraw',
      amount: randomInRange(2880, 3880),
    }
  }
  return {
    key: `${Date.now()}-${Math.random()}`,
    username,
    kind: 'gift',
    amount: randomInRange(380, 690),
  }
}

interface SocialProofToasterProps {
  active: boolean
}

export function SocialProofToaster({ active }: SocialProofToasterProps) {
  const [current, setCurrent] = useState<ToastData | null>(null)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => {
    if (!active) {
      clearTimers()
      setCurrent(null)
      setLeaving(false)
      return
    }

    // Agenda: mostra -> espera DISPLAY_MS -> sai -> espera GAP_MS -> mostra próximo
    function showOne() {
      setLeaving(false)
      setCurrent(buildToast())
      const hide = setTimeout(() => {
        setLeaving(true)
        const next = setTimeout(() => {
          setCurrent(null)
          const again = setTimeout(showOne, GAP_MS)
          timers.current.push(again)
        }, 360)
        timers.current.push(next)
      }, DISPLAY_MS)
      timers.current.push(hide)
    }

    const first = setTimeout(showOne, FIRST_DELAY_MS)
    timers.current.push(first)

    return () => clearTimers()
  }, [active, clearTimers])

  if (!current) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      role="region"
      aria-live="polite"
      aria-label="Atividade recente"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-card/95 px-3.5 py-3 shadow-xl shadow-black/40 backdrop-blur-md ${
          leaving ? 'animate-toast-leave' : 'animate-toast-enter'
        }`}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
          <img
            src="/images/luna-icon.png"
            alt="Luna Privé"
            className="size-6 object-contain"
          />
        </span>

        <p className="min-w-0 flex-1 text-pretty text-sm leading-snug text-foreground">
          <span className="font-semibold">@{current.username}</span>{' '}
          {current.kind === 'withdraw' ? (
            <>acabou de sacar </>
          ) : (
            <>acabou de receber um presente no valor de </>
          )}
          <span className="font-bold text-emerald-400">{brl(current.amount)}</span>
        </p>
      </div>
    </div>
  )
}
