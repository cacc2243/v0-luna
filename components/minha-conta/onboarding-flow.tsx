'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { InstallAppGuide } from '@/components/confirmation/install-app-guide'

interface OnboardingFlowProps {
  onClose: () => void
}

interface Step {
  emoji: string
  title: string
  description: string
  items: string[]
  cta: string
  // Quando true, o passo mostra o guia de instalacao do app (PWA) em vez
  // da lista de itens numerados.
  install?: boolean
}

const STEPS: Step[] = [
  {
    emoji: '💗',
    title: 'Bem-vinda à Luna Privé',
    description: 'Aqui você vende seus packs para uma vitrine com milhares de compradores ativos.',
    items: [
      'Navegue até a aba Packs e crie seus packs de fotos para venda',
      'Seus packs serão adicionados a uma vitrine com 60 mil+ compradores ativos',
      'As vendas podem começar a acontecer em poucos minutos!',
    ],
    cta: 'Continuar',
  },
  {
    emoji: '✨',
    title: 'Complete seu perfil',
    description: 'Um perfil completo atrai mais compradores e gera mais vendas.',
    items: [
      'Na aba Perfil, adicione uma foto ou ícone que represente você',
      'Escreva uma descrição atraente sobre seu conteúdo',
      'Preencha sua idade — compradores valorizam perfis completos',
    ],
    cta: 'Continuar',
  },
  {
    emoji: '🏠',
    title: 'Sua tela inicial',
    description: 'Na aba Início você acompanha tudo que acontece na sua conta.',
    items: [
      'Veja seus pedidos pendentes e aceite vendas em tempo real',
      'Acompanhe quem está visualizando seus packs',
      'Confira seu saldo e histórico na aba Carteira',
    ],
    cta: 'Continuar',
  },
  {
    emoji: '',
    title: 'Instale o app no celular',
    description:
      'Instale a Luna Privé na tela de início e receba uma notificação a cada venda — mesmo com o celular bloqueado.',
    items: [],
    cta: 'Começar agora',
    install: true,
  },
]

export function OnboardingFlow({ onClose }: OnboardingFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  function next() {
    if (isLast) {
      onClose()
      return
    }
    setStepIndex((i) => i + 1)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="animate-pop relative flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl shadow-primary/20">
        <div className="flex flex-col overflow-y-auto px-6 pb-7 pt-6">
          {/* Indicador de progresso */}
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIndex ? 'w-7 bg-primary' : 'w-4 bg-muted'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Logo */}
          <img
            src="/images/luna-prive-logo.png"
            alt="Luna Privé"
            className="mx-auto mt-6 h-10 w-auto"
          />

          {/* Título + descrição */}
          <h2
            id="onboarding-title"
            className="mt-6 text-balance text-2xl font-bold leading-tight text-foreground"
          >
            {step.title} {step.emoji}
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          {/* Passo de instalacao: mostra o guia do app (PWA) com passos por plataforma */}
          {step.install ? (
            <InstallAppGuide className="mt-6" />
          ) : (
            /* Itens numerados */
            <ul className="mt-6 flex flex-col gap-4">
              {step.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-pretty text-sm leading-relaxed text-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Botão de ação */}
          <button
            type="button"
            onClick={next}
            className="luna-gradient mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            {step.cta}
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          {/* Contador de passos */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Passo {stepIndex + 1} de {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  )
}
