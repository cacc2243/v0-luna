import { createAdminClient } from '@/lib/supabase/admin'

export interface FbPixel {
  id: string
  label: string
  pixel_id: string
  access_token: string
  test_event_code: string | null
  enabled: boolean
  created_at: string
}

/** Pixel exposto ao browser: nunca inclui o access_token. */
export interface PublicPixel {
  id: string
  label: string
  pixel_id: string
  test_event_code: string | null
}

/** Retorna todos os pixels habilitados (uso server-side / CAPI). */
export async function getEnabledPixels(): Promise<FbPixel[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('fb_pixels')
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.log('[v0] getEnabledPixels erro:', error.message)
      return []
    }
    return (data as FbPixel[]) || []
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    console.log('[v0] getEnabledPixels exception:', msg)
    return []
  }
}

/** Pixels habilitados sem dados sensiveis (uso no browser). */
export async function getPublicPixels(): Promise<PublicPixel[]> {
  const pixels = await getEnabledPixels()
  return pixels.map((p) => ({
    id: p.id,
    label: p.label,
    pixel_id: p.pixel_id,
    test_event_code: p.test_event_code,
  }))
}

/** Lista completa para o painel admin. */
export async function listPixels(): Promise<FbPixel[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('fb_pixels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data as FbPixel[]) || []
}
