'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing, Loader2, Check, Smartphone, Share, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type PushState = 'unsupported' | 'needs-install' | 'default' | 'granted' | 'denied' | 'loading'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function PushNotificationsCard() {
  const [state, setState] = useState<PushState>('loading')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [ios, setIos] = useState(false)

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return
    setIos(isIos())

    const supported =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

    if (!supported) {
      // No iOS, o suporte a push so existe quando o app esta instalado (standalone).
      if (isIos() && !isStandalone()) {
        setState('needs-install')
      } else {
        setState('unsupported')
      }
      return
    }

    // iOS exige o app instalado na tela de inicio para push funcionar.
    if (isIos() && !isStandalone()) {
      setState('needs-install')
      return
    }

    const perm = Notification.permission
    if (perm === 'granted') setState('granted')
    else if (perm === 'denied') setState('denied')
    else setState('default')
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const enable = useCallback(async () => {
    setBusy(true)
    setMessage(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'default')
        setMessage('Permissão de notificação não concedida.')
        return
      }

      const reg = await navigator.serviceWorker.ready

      const keyRes = await fetch('/api/admin/push/vapid', { cache: 'no-store' })
      if (!keyRes.ok) {
        setMessage(`Falha ao obter a chave (erro ${keyRes.status}). Tente novamente.`)
        return
      }
      const keyJson = await keyRes.json().catch(() => null)
      if (!keyJson?.publicKey) {
        setMessage(
          'Servidor sem chave de notificação configurada. É preciso publicar o app após adicionar as chaves VAPID.',
        )
        return
      }

      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey),
        }))

      const res = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (!res.ok) {
        setMessage('Não foi possível salvar a inscrição. Tente novamente.')
        return
      }

      setState('granted')
      setMessage('Notificações ativadas neste dispositivo!')
    } catch (e) {
      console.log('[v0] Erro ao ativar push:', e instanceof Error ? e.message : e)
      setMessage('Erro ao ativar notificações. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }, [])

  const sendTest = useCallback(async () => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/push/test', { method: 'POST' })
      const json = await res.json()
      if (res.ok && json?.sent > 0) {
        setMessage('Notificação de teste enviada! Verifique seu dispositivo.')
      } else {
        setMessage('Nenhum dispositivo recebeu. Ative as notificações primeiro.')
      }
    } catch {
      setMessage('Erro ao enviar teste.')
    } finally {
      setBusy(false)
    }
  }, [])

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <BellRing className="size-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">Notificações de vendas</h2>
          <p className="text-sm text-muted-foreground">
            Receba um alerta no celular a cada venda aprovada.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {state === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Verificando compatibilidade...
          </div>
        )}

        {state === 'needs-install' && (
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Smartphone className="size-4 text-primary" />
              Instale o app primeiro
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              No iPhone, as notificações só funcionam com o app instalado na tela de início:
            </p>
            <ol className="mt-3 flex flex-col gap-2 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  1
                </span>
                <span className="flex items-center gap-1">
                  Toque em <Share className="size-4 text-primary" /> Compartilhar no Safari
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  2
                </span>
                <span className="flex items-center gap-1">
                  Escolha <Plus className="size-4 text-primary" /> Adicionar à Tela de Início
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  3
                </span>
                Abra o app pela tela de início e ative aqui
              </li>
            </ol>
          </div>
        )}

        {state === 'unsupported' && (
          <p className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Este dispositivo/navegador não suporta notificações push.
            {ios ? ' Atualize o iOS para a versão 16.4 ou superior.' : ' Tente pelo Chrome ou Safari.'}
          </p>
        )}

        {state === 'denied' && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
            As notificações foram bloqueadas. Habilite-as nas configurações do navegador/sistema
            para este site e recarregue a página.
          </p>
        )}

        {state === 'default' && (
          <button
            onClick={enable}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
            Ativar notificações neste dispositivo
          </button>
        )}

        {state === 'granted' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-positive/30 bg-positive/10 px-4 py-3 text-sm font-medium text-foreground">
              <Check className="size-4 text-positive" />
              Notificações ativas neste dispositivo
            </div>
            <div className="flex gap-2">
              <button
                onClick={enable}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
                Reativar
              </button>
              <button
                onClick={sendTest}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />}
                Enviar teste
              </button>
            </div>
          </div>
        )}

        {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}

        {/* Teste global: dispara para todos os aparelhos ja inscritos (ex.: o
            iPhone), mesmo que o dispositivo atual nao esteja ativado. */}
        {state !== 'loading' && state !== 'granted' && (
          <button
            onClick={sendTest}
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4 text-primary" />}
            Enviar notificação de teste ao iPhone
          </button>
        )}
      </div>
    </section>
  )
}
