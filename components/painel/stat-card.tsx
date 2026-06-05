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
}

export function StatCard({
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/15',
  value,
  label,
  sublabel,
}: StatCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <div className={cn('mb-3 flex size-9 items-center justify-center rounded-xl', iconBg)}>
        <Icon className={cn('size-[1.1rem]', iconColor)} />
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
      {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  )
}
