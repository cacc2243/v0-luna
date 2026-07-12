import type { MetadataRoute } from 'next'

/**
 * Builder compartilhado do Web App Manifest.
 *
 * O PWA salvo na tela inicial abre sempre no `start_url` do manifesto que a
 * pagina apontou no momento da instalacao. Como queremos que:
 *   - quem instala pelo /painel abra o /painel
 *   - quem instala pelo /minha-conta abra o /minha-conta
 * geramos um manifesto por rota, cada um com seu proprio `start_url` e `id`.
 *
 * O `id` distingue a instalacao para o navegador: assim o /painel e o
 * /minha-conta sao tratados como apps separados e nao sobrescrevem um ao outro.
 */
export function buildManifest({
  startUrl,
  id,
  name,
  shortName,
  description,
}: {
  startUrl: string
  id: string
  name: string
  shortName: string
  description: string
}): MetadataRoute.Manifest {
  return {
    id,
    name,
    short_name: shortName,
    description,
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'pt-BR',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
