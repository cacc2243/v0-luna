'use client'

import { useState, useRef } from 'react'
import { Check, BadgeCheck, Quote, Sparkles } from 'lucide-react'
import { CtaButton } from '@/components/cta-button'

interface QuizQuestion {
  tag: string
  question: string
  options: string[]
  reaction: string
}

const QUESTIONS: QuizQuestion[] = [
  {
    tag: 'Renda',
    question: 'Você já ganhou dinheiro vendendo Fotos dos Pés?',
    options: ['Sim, já vendi', 'Ainda não'],
    reaction:
      'Perfeito! Começando agora ou já com experiência, aqui você vende no automático — o Luna cuida da vitrine e dos compradores por você.',
  },
  {
    tag: 'Mercado',
    question: 'Você sabia que compradores pagam mais de R$ 450 por uma única Foto dos Pés?',
    options: ['Não fazia ideia!', 'Sim, já ouvi falar'],
    reaction:
      'Isso mesmo! Existe uma legião de compradores dispostos a pagar caro — e eles estão aqui dentro procurando conteúdo novo todos os dias.',
  },
  {
    tag: 'Velocidade',
    question:
      'Aqui no Luna o tempo médio para a primeira venda dos packs é menos de 15 minutos. Legal né?',
    options: ['Muito legal!', 'Quero começar já'],
    reaction:
      'Então bora! Seu convite de acesso está a um passo. Vou te levar pra garantir o seu agora mesmo.',
  },
]

interface MentorQuizProps {
  finalLabel: string
  onComplete: () => void
}

export function MentorQuiz({ finalLabel, onComplete }: MentorQuizProps) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationKey = useRef(0)

  const current = QUESTIONS[index]
  const isLast = index === QUESTIONS.length - 1
  const answered = selected !== null

  const handleSelect = (i: number) => {
    if (answered || isAnimating) return
    setSelected(i)
  }

  const handleNext = () => {
    if (!answered || isAnimating) return
    if (isLast) {
      onComplete()
      return
    }
    setIsAnimating(true)
    animationKey.current += 1
    setTimeout(() => {
      setIndex((n) => n + 1)
      setSelected(null)
      setIsAnimating(false)
    }, 50)
  }

  return (
    <div className="mt-8 flex flex-col">
      {/* Card da mentora */}
      <div
        className="animate-item luna-border overflow-hidden rounded-3xl bg-card"
        style={{ animationDelay: '60ms' }}
      >
        {/* Cabeçalho da mentora */}
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
          <div className="relative shrink-0">
            <img
              src="/images/mentor.png"
              alt="Camila, sua mentora no Luna Privé"
              className="size-12 rounded-full object-cover ring-2 ring-primary/40"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full border-2 border-card bg-positive" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold leading-tight text-foreground">Camila</p>
              <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
            </div>
            <p className="text-xs leading-tight text-muted-foreground">
              Mentora oficial · Luna Privé
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-positive/10 px-2.5 py-1 text-[0.65rem] font-semibold text-positive">
            <span className="size-1.5 rounded-full bg-positive" />
            online agora
          </span>
        </div>

        {/* Pergunta da mentora */}
        <div
          key={`q-${index}-${animationKey.current}`}
          className="animate-speech-enter relative px-4 py-4"
          style={{ animationDelay: '100ms' }}
        >
          <Quote className="absolute left-3 top-3 size-7 text-primary/15" aria-hidden="true" />
          <p className="relative text-pretty text-[0.95rem] font-medium leading-relaxed text-foreground">
            {current.question}
          </p>
        </div>
      </div>

      {/* Opções de resposta */}
      <div
        key={`opts-${index}-${animationKey.current}`}
        className="animate-card-enter mt-4 flex flex-col gap-2.5"
        style={{ animationDelay: '150ms' }}
        role="group"
        aria-label={current.question}
      >
        <span className="inline-flex w-fit items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
          Pergunta {index + 1} · {current.tag}
        </span>

        {current.options.map((option, i) => {
          const isChosen = selected === i
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={answered}
              aria-pressed={isChosen}
              className={`luna-border flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.99] disabled:cursor-default ${
                isChosen
                  ? 'luna-gradient text-primary-foreground shadow-[0_0_22px_-6px] shadow-primary/70'
                  : answered
                    ? 'bg-card text-muted-foreground opacity-55'
                    : 'bg-card text-foreground hover:border-primary/60'
              }`}
            >
              <span className="text-[0.92rem] font-semibold">{option}</span>
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isChosen
                    ? 'border-transparent bg-background/25 text-primary-foreground'
                    : 'border-border text-transparent'
                }`}
                aria-hidden="true"
              >
                <Check className="size-4" />
              </span>
            </button>
          )
        })}
      </div>

      {/* Reação da mentora após responder */}
      {answered && (
        <div
          key={`reaction-${index}-${selected}`}
          className="animate-card-enter luna-gradient-soft luna-border mt-3 flex items-start gap-2.5 rounded-2xl px-4 py-3.5"
        >
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-pretty text-[0.85rem] leading-relaxed text-foreground">
            {current.reaction}
          </p>
        </div>
      )}

      {/* Progresso */}
      <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
        {QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-5 bg-primary' : i < index ? 'w-1.5 bg-primary/60' : 'w-1.5 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-4">
        <CtaButton onClick={handleNext} disabled={!answered || isAnimating}>
          {isLast ? finalLabel : 'Próximo'}
        </CtaButton>
        {!answered && (
          <p className="mt-2.5 text-center text-xs text-muted-foreground">
            Escolha uma opção para continuar
          </p>
        )}
      </div>
    </div>
  )
}
