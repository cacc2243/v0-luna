'use client'

import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Toast sutil de prova social na base da tela /convite.
// Fica em UMA linha, discreto e leve: "+246 usuárias entraram hoje!".
// Aparece após um pequeno atraso e some sozinho depois de alguns segundos.
// ─────────────────────────────────────────────────────────────────────────────

const SHOW_DELAY_MS = 2400
const VISIBLE_MS = 6000

export function NewUsersToast() {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const enter = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    const startLeave = setTimeout(() => setLeaving(true), SHOW_DELAY_MS + VISIBLE_MS)
    const remove = setTimeout(() => setVisible(false), SHOW_DELAY_MS + VISIBLE_MS + 400)
    return () => {
      clearTimeout(enter)
      clearTimeout(startLeave)
      clearTimeout(remove)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
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
          <span className="font-bold text-primary">+246 usuárias</span> entraram hoje!
        </p>
      </div>
    </div>
  )
}
