interface SaleNotificationProps {
  title: string
  time: string
  amount: string
}

export function SaleNotification({ title, time, amount }: SaleNotificationProps) {
  return (
    <div className="luna-border flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 shadow-[0_0_20px_-6px] shadow-primary/40">
      <div className="luna-gradient-soft flex size-10 shrink-0 items-center justify-center rounded-full shadow-[0_0_16px_-2px] shadow-primary/60">
        <img
          src="/images/luna-icon.png"
          alt=""
          aria-hidden="true"
          className="size-7 object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>

      <p className="shrink-0 text-sm font-bold text-primary">{amount}</p>
    </div>
  )
}
