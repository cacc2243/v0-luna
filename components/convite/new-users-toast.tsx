'use client'

import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Toast sutil de prova social na base ESQUERDA da tela /convite.
// Fica em UMA linha, discreto e leve: "+246 usuárias entraram hoje!".
// So aparece depois que os modais de entrada fecham (prop `active`).
// O numero e dinamico: comeca em 246 e sobe aos poucos, ate no maximo 311.
// ─────────────────────────────────────────────────────────────────────────────

const START_COUNT = 246
const MAX_COUNT = 311
const SHOW_DELAY_MS = 1800 // atraso apos os modais fecharem
const VISIBLE_MS = 5200 // tempo visivel em cada aparicao
const HIDDEN_MS = 9000 // intervalo entre uma aparicao e a proxima

export function NewUsersToast({ active }: { active?: boolean }) {
  const [count, setCount] = useState(START_COUNT)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (!active) return

    const clearTimers = () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }

    // Mostra o toast, mantem visivel, sai suavemente e agenda a proxima aparicao
    // com o contador incrementado (1 a 3 usuarias por ciclo, ate o maximo).
    const cycle = (delay: number) => {
      timers.current.push(
        setTimeout(() => {
          setLeaving(false)
          setVisible(true)

          timers.current.push(
            setTimeout(() => setLeaving(true), VISIBLE_MS),
          )
          timers.current.push(
            setTimeout(() => {
              setVisible(false)
              setCount((c) => Math.min(MAX_COUNT, c + 1 + Math.floor(Math.random() * 3)))
              cycle(HIDDEN_MS)
            }, VISIBLE_MS + 400),
          )
        }, delay),
      )
    }

    cycle(SHOW_DELAY_MS)
    return clearTimers
  }, [active])

  if (!active || !visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-start px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-primary/20 bg-card/90 py-2 pl-3 pr-4 shadow-lg shadow-black/20 backdrop-blur-md ${
          leaving ? 'animate-toast-leave' : 'animate-toast-enter'
        }`}
      >
        <span className="relative flex size-2 shrink-0 items-center justify-center">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        <p className="text-xs font-medium leading-none text-foreground">
          <span className="font-bold text-primary">+{count} usuárias</span> entraram hoje!
        </p>
      </div>
    </div>
  )
}
