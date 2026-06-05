import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const inviteId = searchParams.get('id')

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
