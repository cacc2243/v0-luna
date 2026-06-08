import { createAdminClient } from '@/lib/supabase/admin'

/** Planos de impulsionamento: dias -> valor em centavos. */
export type BoostAmounts = Record<string, number>

export const BOOST_DAYS = [2, 7, 14, 21, 30] as const

export interface AppSettings {
  verificationEnabled: boolean
  activeCashoutGateway: string
  activeCashinGateway: string
  verificationAmountCents: number
  inviteAmountCents: number
  chatAmountCents: number
  giftUnlockAmountCents: number
  boostAmountCents: BoostAmounts
  /** Token de API da Utmify (x-api-token). Vazio = integração desligada. */
  utmifyApiToken: string
}

const DEFAULT_BOOST: BoostAmounts = {
  '2': 2800,
  '7': 5600,
  '14': 7000,
  '21': 8400,
  '30': 9900,
}

const DEFAULTS: AppSettings = {
  verificationEnabled: true,
  activeCashoutGateway: 'pixup',
  activeCashinGateway: 'bynet',
  verificationAmountCents: 90,
  inviteAmountCents: 2480,
  chatAmountCents: 9900,
  giftUnlockAmountCents: 3860,
  boostAmountCents: { ...DEFAULT_BOOST },
  utmifyApiToken: '',
}

const KEY_MAP = {
  verificationEnabled: 'verification_enabled',
  activeCashoutGateway: 'active_cashout_gateway',
  activeCashinGateway: 'active_cashin_gateway',
  verificationAmountCents: 'verification_amount_cents',
  inviteAmountCents: 'invite_amount_cents',
  chatAmountCents: 'chat_amount_cents',
  giftUnlockAmountCents: 'gift_unlock_amount_cents',
  boostAmountCents: 'boost_amount_cents',
  utmifyApiToken: 'utmify_api_token',
} as const

/** Normaliza um objeto de precos de boost garantindo todos os planos. */
function normalizeBoost(raw: unknown): BoostAmounts {
  const out: BoostAmounts = { ...DEFAULT_BOOST }
  if (raw && typeof raw === 'object') {
    for (const day of BOOST_DAYS) {
      const v = (raw as Record<string, unknown>)[String(day)]
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
        out[String(day)] = Math.round(v)
      }
    }
  }
  return out
}

/**
 * Le as configuracoes do app a partir do banco (fonte unica da verdade).
 * Sempre executado no servidor.
 */
export async function getAppSettings(): Promise<AppSettings> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('app_settings').select('key, value')

  if (error || !data) {
    console.error('[v0] Erro ao ler app_settings:', error?.message)
    return { ...DEFAULTS }
  }

  const map = new Map(data.map((row) => [row.key, row.value]))

  const verificationEnabled = map.has(KEY_MAP.verificationEnabled)
    ? Boolean(map.get(KEY_MAP.verificationEnabled))
    : DEFAULTS.verificationEnabled

  const activeCashoutGateway =
    typeof map.get(KEY_MAP.activeCashoutGateway) === 'string'
      ? (map.get(KEY_MAP.activeCashoutGateway) as string)
      : DEFAULTS.activeCashoutGateway

  const activeCashinGateway =
    typeof map.get(KEY_MAP.activeCashinGateway) === 'string'
      ? (map.get(KEY_MAP.activeCashinGateway) as string)
      : DEFAULTS.activeCashinGateway

  const rawAmount = map.get(KEY_MAP.verificationAmountCents)
  const verificationAmountCents =
    typeof rawAmount === 'number' && Number.isFinite(rawAmount)
      ? Math.round(rawAmount)
      : DEFAULTS.verificationAmountCents

  const rawInvite = map.get(KEY_MAP.inviteAmountCents)
  const inviteAmountCents =
    typeof rawInvite === 'number' && Number.isFinite(rawInvite)
      ? Math.round(rawInvite)
      : DEFAULTS.inviteAmountCents

  const rawChat = map.get(KEY_MAP.chatAmountCents)
  const chatAmountCents =
    typeof rawChat === 'number' && Number.isFinite(rawChat)
      ? Math.round(rawChat)
      : DEFAULTS.chatAmountCents

  const rawGift = map.get(KEY_MAP.giftUnlockAmountCents)
  const giftUnlockAmountCents =
    typeof rawGift === 'number' && Number.isFinite(rawGift)
      ? Math.round(rawGift)
      : DEFAULTS.giftUnlockAmountCents

  const boostAmountCents = normalizeBoost(map.get(KEY_MAP.boostAmountCents))

  const utmifyApiToken =
    typeof map.get(KEY_MAP.utmifyApiToken) === 'string'
      ? (map.get(KEY_MAP.utmifyApiToken) as string)
      : DEFAULTS.utmifyApiToken

  return {
    verificationEnabled,
    activeCashoutGateway,
    activeCashinGateway,
    verificationAmountCents,
    inviteAmountCents,
    chatAmountCents,
    giftUnlockAmountCents,
    boostAmountCents,
    utmifyApiToken,
  }
}

/**
 * Atualiza uma ou mais configuracoes. Faz upsert por chave.
 */
export async function updateAppSettings(
  patch: Partial<AppSettings>,
  updatedBy?: string
): Promise<void> {
  const supabase = createAdminClient()

  const rows: { key: string; value: any; updated_at: string; updated_by?: string }[] = []
  const now = new Date().toISOString()

  if (typeof patch.verificationEnabled === 'boolean') {
    rows.push({
      key: KEY_MAP.verificationEnabled,
      value: patch.verificationEnabled,
      updated_at: now,
      updated_by: updatedBy,
    })
  }
  if (typeof patch.activeCashoutGateway === 'string') {
    rows.push({
      key: KEY_MAP.activeCashoutGateway,
      value: patch.activeCashoutGateway,
      updated_at: now,
      updated_by: updatedBy,
    })
  }
  if (typeof patch.activeCashinGateway === 'string') {
    rows.push({
      key: KEY_MAP.activeCashinGateway,
      value: patch.activeCashinGateway,
      updated_at: now,
      updated_by: updatedBy,
    })
  }
  if (typeof patch.verificationAmountCents === 'number') {
    rows.push({
      key: KEY_MAP.verificationAmountCents,
      value: Math.round(patch.verificationAmountCents),
      updated_at: now,
      updated_by: updatedBy,
    })
  }
  if (typeof patch.inviteAmountCents === 'number') {
    rows.push({
      key: KEY_MAP.inviteAmountCents,
      value: Math.round(patch.inviteAmountCents),
      updated_at: now,
      updated_by: updatedBy,
    })
  }
  if (typeof patch.chatAmountCents === 'number') {
    rows.push({
      key: KEY_MAP.chatAmountCents,
      value: Math.round(patch.chatAmountCents),
      updated_at: now,
      updated_by: updatedBy,
    })
  }
  if (typeof patch.giftUnlockAmountCents === 'number') {
    rows.push({
      key: KEY_MAP.giftUnlockAmountCents,
      value: Math.round(patch.giftUnlockAmountCents),
      updated_at: now,
      updated_by: updatedBy,
    })
  }
  if (patch.boostAmountCents && typeof patch.boostAmountCents === 'object') {
    rows.push({
      key: KEY_MAP.boostAmountCents,
      value: normalizeBoost(patch.boostAmountCents),
      updated_at: now,
      updated_by: updatedBy,
    })
  }
  if (typeof patch.utmifyApiToken === 'string') {
    rows.push({
      key: KEY_MAP.utmifyApiToken,
      value: patch.utmifyApiToken.trim(),
      updated_at: now,
      updated_by: updatedBy,
    })
  }

  if (rows.length === 0) return

  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' })
  if (error) {
    throw new Error(`Falha ao salvar configurações: ${error.message}`)
  }
}
