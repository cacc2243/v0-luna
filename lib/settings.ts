import { createAdminClient } from '@/lib/supabase/admin'

export interface AppSettings {
  verificationEnabled: boolean
  activeCashoutGateway: string
  verificationAmountCents: number
}

const DEFAULTS: AppSettings = {
  verificationEnabled: true,
  activeCashoutGateway: 'pixup',
  verificationAmountCents: 90,
}

const KEY_MAP = {
  verificationEnabled: 'verification_enabled',
  activeCashoutGateway: 'active_cashout_gateway',
  verificationAmountCents: 'verification_amount_cents',
} as const

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

  const rawAmount = map.get(KEY_MAP.verificationAmountCents)
  const verificationAmountCents =
    typeof rawAmount === 'number' && Number.isFinite(rawAmount)
      ? Math.round(rawAmount)
      : DEFAULTS.verificationAmountCents

  return {
    verificationEnabled,
    activeCashoutGateway,
    verificationAmountCents,
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
  if (typeof patch.verificationAmountCents === 'number') {
    rows.push({
      key: KEY_MAP.verificationAmountCents,
      value: Math.round(patch.verificationAmountCents),
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
