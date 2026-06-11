import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAppSettings } from '@/lib/settings'
import { listCashinGatewayMeta } from '@/lib/cashin/gateways'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface InviteRow {
  id: string
  user_id: string | null
  email: string | null
  amount: number | null
  status: string | null
  type: string | null
  transaction_id: string | null
  pix_code: string | null
  gateway: string | null
  created_at: string
  paid_at: string | null
  pix_expiration: string | null
  utm_source: string | null
  utm_campaign: string | null
  utm_medium: string | null
  utm_content: string | null
  utm_term: string | null
  fbclid: string | null
  referrer: string | null
  landing_url: string | null
}

interface ProfileRow {
  id: string
  username: string | null
  display_name: string | null
  created_at: string
  chat_unlocked: boolean | null
  chat_unlocked_at: string | null
  balance: number | null
  total_earned: number | null
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Buscar convites (PIX), perfis (cadastros) e verificacoes de chave PIX (cashout)
  const [invitesRes, profilesRes, verificationsRes] = await Promise.all([
    supabase
      .from('invites')
      .select(
        'id, user_id, email, amount, status, type, transaction_id, pix_code, pix_copied_at, gateway, created_at, paid_at, pix_expiration, utm_source, utm_campaign, utm_medium, utm_content, utm_term, fbclid, referrer, landing_url',
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, username, display_name, created_at, chat_unlocked, chat_unlocked_at, balance, total_earned')
      .order('created_at', { ascending: false }),
    supabase
      .from('pix_verifications')
      .select(
        'id, user_id, email, pix_key, pix_key_normalized, pix_type, amount_cents, status, attempts, transaction_id, last_error, request_ip, created_at, updated_at',
      )
      .order('created_at', { ascending: false }),
  ])

  if (invitesRes.error) {
    console.error('[v0] Erro ao buscar invites:', invitesRes.error)
  }
  if (profilesRes.error) {
    console.error('[v0] Erro ao buscar profiles:', profilesRes.error)
  }
  if (verificationsRes.error) {
    console.error('[v0] Erro ao buscar pix_verifications:', verificationsRes.error)
  }

  const invites = (invitesRes.data || []) as InviteRow[]
  const profiles = (profilesRes.data || []) as ProfileRow[]
  const verifications = verificationsRes.data || []

  // Gateway de cash-in ativo + lista de todos os gateways configurados,
  // para o resumo detalhar o desempenho de cada um.
  const settings = await getAppSettings().catch(() => null)
  const gateways = listCashinGatewayMeta()

  return NextResponse.json({
    invites,
    profiles,
    verifications,
    activeCashinGateway: settings?.activeCashinGateway ?? 'bynet',
    gateways,
    fetchedAt: new Date().toISOString(),
  })
}
