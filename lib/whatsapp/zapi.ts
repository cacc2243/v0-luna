import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Integração com a Z-API (WhatsApp).
 *
 * A conexão do WhatsApp é feita diretamente no painel da Z-API. Aqui apenas
 * consumimos a API REST para verificar o status e enviar mensagens.
 *
 * A configuração (instance id, token e client-token) fica na tabela
 * `app_settings` (key/value) — a mesma usada pelo restante do painel — para
 * manter tudo persistido sem variáveis de ambiente.
 *
 * Docs: https://developer.z-api.io
 *  - Status:       GET  /instances/{id}/token/{token}/status
 *  - Enviar texto: POST /instances/{id}/token/{token}/send-text
 *  Header obrigatório em todas: Client-Token: <account security token>
 */

const KEYS = {
  instanceId: 'whatsapp_zapi_instance_id',
  instanceToken: 'whatsapp_zapi_instance_token',
  clientToken: 'whatsapp_zapi_client_token',
  testMessage: 'whatsapp_test_message',
} as const

export interface ZapiConfig {
  instanceId: string
  instanceToken: string
  clientToken: string
  testMessage: string
}

const DEFAULT_TEST_MESSAGE =
  'Olá! 👋 Seu código de verificação Luna Privé é *123456*. Não compartilhe com ninguém.'

export interface ZapiConfigPublic {
  instanceId: string
  /** Mascarado — nunca devolvemos o token cru ao cliente. */
  hasInstanceToken: boolean
  hasClientToken: boolean
  testMessage: string
  configured: boolean
}

export async function getZapiConfig(): Promise<ZapiConfig> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', Object.values(KEYS))

  const map = new Map((data || []).map((r) => [r.key, r.value]))
  const str = (k: string) => (typeof map.get(k) === 'string' ? (map.get(k) as string) : '')

  return {
    instanceId: str(KEYS.instanceId),
    instanceToken: str(KEYS.instanceToken),
    clientToken: str(KEYS.clientToken),
    testMessage: str(KEYS.testMessage) || DEFAULT_TEST_MESSAGE,
  }
}

export function toPublicConfig(cfg: ZapiConfig): ZapiConfigPublic {
  return {
    instanceId: cfg.instanceId,
    hasInstanceToken: cfg.instanceToken.length > 0,
    hasClientToken: cfg.clientToken.length > 0,
    testMessage: cfg.testMessage,
    configured: isConfigured(cfg),
  }
}

export function isConfigured(cfg: ZapiConfig): boolean {
  return cfg.instanceId.length > 0 && cfg.instanceToken.length > 0 && cfg.clientToken.length > 0
}

export async function saveZapiConfig(patch: Partial<ZapiConfig>): Promise<void> {
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const rows: { key: string; value: any; updated_at: string; updated_by?: string }[] = []

  if (typeof patch.instanceId === 'string') {
    rows.push({ key: KEYS.instanceId, value: patch.instanceId.trim(), updated_at: now, updated_by: 'admin' })
  }
  if (typeof patch.instanceToken === 'string') {
    rows.push({ key: KEYS.instanceToken, value: patch.instanceToken.trim(), updated_at: now, updated_by: 'admin' })
  }
  if (typeof patch.clientToken === 'string') {
    rows.push({ key: KEYS.clientToken, value: patch.clientToken.trim(), updated_at: now, updated_by: 'admin' })
  }
  if (typeof patch.testMessage === 'string') {
    rows.push({ key: KEYS.testMessage, value: patch.testMessage, updated_at: now, updated_by: 'admin' })
  }

  if (rows.length === 0) return

  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' })
  if (error) throw new Error(`Falha ao salvar configuração da Z-API: ${error.message}`)
}

function baseUrl(cfg: ZapiConfig): string {
  return `https://api.z-api.io/instances/${cfg.instanceId}/token/${cfg.instanceToken}`
}

function headers(cfg: ZapiConfig): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Client-Token': cfg.clientToken,
  }
}

export interface ZapiStatus {
  connected: boolean
  smartphoneConnected?: boolean
  error?: string
}

/** Consulta se a instância está conectada a uma conta de WhatsApp. */
export async function fetchStatus(cfg: ZapiConfig): Promise<ZapiStatus> {
  const res = await fetch(`${baseUrl(cfg)}/status`, {
    method: 'GET',
    headers: headers(cfg),
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Z-API status ${res.status}: ${text.slice(0, 200)}`)
  }
  const json = await res.json()
  return {
    connected: Boolean(json?.connected),
    smartphoneConnected: Boolean(json?.smartphoneConnected),
    error: typeof json?.error === 'string' ? json.error : undefined,
  }
}

export interface SendResult {
  ok: boolean
  zaapId?: string
  messageId?: string
  error?: string
}

/** Normaliza um telefone para o formato esperado pela Z-API (só dígitos). */
export function normalizePhone(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '')
  // Se vier sem DDI (11 dígitos = DDD + número), assume Brasil (55).
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`
  }
  return digits
}

/** Envia uma mensagem de texto. */
export async function sendText(
  cfg: ZapiConfig,
  phone: string,
  message: string,
): Promise<SendResult> {
  const res = await fetch(`${baseUrl(cfg)}/send-text`, {
    method: 'POST',
    headers: headers(cfg),
    body: JSON.stringify({ phone, message }),
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const err =
      (json && (json.error || json.message)) || `Falha no envio (HTTP ${res.status})`
    return { ok: false, error: String(err).slice(0, 300) }
  }

  return {
    ok: true,
    zaapId: json?.zaapId,
    messageId: json?.messageId || json?.id,
  }
}
