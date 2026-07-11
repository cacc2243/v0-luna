import { NextRequest, NextResponse } from 'next/server'
import { runAccessReminders } from '@/lib/email/notify-access-reminder'

// Sempre dinamico e sem cache: e um job de envio.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Margem para paginar usuarios e enviar em lote.
export const maxDuration = 60

/**
 * Cron de reforço de acesso.
 *
 * Verifica convites pagos há mais de 1h em que a usuária ainda não fez login e
 * dispara o e-mail de lembrete (template invite_access_reminder).
 *
 * Segurança: se CRON_SECRET estiver definido, exige
 * `Authorization: Bearer <CRON_SECRET>` (a Vercel injeta esse header
 * automaticamente nos Crons quando a env var existe). Se não estiver definido,
 * a rota roda sem exigir o header (útil enquanto o segredo não foi configurado),
 * apenas registrando um aviso.
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
  } else {
    console.warn('[v0] CRON_SECRET ausente — /api/cron/login-reminder rodando sem autenticação.')
  }

  const result = await runAccessReminders()
  console.log('[v0] Reforço de acesso executado:', JSON.stringify(result))
  return NextResponse.json({ ok: true, ...result })
}

// A Vercel dispara Crons via GET. POST fica disponível para acionamento manual.
export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
