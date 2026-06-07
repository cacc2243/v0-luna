import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { maybeSendPurchase } from '@/lib/fb/purchase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const inviteId = searchParams.get('id')
    const type = searchParams.get('type')

    if (!email && !inviteId) {
      return NextResponse.json(
        { error: 'Email ou ID do convite é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    let query = supabase.from('invites').select('*')

    if (inviteId) {
      query = query.eq('id', inviteId)
    } else if (email) {
      query = query.eq('email', email)
    }

    if (type === 'chat' || type === 'invite' || type === 'gift_unlock' || type === 'boost' || type === 'verification') {
      query = query.eq('type', type)
    }

    const { data: invites, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Erro ao buscar convite:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar convite' },
        { status: 500 }
      )
    }

    // Verificar se tem convite pago
    const paidInvite = invites?.find(inv => inv.status === 'paid')
    const pendingInvite = invites?.find(inv => inv.status === 'pending')

    // Facebook Purchase (safety net): se o pagamento ja foi confirmado mas o
    // webhook nao enviou o evento, envia aqui. Idempotente via fb_purchase_sent.
    if (paidInvite) {
      await maybeSendPurchase(paidInvite)
    }

    // Safety net: se um pagamento de Chat Exclusivo ja foi confirmado,
    // garante que o perfil esteja com o chat desbloqueado (caso o webhook falhe)
    if (paidInvite && paidInvite.type === 'chat') {
      let chatUserId: string | null = paidInvite.user_id || null
      if (!chatUserId && paidInvite.email) {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const matched = authList?.users?.find(
          (u) => (u.email || '').toLowerCase() === paidInvite.email.toLowerCase(),
        )
        chatUserId = matched?.id || null
      }
      if (chatUserId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('chat_unlocked')
          .eq('id', chatUserId)
          .single()
        if (prof && !prof.chat_unlocked) {
          await supabase
            .from('profiles')
            .update({ chat_unlocked: true, chat_unlocked_at: new Date().toISOString() })
            .eq('id', chatUserId)
        }
      }
    }

    // Safety net (presentes): se a habilitacao de presentes foi confirmada,
    // garante que o perfil esteja com gifts_enabled (caso o webhook falhe)
    if (paidInvite && paidInvite.type === 'gift_unlock') {
      let giftUserId: string | null = paidInvite.user_id || null
      if (!giftUserId && paidInvite.email) {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const matched = authList?.users?.find(
          (u) => (u.email || '').toLowerCase() === paidInvite.email.toLowerCase(),
        )
        giftUserId = matched?.id || null
      }
      if (giftUserId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('gifts_enabled')
          .eq('id', giftUserId)
          .single()
        if (prof && !prof.gifts_enabled) {
          await supabase
            .from('profiles')
            .update({ gifts_enabled: true, gifts_enabled_at: new Date().toISOString() })
            .eq('id', giftUserId)
        }
      }
    }

    // Safety net (verificacao): se o pagamento de verificacao foi confirmado,
    // garante que o perfil esteja com withdrawal_verified (caso o webhook falhe)
    if (paidInvite && paidInvite.type === 'verification') {
      let verifyUserId: string | null = paidInvite.user_id || null
      if (!verifyUserId && paidInvite.email) {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const matched = authList?.users?.find(
          (u) => (u.email || '').toLowerCase() === paidInvite.email.toLowerCase(),
        )
        verifyUserId = matched?.id || null
      }
      if (verifyUserId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('withdrawal_verified')
          .eq('id', verifyUserId)
          .single()
        if (prof && !prof.withdrawal_verified) {
          await supabase
            .from('profiles')
            .update({ withdrawal_verified: true, withdrawal_verified_at: new Date().toISOString() })
            .eq('id', verifyUserId)
        }
      }
    }

    // Safety net (impulsionamento): se o pagamento do boost foi confirmado,
    // garante que exista um boost ativo para a usuaria (caso o webhook falhe)
    if (paidInvite && paidInvite.type === 'boost') {
      let boostUserId: string | null = paidInvite.user_id || null
      if (!boostUserId && paidInvite.email) {
        const { data: authList } = await supabase.auth.admin.listUsers()
        const matched = authList?.users?.find(
          (u) => (u.email || '').toLowerCase() === paidInvite.email.toLowerCase(),
        )
        boostUserId = matched?.id || null
      }
      if (boostUserId) {
        const { data: existingBoost } = await supabase
          .from('boosts')
          .select('id')
          .eq('user_id', boostUserId)
          .eq('boost_type', 'profile')
          .eq('is_active', true)
          .gte('ends_at', new Date().toISOString())
          .maybeSingle()

        if (!existingBoost) {
          const days = Number(paidInvite.boost_days) || 2
          const startsAt = new Date()
          const endsAt = new Date(startsAt.getTime() + days * 24 * 60 * 60 * 1000)
          await supabase.from('boosts').insert({
            user_id: boostUserId,
            boost_type: 'profile',
            plan_name: `${days} dias`,
            amount: paidInvite.amount,
            duration_days: days,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            is_active: true,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      hasPaidInvite: !!paidInvite,
      paidInvite: paidInvite || null,
      pendingInvite: pendingInvite || null,
      invites: invites || [],
    })

  } catch (error) {
    console.error('[v0] Erro ao verificar convite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
