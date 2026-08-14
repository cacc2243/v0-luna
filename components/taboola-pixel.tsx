'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PublicTaboolaPixel {
  account_id: string
}

/**
 * Carrega o pixel do Taboola (tfa.js) para cada Account ID habilitado no
 * painel, inicializa a fila global `window._tfa` e dispara `page_view` a cada
 * navegacao (inclusive SPA navigation). Os Account IDs vem da API publica.
 *
 * Segue o snippet oficial do Taboola:
 *   window._tfa = window._tfa || []
 *   window._tfa.push({ notify: 'event', name: 'page_view', id: <account_id> })
 *   + carregamento de //cdn.taboola.com/libtrc/unip/<account_id>/tfa.js
 * Para suportar mais de um pixel, repetimos o processo por Account ID, cada um
 * com um <script> de id unico (evita carregamento duplicado).
 */
export function TaboolaPixel() {
  const [accounts, setAccounts] = useState<string[]>([])
  const loadedRef = useRef(false)
  const pathname = usePathname()

  // Busca os accounts habilitados uma unica vez.
  useEffect(() => {
    let active = true
    fetch('/api/taboola-pixels/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && Array.isArray(d.pixels)) {
          const ids = Array.from(
            new Set(
              (d.pixels as PublicTaboolaPixel[])
                .map((p) => String(p.account_id || '').trim())
                .filter(Boolean),
            ),
          )
          setAccounts(ids)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Inicializa o Taboola quando a lista de accounts estiver pronta.
  useEffect(() => {
    if (accounts.length === 0) return
    if (loadedRef.current) return
    loadedRef.current = true

    // Publica os accounts para os helpers de tracking (tfaTrack).
    window.__tfaAccounts = accounts
    window._tfa = window._tfa || []

    // page_view inicial + carregamento do script por account.
    for (const id of accounts) {
      window._tfa.push({ notify: 'event', name: 'page_view', id: Number(id) })
      const scriptId = `tb_tfa_script_${id}`
      if (!document.getElementById(scriptId)) {
        const t = document.createElement('script')
        t.async = true
        t.src = `//cdn.taboola.com/libtrc/unip/${id}/tfa.js`
        t.id = scriptId
        const first = document.getElementsByTagName('script')[0]
        first?.parentNode?.insertBefore(t, first)
      }
    }

    // Sinaliza pronto e drena eventos enfileirados (ex.: start_checkout cedo).
    window.__tfaReady = true
    if (Array.isArray(window.__tfaQueue)) {
      for (const fn of window.__tfaQueue) {
        try {
          fn()
        } catch {
          // ignora falhas individuais de eventos enfileirados
        }
      }
      window.__tfaQueue = []
    }
  }, [accounts])

  // Dispara page_view nas mudancas de rota (apos a inicializacao).
  const firstRouteRef = useRef(true)
  useEffect(() => {
    if (!loadedRef.current) return
    // O page_view inicial ja foi disparado na inicializacao; ignora a 1a vez.
    if (firstRouteRef.current) {
      firstRouteRef.current = false
      return
    }
    if (!Array.isArray(window._tfa)) return
    for (const id of accounts) {
      window._tfa.push({ notify: 'event', name: 'page_view', id: Number(id) })
    }
  }, [pathname, accounts])

  return null
}
