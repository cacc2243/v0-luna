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
  const audioCtxRef = useRef<AudioContext | null>(null)

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  // Som leve de notificação (chime suave de dois tons) gerado via Web Audio.
  const playChime = useCallback(() => {
    try {
      if (typeof window === 'undefined') return
      const Ctx =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') void ctx.resume()

      const now = ctx.currentTime
      // Volume mestre baixo para um som discreto.
      const master = ctx.createGain()
      master.gain.value = 0.06
      master.connect(ctx.destination)

      // Dois tons curtos e cristalinos (C6 -> E6) com decaimento suave.
      const notes = [
        { freq: 1046.5, start: 0, dur: 0.28 },
        { freq: 1318.5, start: 0.09, dur: 0.34 },
      ]
      for (const n of notes) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = n.freq
        const t0 = now + n.start
        gain.gain.setValueAtTime(0, t0)
        gain.gain.linearRampToValueAtTime(1, t0 + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur)
        osc.connect(gain)
        gain.connect(master)
        osc.start(t0)
        osc.stop(t0 + n.dur + 0.02)
      }
    } catch {
      // Silencia qualquer erro de áudio (ex.: política de autoplay).
    }
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
      // Som sincronizado com a entrada da notificação.
      playChime()
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
  }, [active, clearTimers, playChime])

  if (!current) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      role="region"
      aria-live="polite"
      aria-label="Atividade recente"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-primary/15 bg-card/95 px-3.5 py-3 shadow-lg shadow-primary/10 backdrop-blur-md ${
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
