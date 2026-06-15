import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getZapiConfig, isConfigured, fetchStatus } from '@/lib/whatsapp/zapi'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const cfg = await getZapiConfig()
  if (!isConfigured(cfg)) {
    return NextResponse.json({ configured: false, connected: false })
  }

  try {
    const status = await fetchStatus(cfg)
    return NextResponse.json({ configured: true, ...status })
  } catch (e: any) {
    return NextResponse.json({
      configured: true,
      connected: false,
      error: e?.message || 'Falha ao consultar status',
    })
  }
}
