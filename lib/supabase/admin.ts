import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve a URL do projeto Supabase.
 *
 * Em alguns ambientes so o SUPABASE_PROJECT_REF esta configurado (a integracao
 * expoe o ref, nao a URL completa). Como a URL da API e sempre derivada do ref
 * (`https://<ref>.supabase.co`), usamos isso como fallback em vez de estourar
 * "supabaseUrl is required" e derrubar todo o painel.
 */
export function getSupabaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  if (explicit) return explicit

  const ref = process.env.SUPABASE_PROJECT_REF
  if (ref) return `https://${ref}.supabase.co`

  throw new Error(
    'Supabase nao configurado: defina NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_PROJECT_REF.',
  )
}

/**
 * Admin client for server-side operations that bypass RLS.
 * Use only in API routes where there's no user session context.
 */
export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl()
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    throw new Error('Supabase nao configurado: SUPABASE_SERVICE_ROLE_KEY ausente.')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
