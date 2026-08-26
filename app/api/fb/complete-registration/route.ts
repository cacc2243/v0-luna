import { type NextRequest, NextResponse } from 'next/server'
import { sendServerEvent } from '@/lib/fb/capi'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Dispara o evento CompleteRegistration pela Conversions API (server-side),
 * no momento em que a conta e criada com sucesso no cadastro.
 *
 * O disparo no navegador (pixel) costuma ser bloqueado por bloqueadores de
 * anuncio, iOS e extensoes — e no cadastro ha um agravante: logo apos o evento
 * o app navega para /convite, o que pode cancelar o request do pixel. Para nao
 * perder o evento, replicamos pela CAPI usando o MESMO event_id do pixel, o
 * que permite ao Facebook deduplicar e contar apenas uma vez.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { eventId, eventSourceUrl, fbp, fbc, email, name, firstName, lastName, phone, attribution } =
      body as {
        eventId?: string
        eventSourceUrl?: string | null
        fbp?: string | null
        fbc?: string | null
        email?: string | null
        name?: string | null
        firstName?: string | null
        lastName?: string | null
        phone?: string | null
        attribution?: Record<string, unknown> | null
      }

    if (!eventId || typeof eventId !== 'string') {
      return NextResponse.json({ error: 'eventId obrigatório' }, { status: 400 })
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

    // Deriva nome/sobrenome a partir do nome completo quando nao vierem prontos.
    const fullName = typeof name === 'string' ? name.trim() : ''
    const resolvedFirstName =
      (typeof firstName === 'string' && firstName.trim()) ||
      (fullName ? fullName.split(/\s+/)[0] : null)
    const resolvedLastName =
      (typeof lastName === 'string' && lastName.trim()) ||
      (fullName && fullName.split(/\s+/).length > 1
        ? fullName.split(/\s+/).slice(1).join(' ')
        : null)

    await sendServerEvent({
      eventName: 'CompleteRegistration',
      eventId,
      eventSourceUrl: typeof eventSourceUrl === 'string' ? eventSourceUrl : null,
      actionSource: 'website',
      customData: {
        content_name: 'Cadastro Luna Privé',
        status: true,
        ...attributionData,
      },
      user: {
        email: typeof email === 'string' ? email : null,
        phone: typeof phone === 'string' ? phone : null,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        country: 'br',
        fbp: typeof fbp === 'string' ? fbp : null,
        fbc: resolvedFbc,
        clientIp,
        clientUa,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro desconhecido'
    console.log('[v0] CompleteRegistration CAPI erro:', msg)
    // Nunca quebra o fluxo do cadastro.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
