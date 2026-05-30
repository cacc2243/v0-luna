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
    <div className="flex gap-3.5">
      {/* Icon column with connecting line */}
      <div className="relative flex flex-col items-center">
        <div className="luna-gradient-soft relative flex size-11 shrink-0 items-center justify-center rounded-full shadow-[0_0_20px_-2px] shadow-primary/70">
          <Icon className="size-5 text-primary-foreground" aria-hidden="true" />
          <span className="luna-gradient absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-[0.65rem] font-bold text-primary-foreground shadow-[0_0_10px_-1px] shadow-primary">
            {number}
          </span>
        </div>
        {!isLast && (
          <span
            className="mt-1.5 w-px flex-1 bg-gradient-to-b from-primary/60 to-primary/0"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Card */}
      <div className="luna-border flex-1 rounded-2xl bg-card/70 px-4 py-3 backdrop-blur-md">
        <h3 className="text-[0.95rem] font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-pretty text-[0.8rem] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
