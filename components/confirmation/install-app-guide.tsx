'use client'

import { useEffect, useState } from 'react'
import { Share, Plus, MoreVertical, Download, BellRing, Smartphone, Check } from 'lucide-react'

type Platform = 'ios' | 'android' | 'desktop'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/**
 * Explica, na tela de confirmacao, como instalar o app (PWA) na tela de inicio
 * do celular. Instalar e o que permite receber as notificacoes de venda mesmo
 * com o app fechado e a tela bloqueada (obrigatorio no iPhone).
 */
export function InstallAppGuide({ className = 'mt-5' }: { className?: string }) {
  const [platform, setPlatform] = useState<Platform>('desktop')
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    setPlatform(detectPlatform())
    setInstalled(isStandalone())
  }, [])

  // Ja esta rodando como app instalado: nao precisa mostrar o guia.
  if (installed) {
    return (
      <div className={`${className} flex w-full items-center gap-2.5 rounded-2xl border border-positive/30 bg-positive/10 px-4 py-3 text-left`}>
        <Check className="size-5 shrink-0 text-positive" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-foreground">
          <strong className="font-bold">App instalado!</strong> Você já pode receber os alertas de
          venda direto no seu celular.
        </p>
      </div>
    )
  }

  const steps =
    platform === 'ios'
      ? [
          {
            icon: Share,
            text: (
              <>
                Toque no botão <strong className="font-bold text-primary">Compartilhar</strong> na
                barra inferior do Safari (o quadrado com a seta para cima).
              </>
            ),
          },
          {
            icon: Plus,
            text: (
              <>
                Role a lista e toque em{' '}
                <strong className="font-bold text-primary">Adicionar à Tela de Início</strong>.
              </>
            ),
          },
          {
            icon: Check,
            text: (
              <>
                Confirme tocando em <strong className="font-bold text-primary">Adicionar</strong>. O
                ícone da Luna Privé aparecerá na sua tela.
              </>
            ),
          },
          {
            icon: BellRing,
            text: (
              <>
                Abra o app <strong className="font-bold">pelo ícone</strong> e toque em{' '}
                <strong className="font-bold text-primary">Ativar notificações</strong> para receber
                as vendas.
              </>
            ),
          },
        ]
      : [
          {
            icon: MoreVertical,
            text: (
              <>
                Toque no menu <strong className="font-bold text-primary">(⋮)</strong> no canto
                superior direito do Chrome.
              </>
            ),
          },
          {
            icon: Download,
            text: (
              <>
                Toque em <strong className="font-bold text-primary">Instalar app</strong> (ou
                “Adicionar à tela inicial”).
              </>
            ),
          },
          {
            icon: Check,
            text: (
              <>
                Confirme em <strong className="font-bold text-primary">Instalar</strong>. O ícone da
                Luna Privé aparecerá na sua tela.
              </>
            ),
          },
          {
            icon: BellRing,
            text: (
              <>
                Abra o app <strong className="font-bold">pelo ícone</strong> e toque em{' '}
                <strong className="font-bold text-primary">Ativar notificações</strong> para receber
                as vendas.
              </>
            ),
          },
        ]

  return (
    <div className={`${className} w-full rounded-2xl border border-border bg-card/70 p-4 text-left backdrop-blur-sm`}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Smartphone className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-tight text-foreground">
            Instale o app no seu celular
          </h2>
          <p className="text-[0.7rem] leading-tight text-muted-foreground">
            {platform === 'ios'
              ? 'iPhone (Safari)'
              : platform === 'android'
                ? 'Android (Chrome)'
                : 'Celular'}
          </p>
        </div>
      </div>

      <p className="mt-3 text-pretty text-xs leading-relaxed text-muted-foreground">
        Instalando o app você recebe uma <strong className="text-foreground">notificação a cada
        venda</strong> — mesmo com o celular <strong className="text-foreground">bloqueado</strong> e
        o app fechado.
      </p>

      <ol className="mt-3.5 flex flex-col gap-3">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <li key={i} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-pretty text-xs leading-relaxed text-foreground">{step.text}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {platform === 'desktop' && (
        <p className="mt-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-[0.7rem] leading-relaxed text-muted-foreground">
          Você está no computador. Para instalar no celular, abra{' '}
          <strong className="text-foreground">lunaprive.com</strong> no navegador do seu telefone e
          siga os passos acima.
        </p>
      )}
    </div>
  )
}
