import { buildManifest } from '@/lib/pwa/manifest'

/**
 * Manifesto dedicado do /painel. Instalar o app a partir do painel salva um
 * atalho que abre direto no /painel.
 */
export function GET() {
  const manifest = buildManifest({
    id: '/painel',
    startUrl: '/painel',
    name: 'Painel · Luna Privé',
    shortName: 'Painel',
    description: 'Painel Luna Privé — gestão da plataforma.',
  })

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache',
    },
  })
}
