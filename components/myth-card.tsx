import type { LucideIcon } from 'lucide-react'
import { CheckCircle2 } from 'lucide-react'

type MythCardProps = {
  icon: LucideIcon
  title: string
  description: string
}

export function MythCard({ icon: Icon, title, description }: MythCardProps) {
  return (
    <div className="luna-border flex items-start gap-3.5 rounded-2xl bg-card px-4 py-4">
      <div className="luna-gradient-soft flex size-11 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-5 text-primary-foreground" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-pretty text-[0.95rem] font-bold leading-tight text-foreground">
            {title}
          </h3>
          <CheckCircle2
            className="size-4 shrink-0 text-positive"
            aria-hidden="true"
          />
        </div>
        <p className="mt-1.5 text-pretty text-[0.8rem] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
