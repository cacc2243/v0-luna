'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Facebook,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PixelRow {
  id: string
  label: string
  pixel_id: string
  access_token_masked: string
  test_event_code: string | null
  enabled: boolean
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PixelTab() {
  const { data, error, isLoading, mutate } = useSWR<{ pixels: PixelRow[] }>(
    '/api/admin/pixels',
    fetcher,
  )

  // Formulario de novo pixel
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [pixelId, setPixelId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [testCode, setTestCode] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Feedback de acoes por linha
  const [busyId, setBusyId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(
    null,
  )

  const pixels = data?.pixels || []

  const resetForm = () => {
    setLabel('')
    setPixelId('')
    setAccessToken('')
    setTestCode('')
    setShowToken(false)
    setFormError(null)
  }

  const addPixel = async () => {
    setFormError(null)
    if (!pixelId.trim() || !accessToken.trim()) {
      setFormError('Preencha o Pixel ID e o Access Token.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          pixel_id: pixelId.trim(),
          access_token: accessToken.trim(),
          test_event_code: testCode.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setFormError(json?.error || 'Falha ao adicionar o pixel.')
        return
      }
      resetForm()
      setShowForm(false)
      await mutate()
    } catch {
      setFormError('Erro de conexão ao adicionar o pixel.')
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = async (p: PixelRow) => {
    setBusyId(p.id)
    try {
      await fetch('/api/admin/pixels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, enabled: !p.enabled }),
      })
      await mutate()
    } finally {
      setBusyId(null)
    }
  }

  const removePixel = async (p: PixelRow) => {
    if (!confirm(`Remover o pixel ${p.pixel_id}? Esta ação não pode ser desfeita.`)) return
    setBusyId(p.id)
    try {
      await fetch(`/api/admin/pixels?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' })
      await mutate()
    } finally {
      setBusyId(null)
    }
  }

  const testPixel = async (p: PixelRow) => {
    setBusyId(p.id)
    setTestResult(null)
    try {
      // Para testar precisamos do token real; pedimos ao admin (mascarado no GET).
      const token = prompt(
        `Cole o Access Token do pixel ${p.pixel_id} para enviar um evento de teste:`,
      )
      if (!token) {
        setBusyId(null)
        return
      }
      const res = await fetch('/api/admin/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          pixelId: p.pixel_id,
          accessToken: token.trim(),
          testEventCode: p.test_event_code,
        }),
      })
      const json = await res.json()
      setTestResult({
        id: p.id,
        ok: !!json.ok,
        msg: json.ok
          ? 'Evento de teste enviado com sucesso! Verifique no Gerenciador de Eventos.'
          : json.body || json.error || 'Falha no envio do evento de teste.',
      })
    } catch {
      setTestResult({ id: p.id, ok: false, msg: 'Erro de conexão ao testar.' })
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Carregando pixels...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertTriangle className="size-7 text-destructive" />
        <p className="text-sm text-muted-foreground">Não foi possível carregar os pixels.</p>
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
      {/* Cabecalho explicativo */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Facebook className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">Pixels do Facebook</h2>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              Adicione um ou mais pixels. Todos os pixels ativos recebem os eventos: PageView,
              Cadastro (CompleteRegistration), InitiateCheckout em /convite, PixGerado e Purchase
              (quando o pagamento é confirmado). Os eventos de compra são enviados também pelo
              servidor (Conversions API) para atribuição precisa e sem duplicação.
            </p>
          </div>
        </div>
      </section>

      {/* Lista de pixels */}
      {pixels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum pixel configurado ainda. Adicione o primeiro abaixo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pixels.map((p) => (
            <section key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {p.label || 'Pixel sem nome'}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-bold',
                        p.enabled
                          ? 'bg-positive/15 text-positive'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {p.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">ID: {p.pixel_id}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    Token: {p.access_token_masked}
                  </p>
                  {p.test_event_code && (
                    <p className="font-mono text-xs text-muted-foreground">
                      Test code: {p.test_event_code}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testPixel(p)}
                    disabled={busyId === p.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
                  >
                    <Send className="size-3.5" /> Testar
                  </button>
                  <button
                    onClick={() => toggleEnabled(p)}
                    disabled={busyId === p.id}
                    role="switch"
                    aria-checked={p.enabled}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50',
                      p.enabled ? 'bg-positive' : 'bg-muted-foreground/40',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block size-5 transform rounded-full bg-white shadow transition',
                        p.enabled ? 'translate-x-[1.4rem]' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                  <button
                    onClick={() => removePixel(p)}
                    disabled={busyId === p.id}
                    aria-label="Remover pixel"
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-secondary/40 p-2 text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {testResult && testResult.id === p.id && (
                <div
                  className={cn(
                    'mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs',
                    testResult.ok
                      ? 'border-positive/40 bg-positive/5 text-positive'
                      : 'border-destructive/40 bg-destructive/5 text-destructive',
                  )}
                >
                  {testResult.ok ? (
                    <Check className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  )}
                  <span className="break-all">{testResult.msg}</span>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Adicionar novo pixel */}
      {showForm ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold text-foreground">Novo pixel</h3>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="px-label" className="text-sm font-semibold text-foreground">
                Nome (opcional)
              </label>
              <input
                id="px-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex.: Pixel principal"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="px-id" className="text-sm font-semibold text-foreground">
                Pixel ID
              </label>
              <input
                id="px-id"
                type="text"
                inputMode="numeric"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="Ex.: 1234567890123456"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="px-token" className="text-sm font-semibold text-foreground">
                Access Token (Conversions API)
              </label>
              <div className="relative mt-1.5">
                <input
                  id="px-token"
                  type={showToken ? 'text' : 'password'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAB..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-11 font-mono text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="px-test" className="text-sm font-semibold text-foreground">
                Test Event Code (opcional)
              </label>
              <input
                id="px-test"
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="Ex.: TEST12345"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={addPixel}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Salvar pixel
              </button>
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                disabled={saving}
                className="rounded-xl border border-border bg-secondary/40 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </section>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-primary/5 px-5 py-4 text-sm font-semibold text-primary transition hover:bg-primary/10"
        >
          <Plus className="size-4" /> Adicionar pixel
        </button>
      )}
    </div>
  )
}
