import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getZapiConfig, isConfigured, fetchQrCode } from '@/lib/whatsapp/zapi'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const cfg = await getZapiConfig()
  if (!isConfigured(cfg)) {
    return NextResponse.json({ error: 'Configure a Z-API primeiro.' }, { status: 400 })
  }

  try {
    const qr = await fetchQrCode(cfg)
    return NextResponse.json({ qr })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Falha ao obter QR Code' }, { status: 502 })
  }
}
