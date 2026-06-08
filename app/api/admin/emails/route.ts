import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { listEmailTemplates } from '@/lib/email/templates'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Templates: renderiza assunto + html com dados de exemplo para preview.
  const templates = listEmailTemplates().map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    trigger: t.trigger,
    subject: t.subject(t.sampleVars),
    html: t.html(t.sampleVars),
  }))

  const from = process.env.EMAIL_FROM || 'Luna Privé <onboarding@resend.dev>'
  const resendConfigured = Boolean(process.env.RESEND_API_KEY)

  // Log de envios (pode nao existir ainda se a tabela nao foi criada).
  let logs: unknown[] = []
  let logsAvailable = true
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('email_logs')
      .select('id, template_id, recipient, subject, status, provider_id, error, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      logsAvailable = false
    } else {
      logs = data || []
    }
  } catch {
    logsAvailable = false
  }

  return NextResponse.json({
    templates,
    logs,
    logsAvailable,
    from,
    resendConfigured,
    fetchedAt: new Date().toISOString(),
  })
}
