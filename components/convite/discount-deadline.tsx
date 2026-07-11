'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Informe de desconto por tempo limitado.
 *
 * Regra de negócio:
 * - O horário-limite é SEMPRE 2 horas a mais que a hora atual no fuso de
 *   Brasília (America/Sao_Paulo).
 * - A data exibida é o dia atual (também em Brasília).
 *
 * Como o valor depende da hora atual do cliente, o cálculo é feito após a
 * montagem (evita mismatch de hidratação entre servidor e cliente).
 */
function getBrasiliaDeadline(): { time: string; day: string } {
  const now = new Date()
  const plus2 = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(plus2)

  const day = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
  }).format(now)

  return { time, day }
}

export function DiscountDeadline({ className = '' }: { className?: string }) {
  const [deadline, setDeadline] = useState<{ time: string; day: string } | null>(null)

  useEffect(() => {
    setDeadline(getBrasiliaDeadline())
  }, [])

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 ${className}`}
    >
      <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="text-xs font-medium leading-none text-foreground">
        Desconto válido até{' '}
        <span className="font-bold tabular-nums text-primary">
          {deadline ? `${deadline.time}h` : '--:--'}
        </span>{' '}
        do dia{' '}
        <span className="font-bold tabular-nums text-primary">{deadline ? deadline.day : '--/--'}</span>
      </span>
    </div>
  )
}
