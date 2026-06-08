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
    <div className="luna-border flex flex-col rounded-2xl bg-card p-4">
      {/* Cabeçalho: ícone + título alinhados */}
      <div className="flex items-center gap-3">
        <div className="luna-gradient-soft flex size-10 shrink-0 items-center justify-center rounded-full">
          <Icon className="size-5 text-primary-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-balance text-[0.95rem] font-bold leading-tight text-foreground">
          {title}
        </h3>
      </div>

      {/* Corpo em largura total */}
      <p className="mt-3 text-pretty text-[0.825rem] leading-relaxed text-muted-foreground">
        {description}
      </p>

      {items && items.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-[0.825rem] leading-snug text-foreground"
            >
              <span
                className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-positive/15"
                aria-hidden="true"
              >
                <Check className="size-3 text-positive" />
              </span>
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      )}

      {highlight && (
        <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2.5 text-pretty text-[0.825rem] font-semibold leading-relaxed text-primary">
          {highlight}
        </p>
      )}
    </div>
  )
}
