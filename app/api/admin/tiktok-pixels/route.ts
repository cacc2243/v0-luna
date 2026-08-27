import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { listTiktokPixels } from '@/lib/tiktok/pixels'
import { sendTiktokTestEvent } from '@/lib/tiktok/events-api'

export const dynamic = 'force-dynamic'

/** Pixel ID do TikTok: 16 a 24 caracteres alfanumericos maiusculos. */
const PIXEL_ID_RE = /^[A-Z0-9]{10,32}$/

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const pixels = await listTiktokPixels()
    // Nao expor o access token completo no painel: mascarar.
    const safe = pixels.map((p) => ({
      id: p.id,
      label: p.label,
      pixel_id: p.pixel_id,
      access_token_masked: maskToken(p.access_token),
      has_token: Boolean(p.access_token && p.access_token.trim()),
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
    const pixelId = String(body.pixelId || '').trim().toUpperCase()
    const accessToken = String(body.accessToken || '').trim()
    const testCode = body.testEventCode ? String(body.testEventCode).trim() : null
    if (!pixelId || !accessToken) {
      return NextResponse.json(
        { error: 'Pixel ID e Access Token são obrigatórios para o teste.' },
        { status: 400 },
      )
    }
    const result = await sendTiktokTestEvent(pixelId, accessToken, testCode)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  }

  const pixelId = String(body.pixel_id || '').trim().toUpperCase()
  const accessToken = String(body.access_token || '').trim()
  const label = String(body.label || '').trim()
  const testEventCode = body.test_event_code ? String(body.test_event_code).trim() : null

  if (!pixelId) {
    return NextResponse.json({ error: 'O Pixel ID do TikTok é obrigatório.' }, { status: 400 })
  }
  if (!PIXEL_ID_RE.test(pixelId)) {
    return NextResponse.json(
      { error: 'Pixel ID inválido. Use apenas letras e números (ex.: DA7MQU3C77UES9743UEG).' },
      { status: 400 },
    )
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('tiktok_pixels')
      .insert({
        label,
        pixel_id: pixelId,
        // Access Token e opcional: sem ele o pixel roda apenas no navegador.
        access_token: accessToken || null,
        test_event_code: testEventCode,
        enabled: true,
      })
      .select('id')
      .single()

    if (error) {
      // 23505 = unique_violation: o pixel_id ja esta cadastrado. Cada linha
      // ativa recebe uma copia do evento, entao duplicar contaria em dobro.
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Este Pixel ID já está cadastrado.' },
          { status: 409 },
        )
      }
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
  if (typeof body.access_token === 'string') {
    // String vazia remove o token (volta a funcionar so no navegador).
    update.access_token = body.access_token.trim() || null
  }
  if (typeof body.pixel_id === 'string' && body.pixel_id.trim()) {
    const pixelId = body.pixel_id.trim().toUpperCase()
    if (!PIXEL_ID_RE.test(pixelId)) {
      return NextResponse.json({ error: 'Pixel ID inválido.' }, { status: 400 })
    }
    update.pixel_id = pixelId
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('tiktok_pixels').update(update).eq('id', id)
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Este Pixel ID já está cadastrado em outro registro.' },
          { status: 409 },
        )
      }
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
    const { error } = await supabase.from('tiktok_pixels').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function maskToken(token: string | null): string {
  if (!token) return ''
  if (token.length <= 8) return '••••'
  return `${token.slice(0, 4)}••••${token.slice(-4)}`
}
