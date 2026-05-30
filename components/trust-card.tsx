import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'

type TrustCardProps = {
  icon: LucideIcon
  title: string
  description: string
  items?: string[]
  highlight?: string
}

export function TrustCard({
  icon: Icon,
  title,
  description,
  items,
  highlight,
}: TrustCardProps) {
  return (
    <div className="luna-border flex items-start gap-3.5 rounded-2xl bg-card px-4 py-4">
      <div className="luna-gradient-soft flex size-11 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-5 text-primary-foreground" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <h3 className="text-pretty text-[0.95rem] font-bold leading-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1.5 text-pretty text-[0.8rem] leading-relaxed text-muted-foreground">
          {description}
        </p>

        {items && items.length > 0 && (
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-[0.8rem] leading-tight text-foreground"
              >
                <Check
                  className="size-3.5 shrink-0 text-positive"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        )}

        {highlight && (
          <p className="mt-2.5 text-pretty text-[0.8rem] font-semibold leading-relaxed text-primary">
            {highlight}
          </p>
        )}
      </div>
    </div>
  )
}
