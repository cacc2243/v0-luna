interface SaleNotificationProps {
  title: string
  time: string
  amount: string
}

export function SaleNotification({ title, time, amount }: SaleNotificationProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3.5 backdrop-blur-md">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15">
        <img
          src="/images/luna-icon.png"
          alt=""
          aria-hidden="true"
          className="size-6 object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>

      <p className="shrink-0 text-sm font-bold text-positive">{amount}</p>
    </div>
  )
}
