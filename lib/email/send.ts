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
 *
 * Limpamos crases/asteriscos que possam ter sido colados por engano junto
 * com formatacao markdown (ex: "**`Nome <email>`**").
 */
function getFrom(): string {
  const raw = process.env.EMAIL_FROM
  if (!raw) return 'Luna Privé <onboarding@resend.dev>'
  const cleaned = raw.replace(/[`*]/g, '').trim()
  return cleaned || 'Luna Privé <onboarding@resend.dev>'
}

/** Extrai apenas o endereço de e-mail de um "Nome <email>" ou "email". */
function extractAddress(value: string): string {
  const match = value.match(/<([^>]+)>/)
  return (match ? match[1] : value).trim()
}

/**
 * Endereço de resposta. Definir um Reply-To válido (idealmente uma caixa real)
 * melhora a reputação e reduz spam. Usa EMAIL_REPLY_TO se definido; caso
 * contrário cai para o endereço do remetente.
 */
function getReplyTo(): string {
  const raw = process.env.EMAIL_REPLY_TO?.replace(/[`*]/g, '').trim()
  if (raw) return raw
  return extractAddress(getFrom())
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
    const replyTo = getReplyTo()
    const { data, error } = await resend.emails.send({
      from: getFrom(),
      to,
      subject,
      html: template.html(vars),
      // Alternativa em texto puro: forte fator de deliverability.
      text: template.text(vars),
      replyTo,
      // List-Unsubscribe apenas via mailto — que e RFC-valido por si so e e um
      // sinal POSITIVO para Gmail/Outlook.
      //
      // NAO enviamos "List-Unsubscribe-Post: One-Click" porque o descadastro em
      // um clique (RFC 8058) EXIGE uma URL https:// no List-Unsubscribe. Como
      // aqui so temos um mailto:, declarar One-Click deixaria o header
      // malformado — o que o Gmail penaliza (fator de spam). Se um dia existir
      // um endpoint https de descadastro, adiciona-se a URL e o header One-Click
      // juntos.
      headers: {
        'List-Unsubscribe': `<mailto:${replyTo}?subject=unsubscribe>`,
      },
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
