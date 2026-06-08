import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { getAppSettings } from '@/lib/settings'
import { resolveCashinOrder, type CashinInput } from '@/lib/cashin/gateways'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, amount, name, document, phone, type, boostDays, fbp, fbc, eventSourceUrl, fbEventId } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Sinais de atribuicao do Facebook para o Purchase (Conversions API).
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null
    const clientUa = request.headers.get('user-agent') || null
    const fbAttribution = {
      fbp: typeof fbp === 'string' ? fbp : null,
      fbc: typeof fbc === 'string' ? fbc : null,
      client_ip: clientIp,
      client_ua: clientUa,
      event_source_url: typeof eventSourceUrl === 'string' ? eventSourceUrl : null,
      fb_event_id: typeof fbEventId === 'string' ? fbEventId : null,
    }

    // Tipo de pagamento: 'invite', 'chat', 'gift_unlock', 'boost' ou 'verification' (verificação para saque)
    const inviteType =
      type === 'chat'
        ? 'chat'
        : type === 'gift_unlock'
          ? 'gift_unlock'
          : type === 'boost'
            ? 'boost'
            : type === 'verification'
              ? 'verification'
              : 'invite'

    // SEGURANCA: para o convite, o valor e SEMPRE definido pelo servidor
    // (configuravel no painel). O valor enviado pelo cliente e ignorado para
    // impedir manipulacao. Para os demais tipos, mantem o valor recebido.
    let effectiveAmount = Number(amount)
    const settings = await getAppSettings()
    if (inviteType === 'invite') {
      effectiveAmount = settings.inviteAmountCents / 100
    }

    if (!effectiveAmount || !Number.isFinite(effectiveAmount) || effectiveAmount <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido' },
        { status: 400 }
      )
    }
    const itemTitle =
      inviteType === 'chat'
        ? 'Chat Exclusivo Luna Privé'
        : inviteType === 'gift_unlock'
          ? 'Habilitação de Presentes Luna Privé'
          : inviteType === 'boost'
            ? `Impulsionamento ${boostDays || ''} dias Luna Privé`.replace(/\s+/g, ' ').trim()
            : inviteType === 'verification'
              ? 'Verificação de Conta Luna Privé'
              : 'Convite Luna Privé'

    // Ordena os gateways: ativo (definido no painel) primeiro, demais como fallback.
    const gateways = resolveCashinOrder(settings.activeCashinGateway)
    if (gateways.length === 0) {
      console.error('[v0] Nenhum gateway de cash-in configurado')
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 500 }
      )
    }

    const supabase = createAdminClient()

    // Verificar se já existe um pagamento pendente do mesmo tipo para este email
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('*')
      .eq('email', email)
      .eq('type', inviteType)
      .eq('status', 'pending')
      .gt('pix_expiration', new Date().toISOString())
      .single()

    if (existingInvite && existingInvite.pix_code) {
      return NextResponse.json({
        success: true,
        invite: existingInvite,
        pixCode: existingInvite.pix_code,
        pixQrCode: existingInvite.pix_qrcode,
        expiresAt: existingInvite.pix_expiration,
      })
    }

    // Identificador unico desta cobranca (enviado ao gateway para conciliacao
    // via webhook). Usado tambem como transaction_id quando o gateway nao
    // retorna um id proprio.
    const identifier = `luna-${inviteType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get('origin') ||
      'https://luna-prive.vercel.app'

    const cashinInput: CashinInput = {
      identifier,
      amount: effectiveAmount,
      itemTitle,
      client: {
        name: (name || '').trim(),
        email,
        phone: (phone || '').replace(/\D/g, ''),
        document: (document || '').replace(/\D/g, ''),
      },
      callbackUrl: `${siteUrl}/api/pix/webhook`,
    }

    // Tenta o gateway ativo e, em caso de falha, cai automaticamente nos demais.
    let pixCode = ''
    let gatewayTxId: string | null = null
    let usedGateway: string | null = null
    let lastError: string | null = null

    for (const gateway of gateways) {
      try {
        const result = await gateway.create(cashinInput)
        if (result.ok && result.pixCode) {
          pixCode = result.pixCode
          gatewayTxId = result.transactionId
          usedGateway = gateway.id
          break
        }
        lastError = result.errorMessage || `Falha no gateway ${gateway.id}`
        console.error(`[v0] Gateway ${gateway.id} falhou:`, lastError)
      } catch (err) {
        lastError = err instanceof Error ? err.message : `Erro no gateway ${gateway.id}`
        console.error(`[v0] Erro no gateway ${gateway.id}:`, lastError)
      }
    }

    if (!pixCode) {
      console.error('[v0] Todos os gateways de cash-in falharam:', lastError)
      return NextResponse.json(
        { error: 'Não foi possível gerar o PIX. Tente novamente em instantes.' },
        { status: 500 }
      )
    }

    // transaction_id: prioriza o id do gateway; usa o identifier como fallback.
    const transactionId = gatewayTxId || identifier

    // Expiração do PIX: 5 minutos a partir de agora
    const pixExpirationDate = new Date(Date.now() + 5 * 60 * 1000)

    // Se ja existia um convite pendente sem pix_code, atualizar; senao inserir
    let invite
    if (existingInvite) {
      const { data: updated, error: updateError } = await supabase
        .from('invites')
        .update({
          transaction_id: transactionId,
          pix_code: pixCode,
          pix_qrcode: null,
          boost_days: inviteType === 'boost' ? Number(boostDays) || null : existingInvite.boost_days ?? null,
          pix_expiration: pixExpirationDate.toISOString(),
          ...fbAttribution,
        })
        .eq('id', existingInvite.id)
        .select()
        .single()

      if (updateError) {
        console.error('[v0] Erro ao atualizar convite:', updateError)
        return NextResponse.json({ error: 'Erro ao salvar convite' }, { status: 500 })
      }
      invite = updated
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('invites')
        .insert({
          user_id: userId || null,
          email,
          amount: effectiveAmount,
          type: inviteType,
          boost_days: inviteType === 'boost' ? Number(boostDays) || null : null,
          status: 'pending',
          transaction_id: transactionId,
          pix_code: pixCode,
          pix_qrcode: null,
          pix_expiration: pixExpirationDate.toISOString(),
          ...fbAttribution,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[v0] Erro ao salvar convite:', insertError)
        return NextResponse.json({ error: 'Erro ao salvar convite' }, { status: 500 })
      }
      invite = inserted
    }

    console.log('[v0] PIX gerado via gateway:', usedGateway, '| invite:', invite.id)

    return NextResponse.json({
      success: true,
      invite,
      pixCode: invite.pix_code,
      pixQrCode: invite.pix_qrcode,
      expiresAt: invite.pix_expiration,
      transactionId: invite.transaction_id,
    })
  } catch (error) {
    console.error('[v0] Erro ao criar PIX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
