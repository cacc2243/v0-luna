import { createAdminClient } from '@/lib/supabase/admin'
import { createPixupCashout } from '@/lib/pixup/client'
import { NextRequest, NextResponse } from 'next/server'

// Valor IMUTAVEL da verificacao: R$ 0,90.
// Definido exclusivamente no servidor. Nenhum valor vindo do cliente e aceito.
// Guardamos em centavos no banco (90) e enviamos em reais para a PixUp (0.90).
const VERIFICATION_AMOUNT_CENTS = 90
const VERIFICATION_AMOUNT_BRL = 0.9

// Tipos de chave PIX aceitos pela PixUp (lowercase)
type PixType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'

// Nome de fallback para o recebedor (a chave PIX real e o que importa)
const FALLBACK_RECEIVER_NAME = 'Beneficiario Luna Prive'

// Normaliza o tipo recebido do front (rotulos em PT) para o enum da PixUp.
function normalizePixType(raw: string): PixType {
  const t = (raw || '').toUpperCase()
  if (t.includes('CNPJ')) return 'cnpj'
  if (t.includes('CPF')) return 'cpf'
  if (t.includes('MAIL') || t.includes('EMAIL') || t.includes('E-MAIL')) return 'email'
  if (t.includes('PHONE') || t.includes('TELEFONE') || t.includes('CELULAR')) return 'phone'
  if (t.includes('RANDOM') || t.includes('ALEAT') || t.includes('EVP')) return 'random'
  return 'cpf'
}

// Normaliza a chave para servir de identificador unico anti-duplicidade.
// cpf/cnpj/phone -> apenas digitos. email -> minusculo. random -> trim.
function normalizePixKey(pixKey: string, type: PixType): string {
  const raw = (pixKey || '').trim()
  if (type === 'email') return raw.toLowerCase()
  if (type === 'cpf' || type === 'cnpj' || type === 'phone') return raw.replace(/\D/g, '')
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

    if (!process.env.PIXUP_CLIENT_ID || !process.env.PIXUP_CLIENT_SECRET || !process.env.PIXUP_SIGNING_KEY) {
      console.error('[v0] Credenciais PixUp não configuradas')
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
        amount_cents: VERIFICATION_AMOUNT_CENTS,
        status: 'processing',
        attempts: 1,
        provider: 'pixup',
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

    // external_id deterministico por registro (idempotencia na PixUp).
    const externalId = `luna_verify_${verification.id}`

    const safeName =
      typeof beneficiaryName === 'string' && beneficiaryName.trim().length >= 3
        ? beneficiaryName.trim()
        : FALLBACK_RECEIVER_NAME

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get('origin') ||
      'https://luna-prive.vercel.app'

    // ------------------------------------------------------------------
    // 2) Chamar a PixUp (OAuth2 + HMAC tratados no cliente).
    //    amount FIXO no servidor (R$ 0,90).
    // ------------------------------------------------------------------
    let result
    try {
      result = await createPixupCashout({
        externalId,
        amount: VERIFICATION_AMOUNT_BRL,
        key: pixKey.trim(),
        keyType: type,
        name: safeName,
        description: 'Verificação de chave PIX Luna Privé',
        postbackUrl: `${siteUrl}/api/pix/cashout-webhook`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao contatar a gateway'
      console.error('[v0] Erro ao chamar PixUp:', msg)
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

    const respData = result.data?.data || {}
    const transactionId = respData.transaction_id || null

    if (!result.ok) {
      const errMsg = result.errorMessage || `Falha no cashout (status ${result.status})`
      console.error('[v0] Cashout PixUp falhou:', errMsg, '| status:', result.status)

      // Marca como failed para permitir retry futuro.
      await supabase
        .from('pix_verifications')
        .update({ status: 'failed', last_error: String(errMsg).slice(0, 500), external_id: externalId })
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
    // 3) Sucesso (202 Accepted): marca pending e guarda ids da transacao.
    //    A confirmacao final chega via webhook cashout.confirmed.
    // ------------------------------------------------------------------
    const { data: confirmed } = await supabase
      .from('pix_verifications')
      .update({
        status: 'pending',
        transaction_id: transactionId,
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
