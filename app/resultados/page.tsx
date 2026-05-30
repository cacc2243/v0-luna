import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { PageBackground } from '@/components/page-background'
import { TestimonialCard } from '@/components/testimonial-card'

const testimonials = [
  {
    initials: 'MA',
    name: 'Marina A.',
    location: 'São Paulo, SP',
    quote: 'Em 3 meses larguei meu emprego. Hoje faturo bem mais, no meu tempo.',
    amount: 'R$ 14.200/mês',
  },
  {
    initials: 'JC',
    name: 'Júlia C.',
    location: 'Rio de Janeiro, RJ',
    quote: 'Ninguém sabe que sou eu. Posto, vendo e recebo no PIX na hora.',
    amount: 'R$ 11.800/mês',
  },
  {
    initials: 'BL',
    name: 'Bruna L.',
    location: 'Belo Horizonte, MG',
    quote: 'Comecei sem saber nada. Hoje tenho clientes fixos todo mês.',
    amount: 'R$ 10.500/mês',
  },
]

const avatars = ['LV', 'RS', 'TM', 'KP']

export default function ResultsPage() {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <PageBackground />

      <div className="relative mx-auto flex h-[100dvh] w-full max-w-md flex-col px-5 pb-6 pt-8">
        <header className="flex justify-center">
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="h-9 w-auto"
          />
        </header>

        <section className="mt-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-md">
            <TrendingUp className="size-3.5" aria-hidden="true" />
            Resultados reais
          </span>
          <h1 className="mt-4 text-balance font-sans text-[1.5rem] font-semibold leading-tight tracking-tight text-foreground">
            Mais de <span className="text-primary">1.200 usuárias</span> já faturam{' '}
            <span className="text-primary">+R$ 10 mil</span> todos os meses.
          </h1>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            Anônimas, no controle e ganhando de verdade no Luna Privé.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-3" aria-label="Depoimentos">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </section>

        <section
          className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-primary/30 bg-card/70 px-4 py-3 backdrop-blur-md"
          aria-label="Usuárias cadastradas"
        >
          <div className="flex -space-x-2.5">
            {avatars.map((a) => (
              <span
                key={a}
                className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary/25 text-[0.65rem] font-bold text-primary"
              >
                {a}
              </span>
            ))}
            <span className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-[0.6rem] font-bold text-primary-foreground">
              +1k
            </span>
          </div>
          <p className="text-pretty text-xs leading-tight text-muted-foreground">
            <span className="font-bold text-foreground">+1.200 usuárias</span>{' '}
            cadastradas e faturando
          </p>
        </section>

        <div className="mt-auto pt-6">
          <Link
            href="/cadastro"
            className="block w-full rounded-xl bg-gradient-to-b from-primary to-[oklch(0.56_0.24_10)] py-4 text-center text-base font-bold text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            Quero fazer parte
          </Link>
        </div>
      </div>
    </main>
  )
}
