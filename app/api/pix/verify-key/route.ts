import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const BYNET_API_URL = 'https://api-gateway.techbynet.com'

// Valor IMUTAVEL da verificacao: 1 centavo (R$ 0,01).
// Definido exclusivamente no servidor. Nenhum valor vindo do cliente e aceito.
const VERIFICATION_AMOUNT_CENTS = 1

// Tipos de chave PIX aceitos pela Bynet
type PixType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'

// Nome de fallback para o beneficiario (a chave PIX real e o que importa)
const FALLBACK_BENEFICIARY_NAME = 'Beneficiario Luna Prive'

// Gera um CPF valido (digitos verificadores corretos) para o campo
// beneficiaryDocument quando a chave nao for um CPF.
function generateValidCPF(): string {
  const n = () => Math.floor(Math.random() * 9)
  const d: number[] = Array.from({ length: 9 }, n)

  let sum = 0
  for (let i = 0; i < 9; i++) sum += d[i] * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10) r = 0
  d.push(r)

  sum = 0
  for (let i = 0; i < 10; i++) sum += d[i] * (11 - i)
  r = (sum * 10) % 11
  if (r === 10) r = 0
  d.push(r)

  return d.join('')
}

function isValidCPF(cpf: string): boolean {
  const clean = (cpf || '').replace(/\D/g, '')
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(clean[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(clean[10])) return false

  return true
}

// Normaliza o tipo recebido do front (rotulos em PT) para o enum da Bynet.
function normalizePixType(raw: string): PixType {
  const t = (raw || '').toUpperCase()
  if (t.includes('CNPJ')) return 'CNPJ'
  if (t.includes('CPF')) return 'CPF'
  if (t.includes('MAIL') || t.includes('EMAIL') || t.includes('E-MAIL')) return 'EMAIL'
  if (t.includes('PHONE') || t.includes('TELEFONE') || t.includes('CELULAR')) return 'PHONE'
  if (t.includes('RANDOM') || t.includes('ALEAT')) return 'RANDOM'
  // Heuristica pelo formato da chave nao e necessaria aqui; default seguro
  return 'CPF'
}

// Normaliza a chave para servir de identificador unico anti-duplicidade.
// CPF/CNPJ/PHONE -> apenas digitos. EMAIL -> minusculo. RANDOM -> trim.
function normalizePixKey(pixKey: string, type: PixType): string {
  const raw = (pixKey || '').trim()
  if (type === 'EMAIL') return raw.toLowerCase()
  if (type === 'CPF' || type === 'CNPJ' || type === 'PHONE') return raw.replace(/\D/g, '')
  return raw.toLowerCase()
}

interface BynetCashoutResult {
  ok: boolean
  status: number
  data: any
}

async function createBynetCashout(
  apiKey: string,
  body: Record<string, unknown>
): Promise<BynetCashoutResult> {
  const response = await fetch(`${BYNET_API_URL}/api/user/cashout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'User-Agent': 'AtivoB2B/1.0',
    },
    body: JSON.stringify(body),
  })

  let data: any = {}
  try {
    data = await response.json()
  } catch {
    data = {}
  }
  return { ok: response.ok, status: response.status, data }
}

export async function POST(request: NextRequest) {
  try {
    // ATENCAO: o cliente NUNCA envia valor. So mandamos chave/tipo/identidade.
    const payload = await request.json().catch(() => ({}))
    const { userId, email, pixKey, pixType, beneficiaryName } = payload || {}

    if (!pixKey || typeof pixKey !== 'string' || pixKey.trim().length < 3) {
      return NextResponse.json({ error: 'Chave PIX inválida' }, { status: 400 })
    }

    const apiKey = process.env.BYNET_API_KEY
    if (!apiKey) {
      console.error('[v0] BYNET_API_KEY não configurada')
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
        request_ip: requestIp,
        user_agent: userAgent,
      })
      .select()
      .single()

    let verification = reserved

    if (insertError) {
      // Codigo 23505 = unique_violation -> ja existe verificacao ativa/concluida
      if (insertError.code === '23505') {
        // Verificar se a unica existente esta 'failed' (permite retry)
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
            // Outra requisicao ja pegou o retry
            return NextResponse.json(
              { error: 'Esta chave PIX já está sendo verificada ou já foi verificada.' },
              { status: 409 }
            )
          }
          verification = retried
        } else {
          // Ja enviado/em andamento com sucesso: BLOQUEIA novo envio.
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

    // ------------------------------------------------------------------
    // 2) Determinar documento do beneficiario.
    //    Se a chave for CPF valido, usa a propria chave. Senao, gera um
    //    CPF valido (a chave PIX real continua sendo o destino do envio).
    // ------------------------------------------------------------------
    const docFromKey = keyNormalized.replace(/\D/g, '')
    const beneficiaryDocument =
      type === 'CPF' && isValidCPF(docFromKey) ? docFromKey : generateValidCPF()

    const safeName =
      typeof beneficiaryName === 'string' && beneficiaryName.trim().length >= 3
        ? beneficiaryName.trim()
        : FALLBACK_BENEFICIARY_NAME

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get('origin') ||
      'https://luna-prive.vercel.app'

    // Corpo do cashout. amount FIXO no servidor (1 centavo).
    const cashoutBody: Record<string, unknown> = {
      amount: VERIFICATION_AMOUNT_CENTS,
      pixKey: pixKey.trim(),
      pixKeyType: type,
      pixType: type,
      beneficiaryName: safeName,
      beneficiaryDocument,
      description: 'Verificação de chave PIX Luna Privé',
      postbackUrl: `${siteUrl}/api/pix/cashout-webhook`,
    }

    // ------------------------------------------------------------------
    // 3) Chamar a Bynet
    // ------------------------------------------------------------------
    const result = await createBynetCashout(apiKey, cashoutBody)
    const respData = result.data?.data || result.data || {}
    const transactionId = respData.id || respData.transactionId || null

    if (!result.ok || result.data?.error) {
      const errMsg =
        result.data?.error ||
        result.data?.message ||
        `Falha no cashout (status ${result.status})`
      console.error('[v0] Cashout Bynet falhou:', errMsg)

      // Marca como failed para permitir retry futuro.
      await supabase
        .from('pix_verifications')
        .update({ status: 'failed', last_error: String(errMsg).slice(0, 500) })
        .eq('id', verification.id)

      return NextResponse.json(
        { error: 'Não foi possível enviar o valor de verificação. Tente novamente.' },
        { status: 502 }
      )
    }

    // ------------------------------------------------------------------
    // 4) Sucesso: marca pending e guarda o id da transacao.
    // ------------------------------------------------------------------
    const { data: confirmed } = await supabase
      .from('pix_verifications')
      .update({
        status: 'pending',
        transaction_id: transactionId,
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
