import { createAdminClient } from '@/lib/supabase/admin'

export interface TaboolaPixel {
  id: string
  label: string
  account_id: string
  enabled: boolean
  created_at: string
}

/** Pixel exposto ao browser (o account_id do Taboola nao e sensivel). */
export interface PublicTaboolaPixel {
  id: string
  label: string
  account_id: string
}

/** Retorna todos os pixels do Taboola habilitados. */
export async function getEnabledTaboolaPixels(): Promise<TaboolaPixel[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('taboola_pixels')
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.log('[v0] getEnabledTaboolaPixels erro:', error.message)
      return []
    }
    return (data as TaboolaPixel[]) || []
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    console.log('[v0] getEnabledTaboolaPixels exception:', msg)
    return []
  }
}

/** Pixels habilitados para uso no browser (somente account_id + label). */
export async function getPublicTaboolaPixels(): Promise<PublicTaboolaPixel[]> {
  const pixels = await getEnabledTaboolaPixels()
  return pixels.map((p) => ({ id: p.id, label: p.label, account_id: p.account_id }))
}

/** Lista completa para o painel admin. */
export async function listTaboolaPixels(): Promise<TaboolaPixel[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('taboola_pixels')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data as TaboolaPixel[]) || []
}
