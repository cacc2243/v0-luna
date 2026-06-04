'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { SaleNotification } from '@/components/sale-notification'

interface SaleItem {
  title: string
  time: string
  amount: string
}

interface AnimatedSalesFeedProps {
  notifications: SaleItem[]
  /** atraso antes da primeira notificação (ms) */
  startDelay?: number
  /** intervalo entre cada notificação (ms) */
  stagger?: number
  /** conteúdo revelado após a última notificação (ex.: botão) */
  footer: ReactNode
  /** controla se as animações devem iniciar */
  shouldAnimate?: boolean
}

export function AnimatedSalesFeed({
  notifications,
  startDelay = 300,
  stagger = 700,
  footer,
  shouldAnimate = true,
}: AnimatedSalesFeedProps) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [showFooter, setShowFooter] = useState(false)

  useEffect(() => {
    // Não inicia animações se shouldAnimate for false
    if (!shouldAnimate) return

    const timers: ReturnType<typeof setTimeout>[] = []

    notifications.forEach((_, i) => {
      timers.push(
        setTimeout(() => setVisibleCount(i + 1), startDelay + i * stagger),
      )
    })

    timers.push(
      setTimeout(
        () => setShowFooter(true),
        startDelay + notifications.length * stagger + 250,
      ),
    )

    return () => timers.forEach(clearTimeout)
  }, [notifications, startDelay, stagger, shouldAnimate])

  return (
    <>
      <section className="mt-6" aria-label="Vendas recentes">
        <div className="flex flex-col gap-2.5">
          {notifications.map((n, i) => (
            <div
              key={n.title + n.time}
              className={
                i < visibleCount
                  ? 'animate-notification-in'
                  : 'pointer-events-none h-0 overflow-hidden opacity-0'
              }
            >
              <SaleNotification title={n.title} time={n.time} amount={n.amount} />
            </div>
          ))}
        </div>
      </section>

      <div
        className={
          showFooter
            ? 'animate-notification-in mt-7'
            : 'pointer-events-none mt-7 h-0 overflow-hidden opacity-0'
        }
        aria-hidden={!showFooter}
      >
        {footer}
      </div>
    </>
  )
}
