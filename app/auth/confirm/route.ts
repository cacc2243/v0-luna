import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verificação de OTP por token_hash (padrão @supabase/ssr).
 *
 * O e-mail de recuperação enviado pela nossa marca aponta para cá:
 *   /auth/confirm?token_hash=...&type=recovery&next=/minha-conta/redefinir-senha
 *
 * Verificamos o token NO SERVIDOR, o que estabelece os cookies da sessão de
 * recuperação ANTES de a página carregar. Em seguida redirecionamos para a
 * página de nova senha, que já encontra a sessão pronta (sem corrida no
 * cliente). Assim o link fica 100% no nosso domínio (lunaprive.live).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/minha-conta'

  const redirectPath = next.startsWith('/') ? next : '/minha-conta'

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }

    console.error('[v0] verifyOtp falhou em /auth/confirm:', error.message)
  }

  // Token ausente/expirado/inválido: leva à página de reset sinalizando o erro.
  return NextResponse.redirect(`${origin}${redirectPath}?error=invalid`)
}
