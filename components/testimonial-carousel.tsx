type Testimonial = {
  handle: string
  city: string
  amount: string
  avatar: string
  tenure: string
}

function TestimonialCard({ handle, city, amount, avatar, tenure }: Testimonial) {
  return (
    <article className="luna-border w-[16.5rem] shrink-0 rounded-2xl bg-card p-4">
      <div className="flex items-center gap-3">
        <img
          src={avatar || '/placeholder.svg'}
          alt=""
          aria-hidden="true"
          className="size-9 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{handle}</p>
          <p className="truncate text-xs text-muted-foreground">{city}</p>
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-positive drop-shadow-[0_0_18px_oklch(0.75_0.18_155_/_0.45)]">
        {amount}
      </p>
      <p className="text-xs text-muted-foreground">por mês</p>

      <span className="mt-3 inline-flex rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[0.7rem] text-muted-foreground">
        {tenure}
      </span>
    </article>
  )
}

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  // Duplicate the list so the -50% translate loops seamlessly
  const loop = [...items, ...items]

  return (
    <div
      className="group relative overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
      }}
      aria-label="Depoimentos de usuárias"
    >
      <div className="animate-marquee flex w-max gap-3">
        {loop.map((t, i) => (
          <TestimonialCard key={`${t.handle}-${i}`} {...t} />
        ))}
      </div>
    </div>
  )
}
