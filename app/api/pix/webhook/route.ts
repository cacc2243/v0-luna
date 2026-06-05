import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[v0] Webhook PIX recebido:', JSON.stringify(body, null, 2))

    // Extrair dados do webhook (formato pode variar dependendo do gateway)
    const transactionId = body.id || body.transactionId || body.external_id || body.externalId
    const status = body.status || body.payment_status
    const paidAt = body.paid_at || body.paidAt || body.payment_date

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID não encontrado' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar convite pela transaction_id
    const { data: invite, error: findError } = await supabase
      .from('invites')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (findError || !invite) {
      console.error('[v0] Convite não encontrado para transaction:', transactionId)
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      )
    }

    // Mapear status do gateway para nosso status
    let newStatus = invite.status
    if (status === 'paid' || status === 'approved' || status === 'completed' || status === 'PAID') {
      newStatus = 'paid'
    } else if (status === 'expired' || status === 'EXPIRED') {
      newStatus = 'expired'
    } else if (status === 'refunded' || status === 'REFUNDED') {
      newStatus = 'refunded'
    } else if (status === 'cancelled' || status === 'canceled' || status === 'CANCELLED') {
      newStatus = 'expired'
    }

    // Atualizar convite
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'paid') {
      updateData.paid_at = paidAt || new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('invites')
      .update(updateData)
      .eq('id', invite.id)

    if (updateError) {
      console.error('[v0] Erro ao atualizar convite:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar convite' },
        { status: 500 }
      )
    }

    console.log('[v0] Convite atualizado:', invite.id, 'Status:', newStatus)

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      status: newStatus,
    })

  } catch (error) {
    console.error('[v0] Erro no webhook PIX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Aceitar GET para verificação do webhook
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook PIX ativo' })
}
