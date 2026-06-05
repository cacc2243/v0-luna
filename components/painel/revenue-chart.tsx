'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatBRL, type TimeBucket } from '@/lib/painel/metrics'

export function RevenueChart({ data }: { data: TimeBucket[] }) {
  const hasData = useMemo(() => data.some((d) => d.revenue > 0 || d.signups > 0), [data])

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-border)"
            opacity={0.4}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip
            cursor={{ stroke: 'var(--color-primary)', strokeOpacity: 0.2, strokeWidth: 2 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as TimeBucket
              return (
                <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-xl">
                  <p className="mb-1 text-xs font-semibold text-popover-foreground">{label}</p>
                  <p className="text-sm font-bold text-primary">{formatBRL(d.revenue)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {d.paid} pago{d.paid === 1 ? '' : 's'} · {d.signups} cadastro
                    {d.signups === 1 ? '' : 's'}
                  </p>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fill="url(#revFill)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-primary)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {!hasData && (
        <p className="-mt-32 text-center text-sm text-muted-foreground">
          Sem movimentação no período
        </p>
      )}
    </div>
  )
}
