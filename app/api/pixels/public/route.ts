import { NextResponse } from 'next/server'
import { getPublicPixels } from '@/lib/fb/pixels'

export const dynamic = 'force-dynamic'

/**
 * Expoe apenas os Pixel IDs habilitados para o browser inicializar o fbq.
 * O access token NUNCA e retornado aqui.
 */
export async function GET() {
  const pixels = await getPublicPixels()
  return NextResponse.json({ pixels })
}
