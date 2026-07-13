import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTemplateEmail } from '@/lib/email/send'
import { getSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

/**
 * Solicitação de recuperação de senha.
 *
 * Por que esta rota existe (em vez do resetPasswordForEmail no cliente):
 * - O fluxo nativo do Supabase envia o e-mail pelo SMTP do Supabase, com
 *   remetente/branding genéricos. Aqui geramos o link de recuperação no
 *   servidor com admin.generateLink (que NÃO envia e-mail) e disparamos a
 *   mensagem pela NOSSA marca via Resend (mesmo pipeline dos demais e-mails).
 * - Regra de negócio: só enviamos recuperação para contas que possuem um
 *   CONVITE PAGO. Contas sem convite pago não recebem o e-mail.
 *
 * Segurança / anti-enumeração: a resposta é sempre { ok: true }, independente
 * de o e-mail existir, ter convite pago ou não. Assim não vazamos quais
 * e-mails têm conta/pagamento.
 */
export async function POST(request: NextRequest) {
  // Resposta genérica reutilizada em todos os caminhos de saída.
  const ok = () => NextResponse.json({ ok: true })

  let email = ''
  try {
    const body = await request.json()
    email = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    return ok()
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!isValidEmail) return ok()

  try {
    const supabase = createAdminClient()

    // 1) A conta precisa ter um convite PAGO para poder recuperar a senha.
    const { data: paidInvite, error: inviteErr } = await supabase
      .from('invites')
      .select('id')
      .ilike('email', email)
      .eq('status', 'paid')
      .eq('type', 'invite')
      .limit(1)
      .maybeSingle()

    if (inviteErr) {
      console.error('[v0] Erro ao verificar convite pago (reset senha):', inviteErr.message)
      return ok()
    }
    if (!paidInvite) {
      // Sem convite pago: não enviamos, mas respondemos sucesso genérico.
      console.log('[v0] Reset de senha ignorado (sem convite pago) para:', email)
      return ok()
    }

    // 2) Gera o token de recuperação SEM enviar e-mail nativo do Supabase.
    //    IMPORTANTE: NÃO usamos o `action_link` retornado, pois ele aponta para
    //    o host da Supabase (`<project>.supabase.co/auth/v1/verify`) e tem o
    //    `redirect_to` sobrescrito pela "Site URL" do painel da Supabase
    //    (que hoje aponta para o domínio *.vercel.app). Em vez disso, montamos
    //    nosso PRÓPRIO link 100% no domínio lunaprive.live usando o
    //    `hashed_token`. A verificação do OTP acontece na nossa página de
    //    redefinição (verifyOtp), estabelecendo a sessão de recuperação ali.
    const redirectTo = `${getSiteUrl()}/minha-conta/redefinir-senha`
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    if (linkErr) {
      // Caso mais comum: usuária tem convite pago mas ainda não tem conta de
      // auth criada. Nada a fazer — resposta genérica.
      console.warn('[v0] generateLink recovery falhou:', linkErr.message)
      return ok()
    }

    const tokenHash = linkData?.properties?.hashed_token
    if (!tokenHash) {
      console.error('[v0] generateLink não retornou hashed_token')
      return ok()
    }

    // Link próprio, inteiramente no nosso domínio.
    const actionLink = `${getSiteUrl()}/minha-conta/redefinir-senha?token_hash=${encodeURIComponent(
      tokenHash,
    )}&type=recovery`

    // Nome amigável (se houver) para personalizar o e-mail.
    const meta = (linkData?.user?.user_metadata ?? {}) as Record<string, unknown>
    const name =
      (typeof meta.name === 'string' && meta.name) ||
      (typeof meta.username === 'string' && meta.username) ||
      (typeof meta.display_name === 'string' && meta.display_name) ||
      undefined

    // 3) Envia pela nossa marca via Resend.
    await sendTemplateEmail('password_reset', email, {
      name,
      email,
      resetUrl: actionLink,
    })

    return ok()
  } catch (e) {
    console.error('[v0] Exceção no reset de senha:', (e as Error)?.message)
    return ok()
  }
}
