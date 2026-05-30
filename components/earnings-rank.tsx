import { TrendingUp } from 'lucide-react'

interface EarningsRankProps {
  rank: number
  handle: string
  amount: string
  growth: string
  highlight?: boolean
}

const rankStyles: Record<number, string> = {
  1: 'bg-[oklch(0.8_0.16_85)] text-[oklch(0.25_0.05_85)]',
  2: 'bg-[oklch(0.78_0.02_280)] text-[oklch(0.25_0.02_280)]',
  3: 'bg-[oklch(0.65_0.12_50)] text-[oklch(0.22_0.05_50)]',
}

export function EarningsRank({
  rank,
  handle,
  amount,
  growth,
  highlight,
}: EarningsRankProps) {
  return (
    <div
      className={`luna-border flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        highlight
          ? 'luna-gradient-soft shadow-[0_0_24px_-6px] shadow-primary/70'
          : 'bg-card'
      }`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
          rankStyles[rank] ?? 'bg-primary/20 text-primary'
        }`}
      >
        {rank}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-sm font-semibold text-foreground">
          {handle}
        </p>
        <span className="flex items-center gap-1 text-[0.7rem] font-medium text-positive">
          <TrendingUp className="size-3" aria-hidden="true" />
          {growth}
        </span>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold leading-none text-primary">{amount}</p>
        <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          por mês
        </p>
      </div>
    </div>
  )
}
