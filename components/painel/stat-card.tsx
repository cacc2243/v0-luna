'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  value: string
  label: string
  sublabel?: string
  accent?: boolean
}

export function StatCard({
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/15',
  value,
  label,
  sublabel,
  accent = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition-colors',
        accent
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card hover:border-border/80',
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn('flex size-9 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('size-[1.1rem]', iconColor)} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
      {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  )
}
