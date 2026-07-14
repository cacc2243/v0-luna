import { getAppSettings } from '@/lib/settings'
import { ConviteClient } from '@/components/convite/convite-client'

// O valor depende do banco (app_settings), entao a pagina e sempre dinamica.
export const dynamic = 'force-dynamic'

export default async function ConvitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Busca o valor do convite no servidor: quando a pagina chega ao cliente,
  // o preco ja vem resolvido e renderiza imediatamente, sem blur nem fetch.
  const settings = await getAppSettings()

  // Le os dados vindos do link do e-mail JA NO SERVIDOR. Isso garante que o
  // HTML renderizado no servidor seja identico ao do cliente, evitando o erro
  // de hidratacao que quebrava a interatividade (modais nao respondiam ao
  // toque) quando a usuaria chegava por /convite?email=...&username=...
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
  const sp = await searchParams
  const initialFromUrl = {
    username: first(sp.username),
    email: first(sp.email),
    pixType: first(sp.pixType),
    pixKey: first(sp.pixKey),
  }

  return (
    <ConviteClient
      initialInviteCents={settings.inviteAmountCents}
      initialFromUrl={initialFromUrl}
      requireCpf={settings.requireCpfOnInvite}
    />
  )
}
