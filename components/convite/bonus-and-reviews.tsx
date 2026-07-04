'use client'

import { BookOpen, Users, Images, Gift, Star, BadgeCheck, UserRound } from 'lucide-react'

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
    time: 'há 6 dias',
    text: 'no primeiro mês fiz R$12.700 só com packs. hoje, 3 meses depois, já passei de R$48 mil e larguei meu clt de R$1.800.',
  },
  {
    handle: '@lara_priv',
    time: 'há 2 semanas',
    text: 'na primeira semana vendi 71 packs e fechei R$6.400. o dinheiro cai na hora no meu pix, sem taxa escondida.',
  },
  {
    handle: '@drih.rs',
    time: 'há 1 mês',
    text: 'meu melhor dia foi R$2.180 em vendas. em 30 dias bati R$27 mil e continua subindo toda semana.',
  },
  {
    handle: '@nay.oficial',
    time: 'há 3 dias',
    text: 'comecei com medo, hoje faturo entre R$11 e R$15 mil por mês trabalhando do meu celular, no meu tempo.',
  },
  {
    handle: '@bibi.rezende',
    time: 'há 5 dias',
    text: 'já saquei mais de R$82 mil desde que entrei. o saque é imediato e nunca tive problema pra receber.',
  },
]

export function BonusAndReviews() {
  // Duplicamos a lista para o marquee criar um loop contínuo e infinito.
  const loopReviews = [...reviews, ...reviews]

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

        <div className="group -mx-5 overflow-hidden px-5 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="flex w-max animate-marquee gap-3">
            {loopReviews.map((r, i) => (
              <article
                key={`${r.handle}-${i}`}
                aria-hidden={i >= reviews.length}
                className="luna-border w-[80vw] max-w-[320px] shrink-0 rounded-2xl bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <UserRound className="size-5" aria-hidden="true" />
                    </span>
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
            <p className="text-xs text-foreground/70">Grátis com seu Código de Convite</p>
          </div>
        </div>

        <div className="luna-border divide-y divide-border/40 overflow-hidden rounded-2xl bg-card">
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
