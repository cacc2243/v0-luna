import { type NextRequest, NextResponse } from 'next/server'
import { sendServerEvent } from '@/lib/fb/capi'
import { getAppSettings } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Dispara o evento InitiateCheckout pela Conversions API (server-side).
 *
 * O disparo no navegador (pixel) costuma ser bloqueado por bloqueadores de
 * anuncio, iOS e extensoes. Para nao perder o evento, replicamos pela CAPI
 * usando o MESMO event_id do pixel, o que permite ao Facebook deduplicar e
 * contar apenas uma vez. Os sinais fbp/fbc/IP/UA aumentam a correspondencia.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { eventId, eventSourceUrl, fbp, fbc, email, value, attribution } = body as {
      eventId?: string
      eventSourceUrl?: string | null
      fbp?: string | null
      fbc?: string | null
      email?: string | null
      value?: number
      attribution?: Record<string, unknown> | null
    }

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: 'eventId obrigatório' }, { status: 400 })
    }

    // Valor: confia no painel como fonte da verdade, mas aceita o enviado.
    let amount = typeof value === 'number' && value > 0 ? value : 0
    if (!amount) {
      const settings = await getAppSettings()
      amount = (settings.inviteAmountCents || 0) / 100
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null
    const clientUa = request.headers.get('user-agent') || null

    // fbc derivado do fbclid quando o cookie nao existe.
    const att = (attribution && typeof attribution === 'object' ? attribution : {}) as Record<
      string,
      unknown
    >
    const fbclid = typeof att.fbclid === 'string' ? att.fbclid : null
    const resolvedFbc = fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : null)

    const attributionData: Record<string, unknown> = {}
    for (const key of ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term']) {
      if (typeof att[key] === 'string' && att[key]) attributionData[key] = att[key]
    }

    await sendServerEvent({
      eventName: 'InitiateCheckout',
      eventId,
      eventSourceUrl: typeof eventSourceUrl === 'string' ? eventSourceUrl : null,
      actionSource: 'website',
      value: amount,
      currency: 'BRL',
      customData: {
        content_name: 'Convite Luna Privé',
        content_type: 'product',
        ...attributionData,
      },
      user: {
        email: typeof email === 'string' ? email : null,
        fbp: typeof fbp === 'string' ? fbp : null,
        fbc: resolvedFbc,
        clientIp,
        clientUa,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    console.log('[v0] InitiateCheckout CAPI erro:', msg)
    // Nunca quebra o fluxo do cliente.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
