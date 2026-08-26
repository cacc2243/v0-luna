import { createAdminClient } from '@/lib/supabase/admin'

export interface TiktokPixel {
  id: string
  label: string
  pixel_id: string
  /** Opcional: sem token o pixel funciona apenas no navegador (ttq). */
  access_token: string | null
  test_event_code: string | null
  enabled: boolean
  created_at: string
}

/** Pixel exposto ao browser: nunca inclui o access_token. */
export interface PublicTiktokPixel {
  id: string
  label: string
  pixel_id: string
}

/** Retorna todos os pixels do TikTok habilitados (uso server-side). */
export async function getEnabledTiktokPixels(): Promise<TiktokPixel[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('tiktok_pixels')
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.log('[v0] getEnabledTiktokPixels erro:', error.message)
      return []
    }
    return (data as TiktokPixel[]) || []
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    console.log('[v0] getEnabledTiktokPixels exception:', msg)
    return []
  }
}

/**
 * Pixels habilitados que possuem access_token, ou seja, aptos a receber
 * eventos server-side pela Events API. Os demais ficam so no navegador.
 */
export async function getTiktokPixelsWithToken(): Promise<TiktokPixel[]> {
  const pixels = await getEnabledTiktokPixels()
  return pixels.filter((p) => Boolean(p.access_token && p.access_token.trim()))
}

/** Pixels habilitados sem dados sensiveis (uso no browser). */
export async function getPublicTiktokPixels(): Promise<PublicTiktokPixel[]> {
  const pixels = await getEnabledTiktokPixels()
  return pixels.map((p) => ({ id: p.id, label: p.label, pixel_id: p.pixel_id }))
}

/** Lista completa para o painel admin. */
export async function listTiktokPixels(): Promise<TiktokPixel[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tiktok_pixels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data as TiktokPixel[]) || []
}
