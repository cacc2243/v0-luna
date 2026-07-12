import type { MetadataRoute } from 'next'
import { buildManifest } from '@/lib/pwa/manifest'

/**
 * Manifesto padrao (fallback). Usado por rotas que nao definem um manifesto
 * proprio. As rotas /painel e /minha-conta apontam para manifestos dedicados
 * (com seu proprio start_url), veja app/painel.webmanifest e
 * app/minha-conta.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return buildManifest({
    id: '/minha-conta',
    startUrl: '/minha-conta',
    name: 'Luna Privé',
    shortName: 'Luna Privé',
    description: 'Luna Privé — acompanhe suas vendas em tempo real.',
  })
}
