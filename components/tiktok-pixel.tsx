'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PublicTiktokPixel {
  pixel_id: string
}

/**
 * Inicializa o TikTok Pixel (ttq) para cada Pixel ID habilitado no painel e
 * dispara o Pageview a cada navegacao (inclusive SPA navigation). Os Pixel IDs
 * vem da API publica — o Pixel ID nao e um dado sensivel.
 *
 * Segue o snippet oficial do TikTok (analytics.tiktok.com/i18n/pixel/events.js)
 * criando a fila `window.ttq` com os metodos stub e chamando `ttq.load()` por
 * pixel. O carregamento do script acontece uma unica vez.
 */
export function TiktokPixel() {
  const [pixels, setPixels] = useState<string[]>([])
  const loadedRef = useRef(false)
  const pathname = usePathname()

  // Busca os pixels habilitados uma unica vez.
  useEffect(() => {
    let active = true
    fetch('/api/tiktok-pixels/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && Array.isArray(d.pixels)) {
          const ids = Array.from(
            new Set(
              (d.pixels as PublicTiktokPixel[])
                .map((p) => String(p.pixel_id || '').trim())
                .filter(Boolean),
            ),
          )
          setPixels(ids)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Inicializa o ttq quando a lista de pixels estiver pronta.
  useEffect(() => {
    if (pixels.length === 0) return
    if (loadedRef.current) return
    loadedRef.current = true

    try {
      // Snippet oficial do TikTok: cria a fila global com os metodos stub.
      const w = window as unknown as Record<string, any>
      w.TiktokAnalyticsObject = 'ttq'
      const ttq = (w.ttq = w.ttq || [])
      ttq.methods = [
        'page',
        'track',
        'identify',
        'instances',
        'debug',
        'on',
        'off',
        'once',
        'ready',
        'alias',
        'group',
        'enableCookie',
        'disableCookie',
        'holdConsent',
        'revokeConsent',
        'grantConsent',
      ]
      ttq.setAndDefer = function (target: any, method: string) {
        target[method] = function (...args: unknown[]) {
          target.push([method].concat(Array.prototype.slice.call(args, 0)))
        }
      }
      for (const method of ttq.methods) {
        ttq.setAndDefer(ttq, method)
      }
      ttq.instance = function (id: string) {
        const inst = (ttq._i && ttq._i[id]) || []
        for (const method of ttq.methods) {
          ttq.setAndDefer(inst, method)
        }
        return inst
      }
      ttq.load = function (id: string, options?: Record<string, unknown>) {
        const url = 'https://analytics.tiktok.com/i18n/pixel/events.js'
        const scriptId = 'ttq_events_script'
        ttq._i = ttq._i || {}
        ttq._i[id] = []
        ttq._i[id]._u = url
        ttq._t = ttq._t || {}
        ttq._t[id] = +new Date()
        ttq._o = ttq._o || {}
        ttq._o[id] = options || {}
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script')
          script.type = 'text/javascript'
          script.async = true
          script.id = scriptId
          script.src = `${url}?sdkid=${id}&lib=ttq`
          const first = document.getElementsByTagName('script')[0]
          first?.parentNode?.insertBefore(script, first)
        }
      }

      // Carrega cada pixel habilitado e dispara o Pageview inicial.
      for (const id of pixels) {
        ttq.load(id)
      }
      ttq.page()

      // Publica os pixels para os helpers de tracking (ttqTrack).
      window.__ttqPixels = pixels
      window.__ttqReady = true

      // Drena eventos enfileirados antes da inicializacao (ex.: checkout).
      if (Array.isArray(window.__ttqQueue)) {
        for (const fn of window.__ttqQueue) {
          try {
            fn()
          } catch {
            // ignora falhas individuais de eventos enfileirados
          }
        }
        window.__ttqQueue = []
      }
    } catch {
      // nunca quebrar a aplicacao por causa do pixel
    }
  }, [pixels])

  // Dispara Pageview nas mudancas de rota (apos a inicializacao).
  const firstRouteRef = useRef(true)
  useEffect(() => {
    if (!loadedRef.current) return
    // O Pageview inicial ja foi disparado na inicializacao; ignora a 1a vez.
    if (firstRouteRef.current) {
      firstRouteRef.current = false
      return
    }
    try {
      window.ttq?.page()
    } catch {
      // silencioso
    }
  }, [pathname])

  return null
}
