import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

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

    if (type === 'chat' || type === 'invite') {
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
