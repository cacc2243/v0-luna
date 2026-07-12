import { buildManifest } from '@/lib/pwa/manifest'

/**
 * Manifesto dedicado do /minha-conta. Instalar o app a partir da conta salva um
 * atalho que abre direto no /minha-conta, com as notificacoes de vendas da
 * propria usuaria.
 */
export function GET() {
  const manifest = buildManifest({
    id: '/minha-conta',
    startUrl: '/minha-conta',
    name: 'Luna Privé',
    shortName: 'Luna Privé',
    description: 'Luna Privé — acompanhe suas vendas em tempo real.',
  })

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-cache',
    },
  })
}
