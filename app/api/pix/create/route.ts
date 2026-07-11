import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { getAppSettings } from '@/lib/settings'
import { resolveCashinOrder, type CashinInput } from '@/lib/cashin/gateways'
import { sendTemplateEmail } from '@/lib/email/send'
import { getWebhookUrl } from '@/lib/site-url'
import { sendUtmifyOrder } from '@/lib/utmify/orders'

/** Formata centavos/reais para "R$ 24,80". */
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email, amount, name, document, phone, type, boostDays, fbp, fbc, eventSourceUrl, fbEventId, attribution } = await request.json()

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

    // Atribuicao de marketing (UTMs do Facebook + fbclid). Cada UTM e limitada
    // a 512 chars por seguranca. Salva junto ao invite para relatorios e para
    // reenvio no Purchase (Conversions API).
    const att = (attribution && typeof attribution === 'object' ? attribution : {}) as Record<string, unknown>
    const cleanAttr = (v: unknown): string | null => {
      if (typeof v !== 'string') return null
      const trimmed = v.trim()
      return trimmed ? trimmed.slice(0, 512) : null
    }
    const marketingAttribution = {
      utm_source: cleanAttr(att.utm_source),
      utm_campaign: cleanAttr(att.utm_campaign),
      utm_medium: cleanAttr(att.utm_medium),
      utm_content: cleanAttr(att.utm_content),
      utm_term: cleanAttr(att.utm_term),
      fbclid: cleanAttr(att.fbclid),
      referrer: cleanAttr(att.referrer),
      landing_url: cleanAttr(att.landing_url),
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

    // SEGURANCA: o valor e SEMPRE definido pelo servidor a partir das
    // configuracoes do painel (fonte unica da verdade). O valor enviado pelo
    // cliente e ignorado para impedir manipulacao de preco.
    const settings = await getAppSettings()
    let effectiveAmount: number
    if (inviteType === 'invite') {
      effectiveAmount = settings.inviteAmountCents / 100
    } else if (inviteType === 'chat') {
      effectiveAmount = settings.chatAmountCents / 100
    } else if (inviteType === 'gift_unlock') {
      effectiveAmount = settings.giftUnlockAmountCents / 100
    } else if (inviteType === 'boost') {
      const days = String(boostDays || '')
      const cents = settings.boostAmountCents[days]
      if (!cents) {
        return NextResponse.json(
          { error: 'Plano de impulsionamento inválido' },
          { status: 400 }
        )
      }
      effectiveAmount = cents / 100
    } else if (inviteType === 'verification') {
      effectiveAmount = settings.withdrawalVerificationAmountCents / 100
    } else {
      effectiveAmount = Number(amount)
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

    // URL enviada ao gateway: a Edge Function do Supabase (proxy), nunca o
    // dominio do site. Mantem o dominio real fora do painel do gateway.
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
      callbackUrl: getWebhookUrl(),
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
          gateway: usedGateway,
          boost_days: inviteType === 'boost' ? Number(boostDays) || null : existingInvite.boost_days ?? null,
          pix_expiration: pixExpirationDate.toISOString(),
          ...fbAttribution,
          ...marketingAttribution,
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
          gateway: usedGateway,
          pix_expiration: pixExpirationDate.toISOString(),
          ...fbAttribution,
          ...marketingAttribution,
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

    // Utmify: envia o pedido como "pendente" (waiting_payment) assim que o PIX
    // e gerado. Idempotente e resiliente — nunca quebra o fluxo principal.
    void sendUtmifyOrder(invite, 'waiting_payment').catch((e) =>
      console.error('[v0] Falha ao enviar pedido pendente à Utmify:', (e as Error)?.message),
    )

    // E-mail "PIX do convite gerado": apenas para o Convite de Acesso, pois e o
    // unico fluxo com template dedicado. Nao bloqueia a resposta e nunca quebra
    // o fluxo principal (sendTemplateEmail e resiliente). So envia se o PIX
    // acabou de ser gerado (nao quando reaproveita um convite pendente).
    if (inviteType === 'invite') {
      void sendTemplateEmail('invite_pix', email, {
        name: (name || '').trim() || undefined,
        amount: formatBRL(effectiveAmount),
        pixCode: invite.pix_code,
      }).catch((e) =>
        console.error('[v0] Falha ao enviar e-mail invite_pix:', (e as Error)?.message),
      )
    }

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
