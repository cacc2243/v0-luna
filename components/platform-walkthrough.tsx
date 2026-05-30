'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronLeft } from 'lucide-react'
import { CtaButton } from '@/components/cta-button'

interface WalkStep {
  icon: LucideIcon
  tag: string
  title: string
  description: string
  speech: string
  reward?: string
  highlight?: boolean
}

interface PlatformWalkthroughProps {
  steps: WalkStep[]
  finalLabel: string
  onComplete: () => void
}

export function PlatformWalkthrough({
  steps,
  finalLabel,
  onComplete,
}: PlatformWalkthroughProps) {
  const [index, setIndex] = useState(0)
  const current = steps[index]
  const Icon = current.icon
  const isLast = index === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setIndex((i) => i + 1)
    }
  }

  return (
    <div className="mt-6 flex flex-col">
      {/* Mentora */}
      <div className="animate-item flex items-center gap-3" style={{ animationDelay: '60ms' }}>
        <div className="relative">
          <img
            src="/images/mentor.png"
            alt="Camila, sua mentora no Luna Privé"
            className="size-12 rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background bg-positive" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-foreground">Camila</p>
          <p className="text-xs leading-tight text-muted-foreground">sua mentora no Luna Privé</p>
        </div>
      </div>

      {/* Fala da mentora */}
      <div
        key={`speech-${index}`}
        className="animate-item luna-border relative mt-3 rounded-2xl rounded-tl-md bg-card px-4 py-3.5"
      >
        <p className="text-pretty text-[0.92rem] leading-relaxed text-foreground">
          {current.speech}
        </p>
      </div>

      {/* Card do passo atual */}
      <div
        key={`card-${index}`}
        className={`animate-item luna-border mt-4 overflow-hidden rounded-2xl ${
          current.highlight ? 'luna-gradient-soft' : 'bg-card'
        }`}
      >
        <div className="flex items-start gap-3.5 px-4 py-4">
          <div className="luna-gradient flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_0_22px_-4px] shadow-primary/70">
            <Icon className="size-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                current.highlight
                  ? 'bg-background/30 text-primary-foreground'
                  : 'bg-primary/15 text-primary'
              }`}
            >
              Passo {index + 1} · {current.tag}
            </span>
            <h3
              className={`mt-2 text-[1.05rem] font-semibold leading-snug ${
                current.highlight ? 'text-primary-foreground' : 'text-foreground'
              }`}
            >
              {current.title}
            </h3>
            <p
              className={`mt-1 text-pretty text-[0.85rem] leading-relaxed ${
                current.highlight
                  ? 'text-primary-foreground/85'
                  : 'text-muted-foreground'
              }`}
            >
              {current.description}
            </p>
          </div>
        </div>
        {current.reward && (
          <div
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[0.82rem] font-medium ${
              current.highlight
                ? 'bg-background/25 text-primary-foreground'
                : 'bg-positive/10 text-positive'
            }`}
          >
            <Check className="size-4 shrink-0" aria-hidden="true" />
            {current.reward}
          </div>
        )}
      </div>

      {/* Progresso interno */}
      <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index
                ? 'w-5 bg-primary'
                : i < index
                  ? 'w-1.5 bg-primary/60'
                  : 'w-1.5 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Navegação */}
      <div className="mt-4 flex items-center gap-3">
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            aria-label="Voltar um passo"
            className="luna-border flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card text-foreground transition-colors active:scale-95"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
        )}
        <CtaButton onClick={handleNext} className="flex-1">
          {isLast ? finalLabel : 'Próximo'}
        </CtaButton>
      </div>
    </div>
  )
}
