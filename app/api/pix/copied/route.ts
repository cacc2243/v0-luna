import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Marca que o cliente realmente copiou o código PIX do convite.
 * Chamado quando o usuário toca no botão "Copiar código PIX" no modal.
 * Só registra a primeira cópia (não sobrescreve pix_copied_at já existente).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const inviteId = body?.inviteId

    if (!inviteId || typeof inviteId !== 'string') {
      return NextResponse.json({ error: 'inviteId é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Busca o registro para nao sobrescrever a primeira copia
    const { data: invite, error: fetchError } = await supabase
      .from('invites')
      .select('id, pix_copied_at')
      .eq('id', inviteId)
      .maybeSingle()

    if (fetchError) {
      console.error('[v0] Erro ao buscar convite para marcar cópia:', fetchError)
      return NextResponse.json({ error: 'Erro ao registrar cópia' }, { status: 500 })
    }

    if (!invite) {
      return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 })
    }

    // Ja marcado: idempotente, mantem o instante original
    if (invite.pix_copied_at) {
      return NextResponse.json({ success: true, alreadyCopied: true })
    }

    const { error: updateError } = await supabase
      .from('invites')
      .update({ pix_copied_at: new Date().toISOString() })
      .eq('id', inviteId)

    if (updateError) {
      console.error('[v0] Erro ao marcar cópia do PIX:', updateError)
      return NextResponse.json({ error: 'Erro ao registrar cópia' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Erro inesperado ao marcar cópia do PIX:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
