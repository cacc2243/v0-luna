import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPixupWebhookSignature } from '@/lib/pixup/client'
import { verifyHorsepayWebhookSignature } from '@/lib/horsepay/client'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Webhook de postback do cashout (verificacao de chave PIX) da PixUp.
 *
 * Envelope V2:
 *   { event, timestamp, transaction_id, data: {...} }
 *
 * Eventos tratados:
 *   - cashout.confirmed -> liquidado com sucesso (status 'completed')
 *   - cashout.failed    -> rejeitado, saldo refundado (status 'failed', permite retry)
 *   - cashout.refunded  -> estornado apos confirmacao (status 'failed')
 *
 * Seguranca:
 *   - Valida HMAC (X-Webhook-Signature) sobre o body RAW quando o secret
 *     estiver configurado (PIXUP_WEBHOOK_SECRET).
 *   - Anti-replay via janela de +-5min no X-Webhook-Timestamp.
 *   - Idempotencia via transaction_id.
 */
export async function POST(request: NextRequest) {
  try {
    // IMPORTANTE: ler o body RAW antes de qualquer parse para validar HMAC.
    const rawBody = await request.text()

    const signature = request.headers.get('x-webhook-signature')
    const tsHeader = request.headers.get('x-webhook-timestamp')
    const isSandbox = request.headers.get('x-sandbox') === '1'

    // Anti-replay: rejeita timestamps fora da janela de +-5 minutos.
    if (tsHeader) {
      const ts = parseInt(tsHeader, 10)
      if (!Number.isNaN(ts) && Math.abs(Date.now() / 1000 - ts) > 300) {
        console.error('[v0] Webhook PixUp rejeitado: timestamp fora da janela')
        return NextResponse.json({ error: 'Timestamp inválido' }, { status: 401 })
      }
    }

    // Valida assinatura HMAC quando o secret estiver disponivel.
    const webhookSecret = process.env.PIXUP_WEBHOOK_SECRET
    if (webhookSecret) {
      const valid = verifyPixupWebhookSignature(rawBody, signature, webhookSecret)
      if (!valid) {
        console.error('[v0] Webhook PixUp rejeitado: assinatura HMAC inválida')
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
      }
    } else {
      console.warn(
        '[v0] PIXUP_WEBHOOK_SECRET não configurado — webhook aceito sem validação HMAC.'
      )
    }

    const body = JSON.parse(rawBody || '{}')
    console.log('[v0] Webhook cashout PixUp:', body?.event, '| sandbox:', isSandbox)

    // Em producao, ignora eventos de sandbox.
    if (isSandbox && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ received: true, ignored: 'sandbox' }, { status: 200 })
    }

    const event = (body?.event || '').toString().toLowerCase()
    const data = body?.data || {}
    const transactionId = data.transaction_id || body.transaction_id || null
    const externalId = data.external_id || null

    if (!transactionId && !externalId) {
      return NextResponse.json({ error: 'Identificador não encontrado' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Localiza por transaction_id; fallback para external_id.
    let query = supabase.from('pix_verifications').select('*')
    query = transactionId
      ? query.eq('transaction_id', transactionId)
      : query.eq('external_id', externalId)

    const { data: verification, error: findError } = await query.limit(1).single()

    if (findError || !verification) {
      console.error(
        '[v0] Verificação não encontrada (tx:', transactionId, '/ ext:', externalId, ')'
      )
      // Responde 200 para evitar retries infinitos de um evento orfao.
      return NextResponse.json({ received: true, matched: false }, { status: 200 })
    }

    // Mapeia o evento da PixUp para o nosso enum.
    let newStatus = verification.status
    let lastError: string | null = verification.last_error || null
    let endToEndId: string | null = verification.end_to_end_id || null

    if (event === 'cashout.confirmed') {
      newStatus = 'completed'
      lastError = null
      endToEndId = data.hash || data.e2e_id || endToEndId
    } else if (event === 'cashout.failed') {
      newStatus = 'failed'
      lastError = (data.error_message || data.error_code || 'Cashout falhou na PixUp')
        .toString()
        .slice(0, 500)
    } else if (event === 'cashout.refunded') {
      newStatus = 'failed'
      lastError = `Cashout estornado: ${data.reason || 'PROVIDER_REVERSAL'}`
    } else {
      // Evento nao relacionado a cashout: ignora sem alterar estado.
      return NextResponse.json({ received: true, ignored: event }, { status: 200 })
    }

    const { error: updateError } = await supabase
      .from('pix_verifications')
      .update({ status: newStatus, last_error: lastError, end_to_end_id: endToEndId })
      .eq('id', verification.id)

    if (updateError) {
      console.error('[v0] Erro ao atualizar verificação:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar verificação' }, { status: 500 })
    }

    console.log('[v0] Verificação atualizada:', verification.id, '->', newStatus)
    return NextResponse.json({ received: true, status: newStatus }, { status: 200 })
  } catch (error) {
    console.error('[v0] Erro no webhook de cashout PixUp:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook cashout PixUp ativo' })
}
