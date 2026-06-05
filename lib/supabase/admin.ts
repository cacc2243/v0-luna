import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Admin client for server-side operations that bypass RLS.
 * Use only in API routes where there's no user session context.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
