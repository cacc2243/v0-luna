'use client'

import { useState, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronLeft, BadgeCheck, Quote } from 'lucide-react'
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
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isAnimating, setIsAnimating] = useState(false)
  const animationKey = useRef(0)
  
  const current = steps[index]
  const Icon = current.icon
  const isLast = index === steps.length - 1

  const handleNext = () => {
    if (isAnimating) return
    if (isLast) {
      onComplete()
    } else {
      setIsAnimating(true)
      setDirection('forward')
      animationKey.current += 1
      setTimeout(() => {
        setIndex((i) => i + 1)
        setIsAnimating(false)
      }, 50)
    }
  }

  const handlePrev = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setDirection('backward')
    animationKey.current += 1
    setTimeout(() => {
      setIndex((i) => i - 1)
      setIsAnimating(false)
    }, 50)
  }

  const slideClass = direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'

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
              <p className="text-sm font-semibold leading-tight text-foreground">
                Camila
              </p>
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

        {/* Fala da mentora */}
        <div 
          key={`speech-${index}-${animationKey.current}`} 
          className="animate-speech-enter relative px-4 py-4"
          style={{ animationDelay: '100ms' }}
        >
          <Quote
            className="absolute left-3 top-3 size-7 text-primary/15"
            aria-hidden="true"
          />
          <p className="relative text-pretty text-[0.95rem] leading-relaxed text-foreground">
            {current.speech}
          </p>
        </div>
      </div>

      {/* Card do passo atual */}
      <div
        key={`card-${index}-${animationKey.current}`}
        className={`animate-card-enter luna-border mt-4 overflow-hidden rounded-2xl ${
          current.highlight ? 'luna-gradient-soft' : 'bg-card'
        }`}
        style={{ animationDelay: '150ms' }}
      >
        <div className="flex items-start gap-3.5 px-4 py-4">
          <div 
            className={`luna-gradient flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_0_22px_-4px] shadow-primary/70 ${slideClass}`}
            style={{ animationDelay: '200ms' }}
          >
            <Icon className="size-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <div className={`flex-1 ${slideClass}`} style={{ animationDelay: '180ms' }}>
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
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[0.82rem] font-medium ${slideClass} ${
              current.highlight
                ? 'bg-background/25 text-primary-foreground'
                : 'bg-positive/10 text-positive'
            }`}
            style={{ animationDelay: '220ms' }}
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
            onClick={handlePrev}
            disabled={isAnimating}
            aria-label="Voltar um passo"
            className="luna-border flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card text-foreground transition-all active:scale-95 disabled:opacity-50"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
        )}
        <CtaButton onClick={handleNext} disabled={isAnimating} className="flex-1">
          {isLast ? finalLabel : 'Próximo'}
        </CtaButton>
      </div>
    </div>
  )
}
