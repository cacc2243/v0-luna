'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import {
  Loader2,
  AlertTriangle,
  Check,
  Plug,
  Send,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) {
    const err = new Error('fetch_failed') as Error & { status?: number }
    err.status = r.status
    throw err
  }
  return r.json()
}

interface ConfigPayload {
  config: {
    instanceId: string
    hasInstanceToken: boolean
    hasClientToken: boolean
    testMessage: string
    configured: boolean
  }
}

interface StatusPayload {
  configured: boolean
  connected: boolean
  smartphoneConnected?: boolean
  error?: string
}

interface MessageRow {
  id: string
  phone: string
  message: string
  status: string
  error: string | null
  created_at: string
}

export function WhatsappTab() {
  const { data, error, isLoading, mutate } = useSWR<ConfigPayload>(
    '/api/admin/whatsapp/config',
    fetcher,
    { revalidateOnFocus: false },
  )

  // Config local
  const [instanceId, setInstanceId] = useState('')
  const [instanceToken, setInstanceToken] = useState('')
  const [clientToken, setClientToken] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [savingCfg, setSavingCfg] = useState(false)
  const [savedCfg, setSavedCfg] = useState(false)
  const [cfgError, setCfgError] = useState<string | null>(null)

  // Envio
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [sendOk, setSendOk] = useState<string | null>(null)
  const [sendErr, setSendErr] = useState<string | null>(null)

  const cfg = data?.config

  useEffect(() => {
    if (cfg) {
      setInstanceId(cfg.instanceId)
      setTestMessage(cfg.testMessage)
    }
  }, [cfg])

  const saveConfig = async () => {
    setCfgError(null)
    setSavingCfg(true)
    try {
      const res = await fetch('/api/admin/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, instanceToken, clientToken, testMessage }),
      })
      const json = await res.json()
      if (!res.ok) {
        setCfgError(json?.error || 'Falha ao salvar.')
        return
      }
      // Limpa os campos de token (já persistidos) e revalida.
      setInstanceToken('')
      setClientToken('')
      await mutate(json, { revalidate: false })
      setSavedCfg(true)
      setTimeout(() => setSavedCfg(false), 2000)
    } catch {
      setCfgError('Erro de conexão ao salvar.')
    } finally {
      setSavingCfg(false)
    }
  }

  const sendTest = async () => {
    setSendOk(null)
    setSendErr(null)
    setSending(true)
    try {
      const res = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: testMessage }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setSendErr(json?.error || 'Falha ao enviar mensagem.')
        return
      }
      setSendOk('Mensagem enviada com sucesso!')
      mutateHistory()
      setTimeout(() => setSendOk(null), 3000)
    } catch {
      setSendErr('Erro de conexão ao enviar.')
    } finally {
      setSending(false)
    }
  }

  const { data: history, mutate: mutateHistory } = useSWR<{ messages: MessageRow[] }>(
    '/api/admin/whatsapp/send',
    fetcher,
    { revalidateOnFocus: false },
  )

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Carregando integração...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertTriangle className="size-7 text-destructive" />
        <p className="text-sm text-muted-foreground">Não foi possível carregar a integração.</p>
        <button
          onClick={() => mutate()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Status da conexão */}
      <ConnectionStatus configured={!!cfg?.configured} />

      {/* Configuração da Z-API */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Plug className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Credenciais da Z-API</h2>
            <p className="text-sm text-muted-foreground">
              Pegue no painel da Z-API (Instância + Token do conta de segurança).
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <Field label="ID da Instância">
            <input
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="3D8F..."
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>

          <Field label="Token da Instância" hint={cfg?.hasInstanceToken ? 'Salvo • preencha para alterar' : undefined}>
            <input
              type="password"
              value={instanceToken}
              onChange={(e) => setInstanceToken(e.target.value)}
              placeholder={cfg?.hasInstanceToken ? '••••••••••' : 'Token da instância'}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>

          <Field label="Client-Token (segurança da conta)" hint={cfg?.hasClientToken ? 'Salvo • preencha para alterar' : undefined}>
            <input
              type="password"
              value={clientToken}
              onChange={(e) => setClientToken(e.target.value)}
              placeholder={cfg?.hasClientToken ? '••••••••••' : 'Client-Token'}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>
        </div>

        {cfgError && (
          <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" /> {cfgError}
          </p>
        )}

        <button
          onClick={saveConfig}
          disabled={savingCfg}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {savingCfg ? (
            <Loader2 className="size-4 animate-spin" />
          ) : savedCfg ? (
            <Check className="size-4" />
          ) : null}
          {savedCfg ? 'Salvo' : 'Salvar credenciais'}
        </button>
      </section>

      {/* Enviar mensagem de teste */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Send className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Enviar mensagem de teste</h2>
            <p className="text-sm text-muted-foreground">
              O WhatsApp conectado enviará esta mensagem para o número informado.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <Field label="Número de destino" hint="DDD + número (ex.: 11999999999)">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="11999999999"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>

          <Field label="Mensagem">
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 text-sm leading-relaxed text-foreground outline-none focus:border-primary"
            />
          </Field>
        </div>

        {sendOk && (
          <p className="mt-3 flex items-center gap-2 text-sm text-positive">
            <CheckCircle2 className="size-4" /> {sendOk}
          </p>
        )}
        {sendErr && (
          <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" /> {sendErr}
          </p>
        )}

        <button
          onClick={sendTest}
          disabled={sending || !cfg?.configured}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Enviar mensagem
        </button>
      </section>

      {/* Histórico */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Mensagens enviadas</h2>
              <p className="text-sm text-muted-foreground">Últimos 50 envios.</p>
            </div>
          </div>
          <button
            onClick={() => mutateHistory()}
            aria-label="Atualizar histórico"
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:text-foreground"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {(history?.messages || []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma mensagem enviada ainda.
            </p>
          ) : (
            history!.messages.map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3.5"
              >
                <div
                  className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                    m.status === 'sent'
                      ? 'bg-positive/15 text-positive'
                      : 'bg-destructive/15 text-destructive',
                  )}
                >
                  {m.status === 'sent' ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      <Smartphone className="size-3.5 text-muted-foreground" />
                      {m.phone}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.message}</p>
                  {m.status !== 'sent' && m.error && (
                    <p className="mt-1 text-xs text-destructive">{m.error}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function ConnectionStatus({ configured }: { configured: boolean }) {
  const { data } = useSWR<StatusPayload>(
    configured ? '/api/admin/whatsapp/status' : null,
    fetcher,
    { refreshInterval: 8000 },
  )

  const connected = data?.connected
  const statusLabel = !configured
    ? 'Não configurado'
    : connected
      ? 'Conectado'
      : 'Desconectado'

  return (
    <section
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-4',
        connected ? 'border-positive/40 bg-positive/5' : 'border-border bg-card',
      )}
    >
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          connected ? 'bg-positive/15 text-positive' : 'bg-muted text-muted-foreground',
        )}
      >
        <MessageCircle className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-2.5 rounded-full',
              connected ? 'bg-positive' : 'bg-muted-foreground/50',
            )}
          >
            {connected && <span className="size-2.5 animate-ping rounded-full bg-positive/70" />}
          </span>
          <p className="text-sm font-bold text-foreground">{statusLabel}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {data?.error || (connected ? 'WhatsApp pronto para enviar mensagens.' : 'Conecte o WhatsApp no painel da Z-API.')}
        </p>
      </div>
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
