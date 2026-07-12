import type { Metadata } from 'next'

// A pagina /minha-conta e client component e nao pode exportar metadata.
// Este layout define o manifesto dedicado da conta: instalar o PWA a partir
// daqui salva um atalho que abre direto no /minha-conta, com as notificacoes
// de vendas da propria usuaria.
export const metadata: Metadata = {
  manifest: '/minha-conta.webmanifest',
}

export default function MinhaContaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
