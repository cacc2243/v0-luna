import { createAdminClient } from '@/lib/supabase/admin'
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

    const supabase = createAdminClient()

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

    // Se for um pagamento de Chat Exclusivo confirmado, desbloqueia o chat da usuaria
    if (newStatus === 'paid' && invite.type === 'chat') {
      let chatUserId: string | null = invite.user_id || null

      // Se nao houver user_id no invite, tenta localizar pelo email do perfil/auth
      if (!chatUserId && invite.email) {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const matched = authList?.users?.find(
          (u) => (u.email || '').toLowerCase() === invite.email.toLowerCase(),
        )
        chatUserId = matched?.id || null
      }

      if (chatUserId) {
        const { error: chatErr } = await supabase
          .from('profiles')
          .update({
            chat_unlocked: true,
            chat_unlocked_at: new Date().toISOString(),
          })
          .eq('id', chatUserId)

        if (chatErr) {
          console.error('[v0] Erro ao desbloquear chat:', chatErr)
        } else {
          console.log('[v0] Chat exclusivo desbloqueado para usuaria:', chatUserId)
          await supabase.from('notifications').insert({
            user_id: chatUserId,
            type: 'message',
            title: 'Chat Exclusivo liberado',
            description: 'Seu Chat Exclusivo foi ativado. Agora você pode aceitar vendas e conversar com seus clientes.',
            reference_id: invite.id,
          })
        }
      } else {
        console.error('[v0] Nao foi possivel identificar a usuaria do chat para o invite:', invite.id)
      }
    }

    // Se for um pagamento de Habilitacao de Presentes confirmado, ativa os presentes da usuaria
    if (newStatus === 'paid' && invite.type === 'gift_unlock') {
      let giftUserId: string | null = invite.user_id || null

      if (!giftUserId && invite.email) {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const matched = authList?.users?.find(
          (u) => (u.email || '').toLowerCase() === invite.email.toLowerCase(),
        )
        giftUserId = matched?.id || null
      }

      if (giftUserId) {
        const { error: giftErr } = await supabase
          .from('profiles')
          .update({
            gifts_enabled: true,
            gifts_enabled_at: new Date().toISOString(),
          })
          .eq('id', giftUserId)

        if (giftErr) {
          console.error('[v0] Erro ao habilitar presentes:', giftErr)
        } else {
          console.log('[v0] Presentes habilitados para usuaria:', giftUserId)
          await supabase.from('notifications').insert({
            user_id: giftUserId,
            type: 'message',
            title: 'Presentes habilitados',
            description: 'Sua conta agora pode receber presentes. Resgate os presentes recebidos no chat e converta em saldo.',
            reference_id: invite.id,
          })
        }
      } else {
        console.error('[v0] Nao foi possivel identificar a usuaria para habilitar presentes:', invite.id)
      }
    }

    // Se for um pagamento de Verificacao de Conta confirmado, libera os saques da usuaria
    if (newStatus === 'paid' && invite.type === 'verification') {
      let verifyUserId: string | null = invite.user_id || null

      if (!verifyUserId && invite.email) {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const matched = authList?.users?.find(
          (u) => (u.email || '').toLowerCase() === invite.email.toLowerCase(),
        )
        verifyUserId = matched?.id || null
      }

      if (verifyUserId) {
        const { error: verifyErr } = await supabase
          .from('profiles')
          .update({
            withdrawal_verified: true,
            withdrawal_verified_at: new Date().toISOString(),
          })
          .eq('id', verifyUserId)

        if (verifyErr) {
          console.error('[v0] Erro ao verificar conta:', verifyErr)
        } else {
          console.log('[v0] Conta verificada para saques:', verifyUserId)
          await supabase.from('notifications').insert({
            user_id: verifyUserId,
            type: 'message',
            title: 'Conta verificada',
            description: 'Sua conta foi verificada com sucesso. Agora você pode solicitar saques.',
            reference_id: invite.id,
          })
        }
      } else {
        console.error('[v0] Nao foi possivel identificar a usuaria para verificar conta:', invite.id)
      }
    }

    // Se for um pagamento de Impulsionamento confirmado, cria o boost ativo da usuaria
    if (newStatus === 'paid' && invite.type === 'boost') {
      let boostUserId: string | null = invite.user_id || null

      if (!boostUserId && invite.email) {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const matched = authList?.users?.find(
          (u) => (u.email || '').toLowerCase() === invite.email.toLowerCase(),
        )
        boostUserId = matched?.id || null
      }

      if (boostUserId) {
        const days = Number(invite.boost_days) || 2
        const startsAt = new Date()
        const endsAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000)

        // Evita duplicar o boost caso o webhook chegue mais de uma vez
        const { data: existingBoost } = await supabase
          .from('boosts')
          .select('id')
          .eq('user_id', boostUserId)
          .eq('boost_type', 'profile')
          .eq('is_active', true)
          .gte('ends_at', new Date().toISOString())
          .maybeSingle()

        if (!existingBoost) {
          const { error: boostErr } = await supabase.from('boosts').insert({
            user_id: boostUserId,
            boost_type: 'profile',
            plan_name: `${days} dias`,
            amount: invite.amount,
            duration_days: days,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            is_active: true,
          })

          if (boostErr) {
            console.error('[v0] Erro ao criar boost:', boostErr)
          } else {
            console.log('[v0] Impulsionamento ativado para usuaria:', boostUserId, `(${days} dias)`)
            await supabase.from('notifications').insert({
              user_id: boostUserId,
              type: 'message',
              title: 'Impulsionamento ativado',
              description: `Seu perfil está em destaque por ${days} dias. Aproveite o aumento de visibilidade!`,
              reference_id: invite.id,
            })
          }
        }
      } else {
        console.error('[v0] Nao foi possivel identificar a usuaria para o impulsionamento:', invite.id)
      }
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
