import { NextRequest, NextResponse } from 'next/server'
import { sendTemplateEmail } from '@/lib/email/send'

/**
 * Envia o e-mail de boas-vindas (conta criada).
 * Chamado pelo fluxo de cadastro (client) logo apos o signUp.
 * Resiliente: nunca quebra o cadastro mesmo se o envio falhar.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, name, username, pixType, pixKey } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
    }

    const result = await sendTemplateEmail('account_created', email, {
      name,
      email,
      username: username || name,
      pixType,
      pixKey,
    })
    return NextResponse.json({ success: true, status: result.status })
  } catch (error) {
    console.error('[v0] Erro ao enviar e-mail de conta criada:', error)
    // Nao bloquear o cadastro por falha de e-mail
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
