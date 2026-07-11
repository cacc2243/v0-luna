'use client'

import { useEffect, useState } from 'react'
import {
  Share,
  Plus,
  MoreVertical,
  Download,
  BellRing,
  Smartphone,
  Check,
  Copy,
  TriangleAlert,
  Apple,
} from 'lucide-react'

type Platform = 'ios' | 'android'

// Dominio de producao. O app abre em /minha-conta.
const APP_HOST = 'lunaprive.live'
const APP_PATH = '/minha-conta'
const APP_URL_DISPLAY = `${APP_HOST}${APP_PATH}`
const APP_URL_FULL = `https://${APP_HOST}${APP_PATH}`

// Evento nao tipado pelo TS padrao.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectPlatform(): Platform | null {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return null
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

// Navegadores embutidos (Instagram, Facebook, TikTok, etc.) NAO deixam instalar
// o app — a usuaria precisa abrir no navegador padrao do celular.
function detectInApp(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter|Snapchat|TikTok|Pinterest|MicroMessenger/i.test(
    ua,
  )
}

/**
 * Explica como instalar o app (PWA) na tela de inicio do celular. Instalar e o
 * que permite receber as notificacoes de venda mesmo com o app fechado e a tela
 * bloqueada. Mostra um seletor de aparelho (iPhone x Android) com passos
 * detalhados de cada um, um botao de instalar (quando o navegador suporta) e
 * um aviso para quem abriu pelo navegador do Instagram.
 */
export function InstallAppGuide({ className = 'mt-5' }: { className?: string }) {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [installed, setInstalled] = useState(false)
  const [inApp, setInApp] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setPlatform(detectPlatform())
    setInstalled(isStandalone())
    setInApp(detectInApp())

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(APP_URL_FULL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  // Ja esta rodando como app instalado: nao precisa mostrar o guia.
  if (installed) {
    return (
      <div
        className={`${className} flex w-full items-center gap-2.5 rounded-2xl border border-positive/30 bg-positive/10 px-4 py-3 text-left`}
      >
        <Check className="size-5 shrink-0 text-positive" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-foreground">
          <strong className="font-bold">App instalado!</strong> Você já pode receber os alertas de
          venda direto no seu celular.
        </p>
      </div>
    )
  }

  const iosSteps = [
    {
      icon: Share,
      text: (
        <>
          Toque no botão <strong className="font-bold text-primary">Compartilhar</strong> na barra
          do Safari (o quadrado com uma seta para cima).
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
          Confirme tocando em <strong className="font-bold text-primary">Adicionar</strong>. O ícone
          da Luna Privé aparecerá na sua tela.
        </>
      ),
    },
    {
      icon: BellRing,
      text: (
        <>
          Abra o app <strong className="font-bold">pelo ícone</strong> e toque em{' '}
          <strong className="font-bold text-primary">Ativar notificações</strong> para receber as
          vendas.
        </>
      ),
    },
  ]

  const androidSteps = [
    {
      icon: MoreVertical,
      text: (
        <>
          Toque no menu <strong className="font-bold text-primary">(⋮)</strong> no canto superior
          direito do navegador (Chrome).
        </>
      ),
    },
    {
      icon: Download,
      text: (
        <>
          Toque em <strong className="font-bold text-primary">Instalar app</strong> (ou “Adicionar à
          tela inicial”).
        </>
      ),
    },
    {
      icon: Check,
      text: (
        <>
          Confirme em <strong className="font-bold text-primary">Instalar</strong>. O ícone da Luna
          Privé aparecerá na sua tela.
        </>
      ),
    },
    {
      icon: BellRing,
      text: (
        <>
          Abra o app <strong className="font-bold">pelo ícone</strong> e toque em{' '}
          <strong className="font-bold text-primary">Ativar notificações</strong> para receber as
          vendas.
        </>
      ),
    },
  ]

  const steps = platform === 'ios' ? iosSteps : androidSteps

  return (
    <div
      className={`${className} w-full rounded-2xl border border-border bg-card/70 p-4 text-left backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Smartphone className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-tight text-foreground">
            Instale o app no seu celular
          </h2>
          <p className="text-[0.7rem] leading-tight text-muted-foreground">
            Selecione seu aparelho para ver o passo a passo
          </p>
        </div>
      </div>

      {/* Seletor de aparelho */}
      <div className="mt-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Tipo de aparelho">
        <button
          type="button"
          role="tab"
          aria-selected={platform === 'ios'}
          onClick={() => setPlatform('ios')}
          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
            platform === 'ios'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-secondary/40 text-muted-foreground'
          }`}
        >
          <Apple className="size-4" aria-hidden="true" />
          iPhone
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={platform === 'android'}
          onClick={() => setPlatform('android')}
          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
            platform === 'android'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-secondary/40 text-muted-foreground'
          }`}
        >
          <Smartphone className="size-4" aria-hidden="true" />
          Android e outros
        </button>
      </div>

      {/* Aviso: navegador do Instagram/redes — precisa abrir no navegador padrao */}
      {inApp && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs leading-relaxed text-foreground">
              Você abriu pelo navegador do Instagram, e por aqui{' '}
              <strong className="font-semibold">não dá para instalar</strong>. Abra pelo navegador do
              seu celular {platform === 'ios' ? '(Safari)' : '(Chrome)'}:
            </p>
            <button
              type="button"
              onClick={copyLink}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[0.7rem] font-bold text-primary-foreground transition active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="size-3.5" aria-hidden="true" /> Link copiado!
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden="true" /> Copiar link do app
                </>
              )}
            </button>
            <p className="mt-1.5 text-[0.7rem] leading-relaxed text-muted-foreground">
              Toque em <strong className="text-foreground">(⋮)</strong> ou{' '}
              <strong className="text-foreground">Compartilhar</strong> e escolha “Abrir no
              navegador”, ou cole o link <strong className="text-foreground">{APP_URL_DISPLAY}</strong>{' '}
              lá.
            </p>
          </div>
        </div>
      )}

      <p className="mt-3 text-pretty text-xs leading-relaxed text-muted-foreground">
        Instalando o app você recebe uma{' '}
        <strong className="text-foreground">notificação a cada venda</strong> — mesmo com o celular{' '}
        <strong className="text-foreground">bloqueado</strong> e o app fechado.
      </p>

      {platform === 'ios' && (
        <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground">
          No iPhone, use o <strong className="text-foreground">Safari</strong> (não funciona pelo
          navegador do Instagram).
        </p>
      )}

      {/* Botao de instalar (so aparece quando o navegador oferece — Android/Chrome) */}
      {deferredPrompt && !inApp && (
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[0.98]"
        >
          <Download className="size-4" aria-hidden="true" />
          Instalar app agora
        </button>
      )}

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

      {/* Rodape: abrir no celular pelo link certo */}
      <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
        <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
          Está no computador? Para instalar no celular, abra{' '}
          <strong className="text-foreground">{APP_URL_DISPLAY}</strong> no navegador do seu telefone
          e siga os passos acima.
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[0.7rem] font-semibold text-foreground transition active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-positive" aria-hidden="true" /> Link copiado!
            </>
          ) : (
            <>
              <Copy className="size-3.5" aria-hidden="true" /> Copiar link do app
            </>
          )}
        </button>
      </div>
    </div>
  )
}
