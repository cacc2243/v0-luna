import { getAppSettings } from '@/lib/settings'
import { ConviteClient } from '@/components/convite/convite-client'

// O valor depende do banco (app_settings), entao a pagina e sempre dinamica.
export const dynamic = 'force-dynamic'

export default async function ConvitePage() {
  // Busca o valor do convite no servidor: quando a pagina chega ao cliente,
  // o preco ja vem resolvido e renderiza imediatamente, sem blur nem fetch.
  const settings = await getAppSettings()

  return <ConviteClient initialInviteCents={settings.inviteAmountCents} />
}
