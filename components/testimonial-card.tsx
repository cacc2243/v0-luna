import { Quote } from 'lucide-react'

interface TestimonialCardProps {
  initials: string
  name: string
  location: string
  quote: string
  amount: string
}

export function TestimonialCard({
  initials,
  name,
  location,
  quote,
  amount,
}: TestimonialCardProps) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-card/70 p-3.5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary shadow-[0_0_16px_-3px] shadow-primary/70">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{location}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
          {amount}
        </span>
      </div>
      <p className="mt-2.5 flex gap-1.5 text-pretty text-[0.8rem] leading-relaxed text-muted-foreground">
        <Quote className="mt-0.5 size-3 shrink-0 text-primary/60" aria-hidden="true" />
        {quote}
      </p>
    </div>
  )
}
