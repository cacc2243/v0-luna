import { NextResponse } from 'next/server'
import { getPublicTiktokPixels } from '@/lib/tiktok/pixels'

export const dynamic = 'force-dynamic'

/**
 * Expoe os Pixel IDs do TikTok habilitados para o browser inicializar o pixel
 * (ttq). O Pixel ID nao e um dado sensivel — o Access Token nunca sai daqui.
 */
export async function GET() {
  const pixels = await getPublicTiktokPixels()
  return NextResponse.json({ pixels })
}
