'use client'

import { BookOpen, Users, Images, Gift, Star, BadgeCheck } from 'lucide-react'

const bonuses = [
  {
    icon: BookOpen,
    title: 'Guia: Como faturar R$10 mil',
    description:
      'Estratégias reais de quem já vende na plataforma. Passo a passo para suas primeiras vendas.',
  },
  {
    icon: Users,
    title: 'Acesso à Comunidade VIP',
    description:
      'Grupo exclusivo com dicas, suporte e troca de experiências entre vendedoras.',
  },
  {
    icon: Images,
    title: 'Pack de Poses Profissionais',
    description:
      '30 poses que mais vendem, com guia visual de ângulos, iluminação e cenários.',
  },
]

const reviews = [
  {
    handle: '@gabi.m_santos',
    avatar: '/images/avatar-1.png',
    time: 'há 6 dias',
    text: 'em 3 meses fechei R$32 mil. larguei meu emprego clt e hoje vivo só disso, com muito mais paz.',
  },
  {
    handle: '@lara_priv',
    avatar: '/images/avatar-2.png',
    time: 'há 2 semanas',
    text: 'achei que não ia dar certo, mas na primeira semana já tinha vendido 4 packs. recomendo demais.',
  },
  {
    handle: '@drih.rs',
    avatar: '/images/avatar-4.png',
    time: 'há 1 mês',
    text: 'o suporte é o que mais me surpreendeu. me ajudaram a montar tudo e já estou faturando.',
  },
]

export function BonusAndReviews() {
  return (
    <div className="flex flex-col gap-8">
      {/* Depoimentos */}
      <section aria-labelledby="depoimentos">
        <h2
          id="depoimentos"
          className="mb-3 flex items-center gap-2 px-1 text-sm font-bold text-foreground"
        >
          <Star className="size-4 text-primary" aria-hidden="true" />
          O que nossas Lunas falam
        </h2>

        <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reviews.map((r) => (
            <article
              key={r.handle}
              className="luna-border-soft w-[85%] shrink-0 snap-center rounded-2xl bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={r.avatar || '/placeholder.svg'}
                    alt=""
                    className="size-9 rounded-full object-cover"
                  />
                  <div className="leading-tight">
                    <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      {r.handle}
                      <BadgeCheck className="size-3.5 text-positive" aria-hidden="true" />
                    </p>
                    <p className="text-[0.7rem] text-muted-foreground">Usuária verificada</p>
                  </div>
                </div>
                <span className="text-[0.7rem] text-muted-foreground">{r.time}</span>
              </div>
              <p className="mt-3 text-pretty text-sm leading-relaxed text-foreground">
                &ldquo;{r.text}&rdquo;
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Bônus incluído */}
      <section aria-labelledby="bonus">
        <div className="mb-3 flex items-center gap-3 px-1">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Gift className="size-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <h2 id="bonus" className="text-sm font-bold text-foreground">
              Bônus incluído
            </h2>
            <p className="text-xs text-muted-foreground">Grátis com seu convite</p>
          </div>
        </div>

        <div className="luna-border-soft divide-y divide-border/40 overflow-hidden rounded-2xl bg-card">
          {bonuses.map((b) => (
            <div key={b.title} className="flex items-start gap-3 px-4 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <b.icon className="size-4" aria-hidden="true" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{b.title}</p>
                <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                  {b.description}
                </p>
                <p className="mt-1.5 text-[0.7rem] font-semibold text-primary">
                  Incluso no Luna Privé
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
