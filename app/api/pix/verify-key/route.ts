import { createAdminClient } from '@/lib/supabase/admin'
import { getAppSettings } from '@/lib/settings'
import { getCashoutGateway, type CashoutInput } from '@/lib/cashout/gateways'
import { getSiteUrl } from '@/lib/site-url'
import { NextRequest, NextResponse } from 'next/server'

// Tipos de chave PIX normalizados (maiusculo no banco/gateways).
type PixType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'

// Nome de fallback para o recebedor (a chave PIX real e o que importa)
const FALLBACK_RECEIVER_NAME = 'Beneficiario Luna Prive'

// Normaliza o tipo recebido do front (rotulos em PT) para o enum interno.
function normalizePixType(raw: string): PixType {
  const t = (raw || '').toUpperCase()
  if (t.includes('CNPJ')) return 'CNPJ'
  if (t.includes('CPF')) return 'CPF'
  if (t.includes('MAIL') || t.includes('EMAIL') || t.includes('E-MAIL')) return 'EMAIL'
  if (t.includes('PHONE') || t.includes('TELEFONE') || t.includes('CELULAR')) return 'PHONE'
  if (t.includes('RANDOM') || t.includes('ALEAT') || t.includes('EVP')) return 'RANDOM'
  return 'CPF'
}

// Normaliza a chave para servir de identificador unico anti-duplicidade.
function normalizePixKey(pixKey: string, type: PixType): string {
  const raw = (pixKey || '').trim()
  if (type === 'EMAIL') return raw.toLowerCase()
  if (type === 'CPF' || type === 'CNPJ' || type === 'PHONE') return raw.replace(/\D/g, '')
  return raw.toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    // ATENCAO: o cliente NUNCA envia valor. So mandamos chave/tipo/identidade.
    const payload = await request.json().catch(() => ({}))
    const { userId, email, pixKey, pixType, beneficiaryName } = payload || {}

    if (!pixKey || typeof pixKey !== 'string' || pixKey.trim().length < 3) {
      return NextResponse.json({ error: 'Chave PIX inválida' }, { status: 400 })
    }

    // ------------------------------------------------------------------
    // 0) Carrega configuracoes do servidor (fonte unica da verdade):
    //    - verificacao ativa? (se nao, recusa o envio)
    //    - valor do PIX de confirmacao (IMUTAVEL pelo cliente)
    //    - gateway de cashout ativo
    // ------------------------------------------------------------------
    const settings = await getAppSettings()

    if (!settings.verificationEnabled) {
      return NextResponse.json(
        { error: 'A verificação de chave PIX está desativada.' },
        { status: 403 }
      )
    }

    const amountCents = settings.verificationAmountCents
    const gateway = getCashoutGateway(settings.activeCashoutGateway)

    if (!gateway) {
      console.error('[v0] Gateway de cashout ativo inválido:', settings.activeCashoutGateway)
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 500 }
      )
    }

    if (!gateway.isConfigured()) {
      console.error('[v0] Gateway ativo sem credenciais:', gateway.id)
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 500 }
      )
    }

    const type = normalizePixType(pixType)
    const keyNormalized = normalizePixKey(pixKey, type)

    if (!keyNormalized) {
      return NextResponse.json({ error: 'Chave PIX inválida' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Metadados de auditoria
    const requestIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null
    const userAgent = request.headers.get('user-agent') || null

    // ------------------------------------------------------------------
    // 1) Reserva atomica no banco (anti-duplicidade RIGOROSA).
    //    O indice unico parcial em pix_key_normalized (status in
    //    processing/pending/completed) garante que duas requisicoes
    //    concorrentes NAO consigam inserir a mesma chave ativa.
    // ------------------------------------------------------------------
    const { data: reserved, error: insertError } = await supabase
      .from('pix_verifications')
      .insert({
        user_id: userId || null,
        email: email || null,
        pix_key: pixKey.trim(),
        pix_key_normalized: keyNormalized,
        pix_type: type,
        amount_cents: amountCents,
        status: 'processing',
        attempts: 1,
        provider: gateway.id,
        request_ip: requestIp,
        user_agent: userAgent,
      })
      .select()
      .single()

    let verification = reserved

    if (insertError) {
      // Codigo 23505 = unique_violation -> ja existe verificacao ativa/concluida
      if (insertError.code === '23505') {
        const { data: existing } = await supabase
          .from('pix_verifications')
          .select('*')
          .eq('pix_key_normalized', keyNormalized)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existing && existing.status === 'failed') {
          // Retry permitido: marca como processing e incrementa tentativas.
          const { data: retried, error: retryError } = await supabase
            .from('pix_verifications')
            .update({
              status: 'processing',
              attempts: (existing.attempts || 0) + 1,
              last_error: null,
              amount_cents: amountCents,
              provider: gateway.id,
              user_id: userId || existing.user_id,
              email: email || existing.email,
              request_ip: requestIp,
              user_agent: userAgent,
            })
            .eq('id', existing.id)
            .eq('status', 'failed') // guarda contra corrida
            .select()
            .single()

          if (retryError || !retried) {
            return NextResponse.json(
              { error: 'Esta chave PIX já está sendo verificada ou já foi verificada.' },
              { status: 409 }
            )
          }
          verification = retried
        } else {
          return NextResponse.json(
            {
              error: 'Esta chave PIX já recebeu o valor de verificação.',
              alreadyVerified: true,
            },
            { status: 409 }
          )
        }
      } else {
        console.error('[v0] Erro ao reservar verificação:', insertError)
        return NextResponse.json({ error: 'Erro ao registrar verificação' }, { status: 500 })
      }
    }

    if (!verification) {
      return NextResponse.json({ error: 'Erro ao registrar verificação' }, { status: 500 })
    }

    // external_id deterministico por registro (idempotencia no gateway).
    const externalId = `luna_verify_${verification.id}`

    const safeName =
      typeof beneficiaryName === 'string' && beneficiaryName.trim().length >= 3
        ? beneficiaryName.trim()
        : FALLBACK_RECEIVER_NAME

    const siteUrl = getSiteUrl()

    // ------------------------------------------------------------------
    // 2) Chamar o gateway ativo. amount FIXO no servidor (vindo das settings).
    // ------------------------------------------------------------------
    const cashoutInput: CashoutInput = {
      externalId,
      amountCents,
      pixKey: pixKey.trim(),
      pixType: type,
      beneficiaryName: safeName,
      description: 'Verificação de chave PIX Luna Privé',
      postbackUrl: `${siteUrl}/api/pix/cashout-webhook`,
    }

    let result
    try {
      result = await gateway.send(cashoutInput)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar a gateway'
      console.error('[v0] Erro ao chamar gateway:', msg)
      await supabase
        .from('pix_verifications')
        .update({ status: 'failed', last_error: msg.slice(0, 500), external_id: externalId })
        .eq('id', verification.id)
      return NextResponse.json(
        {
          error: 'Não foi possível enviar o valor de verificação para esta chave PIX.',
          gatewayMessage: msg.slice(0, 300),
        },
        { status: 502 }
      )
    }

    if (!result.ok) {
      const errMsg = result.errorMessage || `Falha no cashout (status ${result.status})`
      console.error('[v0] Cashout falhou:', errMsg, '| status:', result.status)

      // Marca como failed para permitir retry futuro.
      await supabase
        .from('pix_verifications')
        .update({
          status: 'failed',
          last_error: String(errMsg).slice(0, 500),
          external_id: externalId,
        })
        .eq('id', verification.id)

      return NextResponse.json(
        {
          error: 'Não foi possível enviar o valor de verificação para esta chave PIX.',
          gatewayMessage: String(errMsg).slice(0, 300),
        },
        { status: 502 }
      )
    }

    // ------------------------------------------------------------------
    // 3) Sucesso: marca pending e guarda ids da transacao.
    //    A confirmacao final chega via webhook cashout.confirmed.
    // ------------------------------------------------------------------
    const { data: confirmed } = await supabase
      .from('pix_verifications')
      .update({
        status: 'pending',
        transaction_id: result.transactionId,
        end_to_end_id: result.endToEndId,
        external_id: externalId,
        last_error: null,
      })
      .eq('id', verification.id)
      .select()
      .single()

    return NextResponse.json({
      success: true,
      verificationId: confirmed?.id || verification.id,
      status: confirmed?.status || 'pending',
    })
  } catch (error) {
    console.error('[v0] Erro na verificação de chave PIX:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
