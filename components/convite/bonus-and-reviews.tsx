'use client'

import { Star, BadgeCheck } from 'lucide-react'

const reviews = [
  {
    handle: '@gabi.m_santos',
    time: 'há 6 dias',
    avatar: '/images/avatar-1.png',
    text: 'no primeiro mês fiz R$12.700 só com packs. hoje, 3 meses depois, já passei de R$48 mil e larguei meu clt de R$1.800.',
  },
  {
    handle: '@lara_priv',
    time: 'há 2 semanas',
    avatar: '/images/avatar-2.png',
    text: 'na primeira semana vendi 71 packs e fechei R$6.400. o dinheiro cai na hora no meu pix, sem taxa escondida.',
  },
  {
    handle: '@drih.rs',
    time: 'há 1 mês',
    avatar: '/images/avatar-3.png',
    text: 'meu melhor dia foi R$2.180 em vendas. em 30 dias bati R$27 mil e continua subindo toda semana.',
  },
  {
    handle: '@nay.oficial',
    time: 'há 3 dias',
    avatar: '/images/avatar-4.png',
    text: 'comecei com medo, hoje faturo entre R$11 e R$15 mil por mês trabalhando do meu celular, no meu tempo.',
  },
  {
    handle: '@bibi.rezende',
    time: 'há 5 dias',
    avatar: '/images/avatar-5.png',
    text: 'já saquei mais de R$82 mil desde que entrei. o saque é imediato e nunca tive problema pra receber.',
  },
]

export function BonusAndReviews({ middleSlot }: { middleSlot?: React.ReactNode }) {
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
          Resultados reais de usuárias:
        </h2>

        <div className="group -mx-5 overflow-hidden px-5 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="flex w-max animate-marquee gap-3">
            {loopReviews.map((r, i) => (
              <article
                key={`${r.handle}-${i}`}
                aria-hidden={i >= reviews.length}
                className="luna-border-soft w-[80vw] max-w-[320px] shrink-0 rounded-2xl bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-primary/25">
                      <img
                        src={r.avatar || '/placeholder.svg'}
                        alt=""
                        aria-hidden="true"
                        className="size-full scale-110 object-cover blur-[5px]"
                      />
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

      {/* Conteúdo intermediário (ex.: card de suporte) */}
      {middleSlot}
    </div>
  )
}
