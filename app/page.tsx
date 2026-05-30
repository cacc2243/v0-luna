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
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-12">
        <header className="flex justify-center">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-9 w-auto"
          />
        </header>

        <section className="mt-9 text-center">
          <h1 className="text-balance font-sans text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground">
            Mais de <span className="text-primary">R$ 18.000,00</span> todo mês
            apenas com seus <span className="text-primary">PÉS</span>.
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
            100% anônimo, sem mostrar rostos ou identidade real.
          </p>
        </section>

        <section className="mt-7 flex flex-col gap-2.5" aria-label="Vendas recentes">
          {notifications.map((n) => (
            <SaleNotification
              key={n.title + n.time}
              title={n.title}
              time={n.time}
              amount={n.amount}
            />
          ))}
        </section>

        <div className="mt-7">
          <button
            type="button"
            className="w-full rounded-full bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            Entrar e ver como funciona
          </button>
          <p className="mt-4 text-center text-sm text-muted-foreground">
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
