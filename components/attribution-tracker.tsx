'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { captureAttribution } from '@/lib/fb/attribution'

/**
 * Captura a atribuicao de marketing (UTMs + fbclid) assim que o lead chega
 * pelo anuncio do Facebook e a guarda como first-touch. Roda em toda
 * navegacao para garantir captura mesmo quando a landing inicial nao tinha os
 * parametros mas uma rota seguinte tem.
 */
export function AttributionTracker() {
  const pathname = usePathname()

  useEffect(() => {
    captureAttribution()
  }, [pathname])

  return null
}
