import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getEmailTemplate,
  type EmailTemplateId,
  type EmailTemplateVars,
} from './templates'

/**
 * Remetente. Configuravel por env. Enquanto o dominio nao estiver verificado
 * no Resend, pode-se usar "Luna Privé <onboarding@resend.dev>".
 */
function getFrom(): string {
  return process.env.EMAIL_FROM || 'Luna Privé <onboarding@resend.dev>'
}

export type EmailSendStatus = 'sent' | 'skipped' | 'error'

export interface EmailSendResult {
  status: EmailSendStatus
  providerId?: string | null
  error?: string | null
}

/**
 * Registra o envio (ou tentativa) na tabela email_logs.
 * Falhas de log nunca devem quebrar o fluxo principal.
 */
async function logEmail(params: {
  templateId: EmailTemplateId
  to: string
  subject: string
  status: EmailSendStatus
  providerId?: string | null
  error?: string | null
}) {
  try {
    const supabase = createAdminClient()
    await supabase.from('email_logs').insert({
      template_id: params.templateId,
      recipient: params.to,
      subject: params.subject,
      status: params.status,
      provider_id: params.providerId ?? null,
      error: params.error ?? null,
    })
  } catch (e) {
    console.error('[v0] Falha ao registrar email_log:', (e as Error)?.message)
  }
}

/**
 * Envia um e-mail a partir de um template. Resiliente:
 * - Sem RESEND_API_KEY: marca como "skipped" e nao quebra o fluxo.
 * - Erro no provedor: marca como "error" e nao quebra o fluxo.
 */
export async function sendTemplateEmail(
  templateId: EmailTemplateId,
  to: string,
  vars: EmailTemplateVars,
): Promise<EmailSendResult> {
  const template = getEmailTemplate(templateId)
  const subject = template.subject(vars)

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    await logEmail({ templateId, to: to || '(vazio)', subject, status: 'error', error: 'destinatario_invalido' })
    return { status: 'error', error: 'destinatario_invalido' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(`[v0] RESEND_API_KEY ausente — e-mail "${templateId}" para ${to} nao enviado (skipped).`)
    await logEmail({ templateId, to, subject, status: 'skipped', error: 'resend_nao_configurado' })
    return { status: 'skipped', error: 'resend_nao_configurado' }
  }

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: getFrom(),
      to,
      subject,
      html: template.html(vars),
    })

    if (error) {
      console.error(`[v0] Erro Resend ao enviar "${templateId}":`, error)
      await logEmail({ templateId, to, subject, status: 'error', error: error.message })
      return { status: 'error', error: error.message }
    }

    await logEmail({ templateId, to, subject, status: 'sent', providerId: data?.id })
    return { status: 'sent', providerId: data?.id }
  } catch (e) {
    const msg = (e as Error)?.message || 'erro_desconhecido'
    console.error(`[v0] Excecao ao enviar "${templateId}":`, msg)
    await logEmail({ templateId, to, subject, status: 'error', error: msg })
    return { status: 'error', error: msg }
  }
}
