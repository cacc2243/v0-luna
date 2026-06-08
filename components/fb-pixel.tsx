'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

interface PublicPixel {
  pixel_id: string
}

/**
 * Carrega o fbevents.js, inicializa todos os pixels habilitados (configurados
 * no painel) e dispara PageView em cada navegacao (incluindo SPA navigation).
 * Os Pixel IDs vem da API publica; o access token NUNCA chega ao browser.
 */
export function FbPixel() {
  const [pixels, setPixels] = useState<PublicPixel[]>([])
  const initializedRef = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    let active = true
    fetch('/api/pixels/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && Array.isArray(d.pixels)) {
          setPixels(d.pixels)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Inicializa os pixels assim que a lista estiver pronta. O snippet define
  // window.fbq de forma sincrona (com fila), entao fazemos um curto polling
  // para garantir que esteja disponivel.
  useEffect(() => {
    if (pixels.length === 0) return
    if (initializedRef.current) return

    let attempts = 0
    const tryInit = () => {
      const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq
      if (typeof fbq === 'function') {
        for (const p of pixels) {
          fbq('init', p.pixel_id)
        }
        fbq('track', 'PageView')
        initializedRef.current = true
        // Sinaliza que os pixels foram inicializados, para que eventos
        // disparados cedo (ex.: InitiateCheckout) aguardem e nao se percam.
        // Em seguida, drena a fila de eventos que ficaram pendentes.
        const w = window as unknown as {
          __fbqReady?: boolean
          __fbqQueue?: Array<() => void>
        }
        w.__fbqReady = true
        if (Array.isArray(w.__fbqQueue)) {
          for (const fn of w.__fbqQueue) {
            try {
              fn()
            } catch {
              // ignora falhas individuais de eventos enfileirados
            }
          }
          w.__fbqQueue = []
        }
        return
      }
      attempts += 1
      if (attempts < 40) {
        setTimeout(tryInit, 100)
      }
    }
    tryInit()
  }, [pixels])

  // Dispara PageView em mudancas de rota (apos a inicializacao).
  useEffect(() => {
    if (!initializedRef.current) return
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq
    if (typeof fbq === 'function') {
      fbq('track', 'PageView')
    }
  }, [pathname])

  if (pixels.length === 0) return null

  return (
    <Script
      id="fb-pixel-base"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
        `,
      }}
    />
  )
}
