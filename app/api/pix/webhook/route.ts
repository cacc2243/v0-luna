import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse, after } from 'next/server'
import { maybeSendPurchase } from '@/lib/fb/purchase'
import { maybeSendTiktokPurchase } from '@/lib/tiktok/purchase'
import { sendInvitePaidEmailOnce } from '@/lib/email/notify-paid'
import { sendUtmifyOrder } from '@/lib/utmify/orders'
import { notifyAdminSale } from '@/lib/push/notify-sale'
import {
  getBravopaySignatureHeader,
  verifyBravopayWebhook,
} from '@/lib/bravopay/webhook'

/** Primeiro valor string não-vazio dentre os candidatos. */
function pickString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (v === undefined || v === null) continue
    const s = String(v).trim()
    if (s) return s
  }
  return null
}

/** Localiza o nó do pagador dentro de qualquer um dos objetos informados. */
function payerNode(...objs: Array<Record<string, any> | undefined | null>): Record<string, any> {
  for (const o of objs) {
    if (!o || typeof o !== 'object') continue
    const node =
      o.payer || o.debtor || o.client || o.customer || o.buyer || o.debitParty || o.payerInfo
    if (node && typeof node === 'object') return node
  }
  return {}
}

/**
 * Extrai a identificação do pagamento do payload do webhook. Cada adquirente
 * usa um formato diferente, então tentamos várias chaves e nós aninhados:
 *  - E2E (end-to-end id do PIX);
 *  - CPF/nome do pagador (o pagador real, quando o gateway devolve);
 *  - código de autenticação e ID de referência do adquirente.
 * Só retorna o que existir — nunca sobrescreve dados salvos com null.
 */
function extractPaymentIdentity(
  body: Record<string, any>,
  tx: Record<string, any>,
  data: Record<string, any>,
) {
  const p = payerNode(data, tx, body)

  const endToEndId = pickString(
    data.end_to_end_id, data.endToEndId, data.e2e_id, data.e2e, data.e2eId, data.endToEnd, data.end_to_end,
    tx.end_to_end_id, tx.endToEndId, tx.e2e, tx.e2eId, tx.end_to_end,
    body.end_to_end_id, body.endToEndId, body.e2e, body.e2eId, body.end_to_end,
  )

  const payerDocumentRaw = pickString(
    body.payerDocument, body.payer_document, tx.payerDocument, tx.payer_document,
    data.payerDocument, data.payer_document,
    p.document, p.cpf, p.taxId, p.tax_id, p.documentNumber, p.document_number, p.registration,
  )
  const payerDocument = payerDocumentRaw ? payerDocumentRaw.replace(/\D/g, '') || null : null

  const payerName = pickString(
    body.payerName, tx.payerName, data.payerName,
    p.name, p.fullName, p.full_name, p.holderName, p.holder_name,
  )

  const paymentAuthentication = pickString(
    data.authentication, data.authenticationCode, data.authCode, data.nsu, data.authorizationCode,
    tx.authentication, tx.authenticationCode, tx.authCode, tx.nsu,
    body.authentication, body.authenticationCode, body.authCode, body.nsu,
  )

  const paymentReference = pickString(
    data.reference, data.referenceId, data.reference_id, data.referenceCode,
    tx.reference, tx.referenceId, tx.reference_id,
    body.reference, body.referenceId, body.reference_id,
  )

  return { endToEndId, payerDocument, payerName, paymentAuthentication, paymentReference }
}

export async function POST(request: NextRequest) {
  try {
    // Lemos o corpo CRU (nao request.json()) porque a BravoPay assina
    // `${timestamp}.${rawBody}`: re-serializar o JSON muda a string e
    // invalidaria a assinatura. Os demais gateways nao se importam.
    const rawBody = await request.text()

    let body: Record<string, any>
    try {
      body = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      console.log('[v0] Webhook PIX com corpo não-JSON — ignorando.')
      return NextResponse.json(
        { received: true, matched: false, reason: 'invalid_json' },
        { status: 200 }
      )
    }

    // Assinatura HMAC da BravoPay (unico gateway do nosso set que assina).
    // Só validamos quando o header esta presente, para nao afetar os outros.
    const bravopaySignature = getBravopaySignatureHeader(request.headers)
    if (bravopaySignature) {
      const secret = process.env.BRAVOPAY_WEBHOOK_SECRET
      if (!secret) {
        // Sem o secret nao ha como validar. Seguimos processando (o evento
        // ainda precisa casar com um convite nosso), mas registramos o alerta.
        console.warn(
          '[v0] Webhook BravoPay recebido sem BRAVOPAY_WEBHOOK_SECRET configurado — assinatura NÃO validada.'
        )
      } else {
        const check = verifyBravopayWebhook(rawBody, bravopaySignature, secret)
        if (!check.verified) {
          console.error('[v0] Webhook BravoPay com assinatura inválida:', check.reason)
          return NextResponse.json(
            { error: 'Assinatura inválida' },
            { status: 401 }
          )
        }
        console.log('[v0] Webhook BravoPay: assinatura validada.')
      }
    }

    console.log('[v0] Webhook PIX recebido:', JSON.stringify(body, null, 2))

    // O formato do webhook varia por gateway:
    // - Bynet: campos planos (id, status, paid_at)
    // - SigiloPay: aninhado em `transaction` (id, identifier, status, payedAt)
    //   com o tipo de evento em `event` (TRANSACTION_PAID, TRANSACTION_CANCELED...).
    // - HorsePay: campos planos com external_id (number), status (boolean),
    //   client_reference_id (nosso identifier) e end_to_end.
    // - PixUp: "Envelope V2" — os dados ficam em `body.data` (com o
    //   transaction_id tambem espelhado na raiz) e o nosso identifier chega em
    //   `body.data.external_id`. O evento vem em dot notation (cashin.confirmed,
    //   cashin.refunded, cashin.expired) e o status em `body.data.status`
    //   ("confirmed", "refunded", "expired").
    // - DiretoPay: dados em `body.data` com `data.id` (mesmo id retornado na
    //   criacao, salvo como transaction_id), `data.status` ("pending",
    //   "approved", "cancelled", "refund", "chargeback", "expired") e a data
    //   de pagamento em `data.paidAt`. O envelope traz `type: "transaction"`.
    // - BravoPay: envelope { id: "evt_...", type: "transaction.paid", created,
    //   data: {...} }. O tipo vem em `type` (nao em `event`), o id da transacao
    //   em `data.id` (salvo como transaction_id) e o nosso identifier em
    //   `data.external_reference`. Status em MAIUSCULAS (PAID, EXPIRED,
    //   REFUNDED, CHARGEBACK) e pagamento em `data.paid_at`.
    const tx = body.transaction || {}
    const data = body.data || {}
    const event = String(body.event || body.type || '').toUpperCase()

    // Detecta callbacks de infracao da HorsePay (contem infraction_status).
    // Nao alteram o status de pagamento — apenas registramos e respondemos 200.
    const infractionStatus =
      body.infraction_status || tx.infraction_status || data.infraction_status || null

    // Possiveis identificadores da transacao (tentamos casar por qualquer um).
    // Normalizamos para string pois a HorsePay envia external_id como number.
    const candidateIds = [
      tx.id,
      tx.identifier,
      body.id,
      body.transactionId,
      body.transaction_id,
      body.external_id,
      body.externalId,
      body.client_reference_id,
      tx.client_reference_id,
      // PixUp (Envelope V2): dados em body.data, com transaction_id espelhado
      // na raiz e o nosso identifier em data.external_id.
      data.transaction_id,
      data.external_id,
      data.id,
      // BravoPay: o nosso identifier volta em external_reference.
      data.external_reference,
      body.external_reference,
    ]
      .filter((v) => v !== undefined && v !== null && String(v).length > 0)
      .map((v) => String(v))

    const rawStatus = String(
      tx.status || body.status || data.status || body.payment_status || ''
    ).toUpperCase()
    const paidAt =
      tx.payedAt ||
      body.paid_at ||
      body.paidAt ||
      data.confirmed_at ||
      data.paid_at ||
      data.paidAt ||
      body.payment_date ||
      null

    // HorsePay envia `status` como boolean: true = pago, false = falhou/estornado.
    const horsepayBoolStatus =
      typeof body.status === 'boolean'
        ? body.status
        : typeof tx.status === 'boolean'
          ? tx.status
          : null

    // Sem ID = provavelmente um ping de teste do painel do gateway ou um evento
    // sem transacao. A doc da SigiloPay exige responder 2XX, caso contrario ela
    // reenvia a notificacao indefinidamente. Respondemos 200 (recebido/ignorado).
    if (candidateIds.length === 0) {
      console.log('[v0] Webhook sem transaction id — tratado como ping/teste, ignorando.')
      return NextResponse.json(
        { received: true, matched: false, reason: 'no_transaction_id' },
        { status: 200 }
      )
    }

    // Callback de infracao da HorsePay: nao altera o status do pagamento.
    // Apenas registramos e respondemos 200 (a doc exige resposta 2XX).
    if (infractionStatus) {
      console.log(
        '[v0] Callback de infração HorsePay recebido:',
        infractionStatus,
        '| tx:',
        candidateIds.join(', '),
      )
      return NextResponse.json(
        { received: true, matched: false, reason: 'infraction', infraction_status: infractionStatus },
        { status: 200 }
      )
    }

    const supabase = createAdminClient()

    // Buscar convite por qualquer um dos identificadores recebidos.
    const { data: invite, error: findError } = await supabase
      .from('invites')
      .select('*')
      .in('transaction_id', candidateIds)
      .maybeSingle()

    if (findError || !invite) {
      // Transacao nao pertence a nenhum convite nosso (ex.: teste do painel ou
      // transacao de outra origem na mesma conta). Respondemos 200 para a
      // SigiloPay nao reenviar indefinidamente.
      console.log('[v0] Convite não encontrado para transaction:', candidateIds.join(', '), '— ignorando.')
      return NextResponse.json(
        { received: true, matched: false, reason: 'invite_not_found' },
        { status: 200 }
      )
    }

    // Mapear status do gateway para nosso status.
    // SigiloPay usa `event` (TRANSACTION_PAID/CANCELED/REFUNDED) e status COMPLETED.
    let newStatus = invite.status
    // BuckPay: `transaction.processed` = pago, `transaction.created` = pendente.
    // BravoPay: `transaction.paid` = pago, `transaction.expired`/`.failed` =
    // encerrado sem pagamento, `transaction.chargeback` = estorno.
    // `transaction.created` e `transaction.receipt_uploaded` nao alteram status.
    const paidEvent =
      event === 'TRANSACTION_PAID' ||
      event === 'CASHIN.CONFIRMED' ||
      event === 'TRANSACTION.PROCESSED' ||
      event === 'TRANSACTION.PAID'
    const canceledEvent =
      event === 'TRANSACTION_CANCELED' ||
      event === 'TRANSACTION_CANCELLED' ||
      event === 'CASHIN.EXPIRED' ||
      event === 'CASHIN.FAILED' ||
      event === 'TRANSACTION.CANCELED' ||
      event === 'TRANSACTION.CANCELLED' ||
      event === 'TRANSACTION.EXPIRED' ||
      event === 'TRANSACTION.FAILED'
    const refundedEvent =
      event === 'TRANSACTION_REFUNDED' ||
      event === 'CASHIN.REFUNDED' ||
      event === 'TRANSACTION.REFUNDED' ||
      event === 'TRANSACTION.CHARGEBACK'

    // MisticPay envia status em portugues: COMPLETO/FALHA/PENDENTE/CANCELADO.
    if (
      paidEvent ||
      horsepayBoolStatus === true ||
      ['PAID', 'APPROVED', 'COMPLETED', 'CONFIRMED', 'OK', 'COMPLETO'].includes(rawStatus) ||
      ['paid', 'approved', 'completed', 'confirmed'].includes(
        String(tx.status || body.status || data.status || ''),
      )
    ) {
      newStatus = 'paid'
    } else if (
      refundedEvent ||
      ['REFUNDED', 'REFUND', 'CHARGEBACK'].includes(rawStatus)
    ) {
      newStatus = 'refunded'
    } else if (
      canceledEvent ||
      horsepayBoolStatus === false ||
      ['EXPIRED', 'CANCELLED', 'CANCELED', 'FAILED', 'FALHA', 'CANCELADO'].includes(rawStatus)
    ) {
      newStatus = 'expired'
    }

    // Atualizar convite
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'paid') {
      updateData.paid_at = paidAt || new Date().toISOString()

      // Identificação do pagamento (E2E, CPF/nome do pagador, autenticação e
      // referência do adquirente). Só grava o que o gateway retornar; mantém os
      // valores já salvos (ex.: CPF informado no checkout) quando ausente.
      const identity = extractPaymentIdentity(body, tx, data)
      if (identity.endToEndId) updateData.end_to_end_id = identity.endToEndId
      if (identity.payerDocument) updateData.payer_document = identity.payerDocument
      if (identity.payerName) updateData.payer_name = identity.payerName
      if (identity.paymentAuthentication) updateData.payment_authentication = identity.paymentAuthentication
      if (identity.paymentReference) updateData.payment_reference = identity.paymentReference
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

    // A partir daqui, o status ja foi gravado (parte critica concluida). Todos
    // os efeitos colaterais pesados rodam em `after()` — DEPOIS de a resposta
    // 200 ser enviada. Isso e obrigatorio: a PixUp exige resposta em <2s (com
    // timeout de 10s); se o webhook demora (ex.: Facebook Conversions API,
    // Utmify, envio de e-mail ou auth.admin.listUsers() lentos), a PixUp
    // considera falha, retenta 6x e desiste — deixando a venda paga presa em
    // "pending". Com `after()`, a PixUp sempre recebe o 200 rapido.
    after(async () => {
      try {
    // Facebook Purchase (server-side / Conversions API) quando o pagamento e
    // confirmado. Idempotente via flag fb_purchase_sent. A verificacao de saque
    // nao envia Purchase (tratado dentro do helper).
    if (newStatus === 'paid') {
      await maybeSendPurchase({ ...invite, status: 'paid' })
    }

    // TikTok CompletePayment (server-side / Events API) quando o pagamento e
    // confirmado. Idempotente via flag tt_purchase_sent.
    if (newStatus === 'paid') {
      await maybeSendTiktokPurchase({ ...invite, status: 'paid' })
    }

    // Notificacao push para o admin (PWA) quando uma venda e aprovada.
    // Idempotente via flag admin_push_sent (nao dispara em duplicidade com o polling).
    if (newStatus === 'paid') {
      void notifyAdminSale({ ...invite, status: 'paid' }).catch(() => {})
    }

    // Utmify: envia o pedido como "pago" (paid) quando confirmado, com a data
    // de aprovacao. Idempotente via utmify_paid_sent. Tambem garante o envio do
    // pendente caso a geracao do PIX nao o tenha registrado.
    if (newStatus === 'paid') {
      const utmifyInvite = {
        ...invite,
        status: 'paid',
        paid_at: (updateData.paid_at as string) || invite.paid_at,
      }
      void sendUtmifyOrder(utmifyInvite, 'waiting_payment').catch(() => {})
      await sendUtmifyOrder(utmifyInvite, 'paid')
    } else if (newStatus === 'refunded') {
      // Reembolso: a Utmify so atualiza pedidos ja existentes pelo orderId.
      void sendUtmifyOrder(
        { ...invite, status: 'refunded', refunded_at: new Date().toISOString() },
        'refunded',
      ).catch(() => {})
    }

    // E-mail "Acesso liberado" para o Convite de Acesso pago. Idempotente:
    // so envia uma vez por destinatario (checa email_logs internamente).
    if (newStatus === 'paid') {
      await sendInvitePaidEmailOnce(invite)
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
      } catch (sideEffectError) {
        // Efeitos colaterais nunca devem afetar a resposta ja enviada a PixUp.
        console.error('[v0] Erro nos efeitos colaterais do webhook:', sideEffectError)
      }
    })

    // Resposta rapida (parte critica ja persistida). Efeitos colaterais rodam
    // em `after()`, sem bloquear este 200.
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
