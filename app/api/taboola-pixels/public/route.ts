import { NextResponse } from 'next/server'
import { getPublicTaboolaPixels } from '@/lib/taboola/pixels'

export const dynamic = 'force-dynamic'

/**
 * Expoe os Account IDs do Taboola habilitados para o browser inicializar o
 * pixel (tfa.js). O Account ID do Taboola nao e um dado sensivel.
 */
export async function GET() {
  const pixels = await getPublicTaboolaPixels()
  return NextResponse.json({ pixels })
}
