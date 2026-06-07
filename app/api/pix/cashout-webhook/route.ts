import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Webhook de postback do cashout (verificacao de chave PIX) da Bynet.
 * Atualiza o registro em pix_verifications conforme o status liquidado.
 * Nada sensivel e exposto; apenas atualiza estado de auditoria.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    console.log('[v0] Webhook cashout recebido:', JSON.stringify(body, null, 2))

    const data = body?.data || body || {}
    const transactionId =
      data.id || data.transactionId || body.id || body.transactionId || null
    const rawStatus = (data.status || body.status || '').toString().toUpperCase()

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID não encontrado' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: verification, error: findError } = await supabase
      .from('pix_verifications')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (findError || !verification) {
      console.error('[v0] Verificação não encontrada para transaction:', transactionId)
      return NextResponse.json({ error: 'Verificação não encontrada' }, { status: 404 })
    }

    // Mapeia o status da Bynet para o nosso enum
    let newStatus = verification.status
    let lastError: string | null = verification.last_error || null

    if (['COMPLETED', 'PAID', 'APPROVED', 'DONE', 'SUCCESS'].includes(rawStatus)) {
      newStatus = 'completed'
      lastError = null
    } else if (['FAILED', 'ERROR', 'REJECTED', 'CANCELLED', 'CANCELED', 'REFUNDED'].includes(rawStatus)) {
      newStatus = 'failed'
      lastError = `Cashout retornou status ${rawStatus}`
    } else {
      newStatus = 'pending'
    }

    const { error: updateError } = await supabase
      .from('pix_verifications')
      .update({ status: newStatus, last_error: lastError })
      .eq('id', verification.id)

    if (updateError) {
      console.error('[v0] Erro ao atualizar verificação:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar verificação' }, { status: 500 })
    }

    console.log('[v0] Verificação atualizada:', verification.id, 'Status:', newStatus)
    return NextResponse.json({ success: true, verificationId: verification.id, status: newStatus })
  } catch (error) {
    console.error('[v0] Erro no webhook de cashout:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook cashout ativo' })
}
