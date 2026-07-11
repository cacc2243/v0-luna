'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, BellRing, Loader2, Check, Smartphone, Share, Plus, X } from 'lucide-react'

type PushState =
  | 'loading'
  | 'unsupported'
  | 'needs-install'
  | 'default'
  | 'granted'
  | 'denied'

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
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

const DISMISS_KEY = 'luna_push_banner_dismissed'

/**
 * Banner para a criadora ativar as notificacoes de venda no proprio celular.
 * Aparece no topo do painel enquanto as notificacoes nao estiverem ativas.
 * Uma vez concedida a permissao, o banner some sozinho.
 */
export function EnablePushBanner() {
  const [state, setState] = useState<PushState>('loading')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return

    const supported =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

    if (!supported) {
      if (isIos() && !isStandalone()) setState('needs-install')
      else setState('unsupported')
      return
    }

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
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      // ignore
    }
    refresh()
  }, [refresh])

  // Se ja estiver com permissao concedida, garante que a inscricao esteja salva
  // no servidor (ex.: reinstalou o app ou trocou de dispositivo).
  useEffect(() => {
    if (state !== 'granted') return
    let cancelled = false
    ;(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()
        if (existing && !cancelled) {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(existing.toJSON()),
          })
        }
      } catch {
        // silencioso
      }
    })()
    return () => {
      cancelled = true
    }
  }, [state])

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

      const keyRes = await fetch('/api/push/vapid', { cache: 'no-store' })
      const keyJson = await keyRes.json().catch(() => null)
      if (!keyJson?.publicKey) {
        setMessage('Não foi possível ativar agora. Tente novamente em instantes.')
        return
      }

      const existing = await reg.pushManager.getSubscription()
      const sub =
        existing ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey),
        }))

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (!res.ok) {
        setMessage('Não foi possível salvar. Tente novamente.')
        return
      }

      setState('granted')
    } catch {
      setMessage('Erro ao ativar notificações. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }, [])

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
    setDismissed(true)
  }, [])

  // Nao mostra nada quando ja ativo, sem suporte, ou dispensado nesta sessao.
  if (state === 'loading' || state === 'granted' || state === 'unsupported') return null
  if (dismissed) return null

  return (
    <div className="luna-border relative overflow-hidden rounded-2xl bg-card p-4 shadow-lg shadow-primary/10">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        aria-label="Dispensar"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <BellRing className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">Ative os alertas de venda</h3>
          <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
            Receba uma notificação no celular a cada novo pedido — mesmo com o app fechado e a tela
            bloqueada.
          </p>
        </div>
      </div>

      {state === 'needs-install' && (
        <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Smartphone className="size-4 text-primary" aria-hidden="true" />
            No iPhone, instale o app primeiro
          </div>
          <ol className="mt-2.5 flex flex-col gap-2 text-xs text-foreground">
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.65rem] font-bold text-primary">
                1
              </span>
              <span className="flex items-center gap-1">
                Toque em <Share className="size-3.5 text-primary" aria-hidden="true" /> Compartilhar
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.65rem] font-bold text-primary">
                2
              </span>
              <span className="flex items-center gap-1">
                Escolha <Plus className="size-3.5 text-primary" aria-hidden="true" /> Adicionar à Tela
                de Início
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[0.65rem] font-bold text-primary">
                3
              </span>
              Abra o app pela tela de início e ative aqui
            </li>
          </ol>
        </div>
      )}

      {state === 'denied' && (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs leading-relaxed text-foreground">
          As notificações estão bloqueadas. Habilite-as nas configurações do navegador/sistema para
          este site e recarregue a página.
        </p>
      )}

      {state === 'default' && (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="luna-gradient-cta mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/30 transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Bell className="size-4" aria-hidden="true" />
          )}
          Ativar notificações
        </button>
      )}

      {message && <p className="mt-2.5 text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}
