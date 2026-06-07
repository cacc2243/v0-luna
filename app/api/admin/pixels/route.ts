import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { listPixels } from '@/lib/fb/pixels'
import { sendTestEvent } from '@/lib/fb/capi'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const pixels = await listPixels()
    // Nao expor o access token completo no painel: mascarar.
    const safe = pixels.map((p) => ({
      id: p.id,
      label: p.label,
      pixel_id: p.pixel_id,
      access_token_masked: maskToken(p.access_token),
      test_event_code: p.test_event_code,
      enabled: p.enabled,
      created_at: p.created_at,
    }))
    return NextResponse.json({ pixels: safe })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Acao de teste: envia um evento de teste para o pixel informado.
  if (body.action === 'test') {
    const pixelId = String(body.pixelId || '').trim()
    const accessToken = String(body.accessToken || '').trim()
    const testCode = body.testEventCode ? String(body.testEventCode).trim() : null
    if (!pixelId || !accessToken) {
      return NextResponse.json(
        { error: 'Pixel ID e Access Token são obrigatórios para o teste.' },
        { status: 400 },
      )
    }
    const result = await sendTestEvent(pixelId, accessToken, testCode)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }

  const pixelId = String(body.pixel_id || '').trim()
  const accessToken = String(body.access_token || '').trim()
  const label = String(body.label || '').trim()
  const testEventCode = body.test_event_code ? String(body.test_event_code).trim() : null

  if (!pixelId || !accessToken) {
    return NextResponse.json(
      { error: 'Pixel ID e Access Token são obrigatórios.' },
      { status: 400 },
    )
  }
  if (!/^\d{6,20}$/.test(pixelId)) {
    return NextResponse.json(
      { error: 'Pixel ID inválido. Deve conter apenas números (6 a 20 dígitos).' },
      { status: 400 },
    )
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('fb_pixels')
      .insert({
        label,
        pixel_id: pixelId,
        access_token: accessToken,
        test_event_code: testEventCode,
        enabled: true,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, id: data.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const id = String(body.id || '').trim()
  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (typeof body.enabled === 'boolean') update.enabled = body.enabled
  if (typeof body.label === 'string') update.label = body.label.trim()
  if (typeof body.test_event_code === 'string')
    update.test_event_code = body.test_event_code.trim() || null
  if (typeof body.access_token === 'string' && body.access_token.trim())
    update.access_token = body.access_token.trim()

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('fb_pixels').update(update).eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const id = new URL(req.url).searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('fb_pixels').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function maskToken(token: string): string {
  if (!token) return ''
  if (token.length <= 8) return '••••'
  return `${token.slice(0, 4)}••••${token.slice(-4)}`
}
