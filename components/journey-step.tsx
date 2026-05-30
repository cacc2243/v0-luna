import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'

interface JourneyStepProps {
  number: number
  icon: LucideIcon
  tag: string
  title: string
  description: string
  reward?: string
  highlight?: boolean
  isLast?: boolean
}

export function JourneyStep({
  number,
  icon: Icon,
  tag,
  title,
  description,
  reward,
  highlight = false,
  isLast = false,
}: JourneyStepProps) {
  return (
    <div className="flex gap-3.5">
      {/* Trilha + nó do nível */}
      <div className="relative flex flex-col items-center">
        <div
          className={`relative flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_0_22px_-4px] shadow-primary/70 ${
            highlight ? 'luna-gradient' : 'luna-gradient-soft'
          }`}
        >
          <Icon className="size-5 text-primary-foreground" aria-hidden="true" />
          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-background bg-background text-[0.65rem] font-bold text-primary shadow-sm">
            {number}
          </span>
        </div>
        {!isLast && (
          <span
            className="mt-1 w-0.5 flex-1 rounded-full bg-gradient-to-b from-primary/60 to-primary/0"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Card */}
      <div
        className={`luna-border mb-3 flex-1 rounded-2xl px-4 py-3.5 ${
          highlight
            ? 'luna-gradient-soft shadow-[0_0_28px_-8px] shadow-primary/70'
            : 'bg-card'
        }`}
      >
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
            highlight
              ? 'bg-background/30 text-primary-foreground'
              : 'bg-primary/15 text-primary'
          }`}
        >
          {tag}
        </span>
        <h3
          className={`mt-2 text-[0.98rem] font-semibold leading-snug ${
            highlight ? 'text-primary-foreground' : 'text-foreground'
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-1 text-pretty text-[0.82rem] leading-relaxed ${
            highlight ? 'text-primary-foreground/85' : 'text-muted-foreground'
          }`}
        >
          {description}
        </p>
        {reward && (
          <div
            className={`mt-2.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.78rem] font-medium ${
              highlight
                ? 'bg-background/25 text-primary-foreground'
                : 'bg-positive/10 text-positive'
            }`}
          >
            <Check className="size-3.5 shrink-0" aria-hidden="true" />
            {reward}
          </div>
        )}
      </div>
    </div>
  )
}
