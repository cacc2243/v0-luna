import { ShieldCheck, Lock, Zap } from 'lucide-react'
import { SaleNotification } from '@/components/sale-notification'

const notifications = [
  { title: 'Você vendeu o Pack 03', time: 'agora', amount: '+R$197,00' },
  { title: 'Você vendeu o Pack 07', time: '2 min atrás', amount: '+R$149,00' },
  { title: 'Você vendeu o Pack 12', time: '5 min atrás', amount: '+R$249,00' },
  { title: 'Presente Recebido', time: '8 min atrás', amount: '+R$1.300,00' },
]

export default function Page() {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/images/background.png"
          alt=""
          className="size-full object-cover"
        />
        {/* Readability overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background/95" />
        <div className="absolute inset-0 bg-background/30" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-10 pt-12">
        <header className="flex justify-center">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-14 w-auto"
          />
        </header>

        <section className="mt-10 text-center">
          <h1 className="text-balance font-sans text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground">
            Mais de <span className="text-primary">R$ 18.000,00</span> todo mês
            apenas com seus <span className="text-primary">PÉS</span>.
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            100% anônimo, sem mostrar rostos ou identidade real.
          </p>
        </section>

        <section className="mt-8" aria-label="Vendas recentes">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vendas em tempo real
            </h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-positive">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-positive" />
              </span>
              ao vivo
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {notifications.map((n) => (
              <SaleNotification
                key={n.title + n.time}
                title={n.title}
                time={n.time}
                amount={n.amount}
              />
            ))}
          </div>
        </section>

        <div className="mt-8">
          <button
            type="button"
            className="w-full rounded-xl bg-gradient-to-b from-primary to-[oklch(0.6_0.22_8)] py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            Entrar e ver como funciona
          </button>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-positive" aria-hidden="true" />
              Sem rosto
            </span>
            <span className="size-1 rounded-full bg-muted-foreground/40" />
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-positive" aria-hidden="true" />
              Sem nome
            </span>
            <span className="size-1 rounded-full bg-muted-foreground/40" />
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-positive" aria-hidden="true" />
              Só PIX
            </span>
          </div>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Já tem sua conta?{' '}
            <button
              type="button"
              className="font-medium text-foreground/80 underline-offset-4 hover:underline"
            >
              Toque para entrar...
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
