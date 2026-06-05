import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const BYNET_API_URL = 'https://api-gateway.techbynet.com'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, amount, name, document, phone } = await request.json()

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

    const supabase = createAdminClient()

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
    // Formato conforme documentação: https://docs.techbynet.com
    const requestBody = {
      amount: Math.round(amount * 100), // Converter para centavos
      paymentMethod: 'PIX',
      customer: {
        name: name || 'Cliente Luna',
        email,
        phone: phone || '11999999999',
        document: {
          number: document || '00000000000',
          type: 'CPF',
        },
      },
      items: [
        {
          title: 'Convite Luna Privé',
          unitPrice: Math.round(amount * 100),
          quantity: 1,
          tangible: false,
        },
      ],
      pix: {
        expiresInDays: 1, // Expira em 1 dia
      },
    }

    const bynetResponse = await fetch(`${BYNET_API_URL}/api/user/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'User-Agent': 'AtivoB2B/1.0',
      },
      body: JSON.stringify(requestBody),
    })

    const bynetData = await bynetResponse.json()

    if (!bynetResponse.ok || bynetData.error) {
      console.error('[v0] Erro Bynet:', bynetResponse.status, bynetData)
      const errorMessage = Array.isArray(bynetData.error) 
        ? bynetData.error.join(', ')
        : bynetData.error || bynetData.message || 'Erro ao gerar PIX. Tente novamente.'
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // Extrair dados do PIX da resposta
    // Formato: data.pix.qrcode e data.qrCode
    const transactionData = bynetData.data || bynetData
    
    // Código PIX copia e cola (EMV)
    const pixCode = transactionData.qrCode || 
                    transactionData.pix?.qrcode ||
                    transactionData.pix?.qrCode ||
                    ''
    
    // Expiração do PIX
    const pixExpirationDate = transactionData.pix?.expirationDate
      ? new Date(transactionData.pix.expirationDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000) // +1 dia

    // Salvar convite no banco
    const { data: invite, error: insertError } = await supabase
      .from('invites')
      .insert({
        user_id: userId || null,
        email,
        amount,
        status: 'pending',
        transaction_id: transactionData.id || `luna-${Date.now()}`,
        pix_code: pixCode,
        pix_qrcode: null, // A API não retorna imagem base64, usar QR code generator no frontend
        pix_expiration: pixExpirationDate.toISOString(),
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
