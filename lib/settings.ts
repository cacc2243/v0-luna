import { unstable_cache, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

/** Tag de cache das configuracoes. Invalidada ao salvar (updateAppSettings). */
export const APP_SETTINGS_TAG = 'app-settings'

/** Planos de impulsionamento: dias -> valor em centavos. */
export type BoostAmounts = Record<string, number>

export const BOOST_DAYS = [2, 7, 14, 21, 30] as const

export interface AppSettings {
  verificationEnabled: boolean
  activeCashoutGateway: string
  activeCashinGateway: string
  verificationAmountCents: number
  /** Valor cobrado na verificação de saque (/minha-conta). */
  withdrawalVerificationAmountCents: number
  inviteAmountCents: number
  chatAmountCents: number
  giftUnlockAmountCents: number
  boostAmountCents: BoostAmounts
  /**
   * Proporção de pedidos: 1 pedido DIRETO a cada N pedidos.
   * Ex.: 13 = 12 pedidos com chat para cada 1 pedido direto.
   * Mínimo 1 (todos diretos), máximo 100.
   */
  directOrderEveryN: number
  /** Token de API da Utmify (x-api-token). Vazio = integração desligada. */
  utmifyApiToken: string
  /** Quando true, o fluxo do convite exige o CPF antes de gerar o PIX. */
  requireCpfOnInvite: boolean
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
  verificationAmountCents: 4990,
  withdrawalVerificationAmountCents: 4990,
  inviteAmountCents: 2480,
  chatAmountCents: 9900,
  giftUnlockAmountCents: 3860,
  boostAmountCents: { ...DEFAULT_BOOST },
  directOrderEveryN: 13,
  utmifyApiToken: '',
  requireCpfOnInvite: false,
}

const KEY_MAP = {
  verificationEnabled: 'verification_enabled',
  activeCashoutGateway: 'active_cashout_gateway',
  activeCashinGateway: 'active_cashin_gateway',
  verificationAmountCents: 'verification_amount_cents',
  withdrawalVerificationAmountCents: 'withdrawal_verification_amount_cents',
  inviteAmountCents: 'invite_amount_cents',
  chatAmountCents: 'chat_amount_cents',
  giftUnlockAmountCents: 'gift_unlock_amount_cents',
  boostAmountCents: 'boost_amount_cents',
  directOrderEveryN: 'direct_order_every_n',
  utmifyApiToken: 'utmify_api_token',
  requireCpfOnInvite: 'require_cpf_on_invite',
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
async function readAppSettings(): Promise<AppSettings> {
  // Se o Supabase nao estiver configurado (ex.: preview sem env vars),
  // retorna os valores padrao em vez de quebrar o render.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ...DEFAULTS }
  }

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

  const rawWithdrawalAmount = map.get(KEY_MAP.withdrawalVerificationAmountCents)
  const withdrawalVerificationAmountCents =
    typeof rawWithdrawalAmount === 'number' && Number.isFinite(rawWithdrawalAmount)
      ? Math.round(rawWithdrawalAmount)
      : DEFAULTS.withdrawalVerificationAmountCents

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

  const rawDirectEveryN = map.get(KEY_MAP.directOrderEveryN)
  const directOrderEveryN =
    typeof rawDirectEveryN === 'number' && Number.isFinite(rawDirectEveryN)
      ? Math.min(100, Math.max(1, Math.round(rawDirectEveryN)))
      : DEFAULTS.directOrderEveryN

  const utmifyApiToken =
    typeof map.get(KEY_MAP.utmifyApiToken) === 'string'
      ? (map.get(KEY_MAP.utmifyApiToken) as string)
      : DEFAULTS.utmifyApiToken

  const requireCpfOnInvite = map.has(KEY_MAP.requireCpfOnInvite)
    ? Boolean(map.get(KEY_MAP.requireCpfOnInvite))
    : DEFAULTS.requireCpfOnInvite

  return {
    verificationEnabled,
    activeCashoutGateway,
    activeCashinGateway,
    verificationAmountCents,
    withdrawalVerificationAmountCents,
    inviteAmountCents,
    chatAmountCents,
    giftUnlockAmountCents,
    boostAmountCents,
    directOrderEveryN,
    utmifyApiToken,
    requireCpfOnInvite,
  }
}

/**
 * Versao cacheada de readAppSettings. Evita travar o render na latencia do
 * banco a cada request. O cache e invalidado por tag sempre que as
 * configuracoes sao salvas (ver updateAppSettings).
 */
export const getAppSettings = unstable_cache(readAppSettings, ['app-settings'], {
  tags: [APP_SETTINGS_TAG],
  revalidate: 60,
})

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
  if (typeof patch.withdrawalVerificationAmountCents === 'number') {
    rows.push({
      key: KEY_MAP.withdrawalVerificationAmountCents,
      value: Math.round(patch.withdrawalVerificationAmountCents),
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
  if (typeof patch.directOrderEveryN === 'number') {
    rows.push({
      key: KEY_MAP.directOrderEveryN,
      value: Math.min(100, Math.max(1, Math.round(patch.directOrderEveryN))),
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
  if (typeof patch.requireCpfOnInvite === 'boolean') {
    rows.push({
      key: KEY_MAP.requireCpfOnInvite,
      value: patch.requireCpfOnInvite,
      updated_at: now,
      updated_by: updatedBy,
    })
  }

  if (rows.length === 0) return

  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' })
  if (error) {
    throw new Error(`Falha ao salvar configurações: ${error.message}`)
  }

  // Invalida o cache para que as paginas (ex.: /convite) leiam o valor novo.
  revalidateTag(APP_SETTINGS_TAG, 'max')
}
