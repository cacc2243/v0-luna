import type { LucideIcon } from 'lucide-react'

interface HowItWorksStepProps {
  number: number
  icon: LucideIcon
  title: string
  description: string
  isLast?: boolean
}

export function HowItWorksStep({
  number,
  icon: Icon,
  title,
  description,
  isLast = false,
}: HowItWorksStepProps) {
  return (
    <div className="flex gap-4">
      {/* Icon column with connecting line */}
      <div className="relative flex flex-col items-center">
        <div className="relative flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/15 shadow-[0_0_18px_-2px] shadow-primary/60">
          <Icon className="size-5 text-primary" aria-hidden="true" />
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-primary-foreground">
            {number}
          </span>
        </div>
        {!isLast && (
          <span
            className="mt-1 w-px flex-1 bg-gradient-to-b from-primary/50 to-primary/0"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Card */}
      <div className="mb-3 flex-1 rounded-2xl border border-primary/20 bg-card/70 px-4 py-3.5 backdrop-blur-md">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
