'use client'

import { useEffect } from 'react'

/**
 * Registra o service worker (/sw.js) uma vez, no carregamento do app.
 * Necessario para o PWA ser instalavel e para receber Web Push.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('[v0] Falha ao registrar service worker:', err?.message || err)
      })
    }

    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
