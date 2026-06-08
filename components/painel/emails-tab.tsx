'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Mail,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Eye,
  Zap,
  Send,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplatePreview {
  id: string
  name: string
  description: string
  trigger: string
  subject: string
  html: string
}

interface EmailLog {
  id: string
  template_id: string
  recipient: string
  subject: string
  status: 'sent' | 'skipped' | 'error'
  provider_id: string | null
  error: string | null
  created_at: string
}

interface EmailsPayload {
  templates: TemplatePreview[]
  logs: EmailLog[]
  logsAvailable: boolean
  from: string
  resendConfigured: boolean
}

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) {
    const err = new Error('fetch_failed') as Error & { status?: number }
    err.status = r.status
    throw err
  }
  return r.json()
}

const TEMPLATE_LABELS: Record<string, string> = {
  account_created: 'Conta criada',
  invite_pix: 'PIX gerado',
  invite_paid: 'Acesso liberado',
}

export function EmailsTab() {
  const { data, error, isLoading, mutate } = useSWR<EmailsPayload>(
    '/api/admin/emails',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 15000 },
  )

  const [preview, setPreview] = useState<TemplatePreview | null>(null)

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Carregando e-mails...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertTriangle className="size-7 text-destructive" />
        <p className="text-sm text-muted-foreground">Não foi possível carregar os e-mails.</p>
        <button
          onClick={() => mutate()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const templates = data?.templates || []
  const logs = data?.logs || []

  return (
    <div className="flex flex-col gap-5">
      {/* Status da configuracao */}
      <section
        className={cn(
          'flex items-start gap-3 rounded-2xl border p-4',
          data?.resendConfigured
            ? 'border-positive/30 bg-positive/5'
            : 'border-amber-500/30 bg-amber-500/5',
        )}
      >
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            data?.resendConfigured
              ? 'bg-positive/15 text-positive'
              : 'bg-amber-500/15 text-amber-500',
          )}
        >
          {data?.resendConfigured ? <CheckCircle2 className="size-5" /> : <AlertTriangle className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-foreground">
            {data?.resendConfigured ? 'Resend configurado' : 'Resend ainda não configurado'}
          </h2>
          <p className="mt-1 text-pretty text-xs leading-relaxed text-muted-foreground">
            {data?.resendConfigured
              ? 'Os e-mails estão sendo enviados normalmente.'
              : 'Adicione a variável RESEND_API_KEY (e EMAIL_FROM) para começar a enviar. Enquanto isso, os envios ficam registrados como "ignorados".'}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Send className="size-3.5" />
            Remetente: <span className="font-medium text-foreground">{data?.from}</span>
          </p>
        </div>
      </section>

      {/* Templates */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Mail className="size-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Templates de e-mail</h2>
        </div>
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-foreground">{t.name}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
                      {TEMPLATE_LABELS[t.id] || t.id}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t.description}
                  </p>
                </div>
                <button
                  onClick={() => setPreview(t)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary"
                >
                  <Eye className="size-3.5" />
                  Ver
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                <Field label="Assunto" value={t.subject} />
                <div className="flex items-start gap-2 text-xs">
                  <Zap className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{t.trigger}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Log de envios */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <h2 className="text-base font-bold text-foreground">Log de envios</h2>
        </div>

        {!data?.logsAvailable ? (
          <div className="rounded-2xl border border-dashed border-border p-5 text-center">
            <p className="text-sm font-semibold text-foreground">Tabela de log não encontrada</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Rode o script{' '}
              <span className="font-mono text-foreground">scripts/001_create_email_logs.sql</span>{' '}
              no seu banco Supabase para começar a registrar os envios.
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-5 text-center">
            <p className="text-sm text-muted-foreground">Nenhum e-mail enviado ainda.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 p-3.5">
                  <StatusIcon status={log.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
                        {TEMPLATE_LABELS[log.template_id] || log.template_id}
                      </span>
                      <span className="truncate text-xs font-medium text-foreground">
                        {log.recipient}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{log.subject}</p>
                    {log.error && (
                      <p className="mt-0.5 truncate text-[0.7rem] text-destructive">{log.error}</p>
                    )}
                  </div>
                  <time className="shrink-0 text-[0.7rem] text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Modal de preview */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Assunto
                </p>
                <p className="truncate text-sm font-bold text-foreground">{preview.subject}</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
                aria-label="Fechar"
              >
                <XCircle className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-[#0a090c]">
              <iframe
                title={`Preview ${preview.name}`}
                srcDoc={preview.html}
                className="h-full min-h-[480px] w-full border-0"
                sandbox=""
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function StatusIcon({ status }: { status: EmailLog['status'] }) {
  if (status === 'sent') {
    return <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-positive" />
  }
  if (status === 'error') {
    return <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
  }
  return <MinusCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
}
