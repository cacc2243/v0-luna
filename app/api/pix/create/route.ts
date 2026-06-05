import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BYNET_API_URL = 'https://api.bynet.com.br/v1'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, amount, name, document } = await request.json()

    if (!email || !amount) {
      return NextResponse.json(
        { error: 'Email e valor são obrigatórios' },
        { status: 400 }
      )
    }

    const apiKey = process.env.BYNET_API_KEY
    if (!apiKey) {
      console.error('[v0] BYNET_API_KEY não configurada')
      return NextResponse.json(
        { error: 'Gateway de pagamento não configurado' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Verificar se já existe um convite pendente para este email
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .gt('pix_expiration', new Date().toISOString())
      .single()

    if (existingInvite) {
      // Retornar o PIX existente
      return NextResponse.json({
        success: true,
        invite: existingInvite,
        pixCode: existingInvite.pix_code,
        pixQrCode: existingInvite.pix_qrcode,
        expiresAt: existingInvite.pix_expiration,
      })
    }

    // Criar transação no gateway Bynet
    const externalId = `luna-invite-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const bynetResponse = await fetch(`${BYNET_API_URL}/transactions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Converter para centavos
        externalId,
        description: 'Luna Creators - Convite Premium',
        customer: {
          name: name || 'Cliente Luna',
          email,
          document: document || null,
        },
        pix: {
          expiresIn: 3600, // 1 hora em segundos
        },
      }),
    })

    if (!bynetResponse.ok) {
      const errorData = await bynetResponse.json().catch(() => ({}))
      console.error('[v0] Erro Bynet:', bynetResponse.status, errorData)
      return NextResponse.json(
        { error: 'Erro ao gerar PIX. Tente novamente.' },
        { status: 500 }
      )
    }

    const bynetData = await bynetResponse.json()

    // Calcular expiração do PIX
    const pixExpiration = new Date()
    pixExpiration.setHours(pixExpiration.getHours() + 1)

    // Salvar convite no banco
    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert({
        user_id: userId || null,
        email,
        amount,
        status: 'pending',
        transaction_id: bynetData.id || externalId,
        pix_code: bynetData.pix?.qrCode || bynetData.pix?.copyPaste || bynetData.qrCode,
        pix_qrcode: bynetData.pix?.qrCodeBase64 || bynetData.pix?.qrCodeImage || bynetData.qrCodeBase64,
        pix_expiration: pixExpiration.toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('[v0] Erro ao salvar convite:', insertError)
      return NextResponse.json(
        { error: 'Erro ao salvar convite' },
        { status: 500 }
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
