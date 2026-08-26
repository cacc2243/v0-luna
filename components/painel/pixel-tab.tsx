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
  MousePointerClick,
  QrCode,
  Newspaper,
  Music2,
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

type Trigger = 'pageview' | 'pix'

/**
 * Controle do gatilho do evento InitiateCheckout: define se ele dispara ao
 * entrar em /convite (PageView) ou quando o PIX é gerado. Lê e salva via
 * /api/admin/settings.
 */
function InitiateCheckoutTrigger() {
  const { data, mutate } = useSWR<{ settings?: { initiateCheckoutTrigger?: Trigger } }>(
    '/api/admin/settings',
    fetcher,
  )
  const current: Trigger = data?.settings?.initiateCheckoutTrigger === 'pageview' ? 'pageview' : 'pix'

  const [saving, setSaving] = useState<Trigger | null>(null)
  const [savedOk, setSavedOk] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const save = async (value: Trigger) => {
    if (value === current || saving) return
    setSaving(value)
    setSavedOk(false)
    setSaveError(null)
    // Atualização otimista para resposta imediata na UI.
    await mutate(
      async (prev) => {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initiateCheckoutTrigger: value }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Falha ao salvar')
        return json
      },
      {
        optimisticData: (prev) => ({
          ...(prev || {}),
          settings: { ...(prev?.settings || {}), initiateCheckoutTrigger: value },
        }),
        rollbackOnError: true,
        revalidate: false,
      },
    )
      .then(() => {
        setSavedOk(true)
        setTimeout(() => setSavedOk(false), 2500)
      })
      .catch((e) => setSaveError(e instanceof Error ? e.message : 'Falha ao salvar'))
      .finally(() => setSaving(null))
  }

  const options: { value: Trigger; label: string; desc: string; icon: typeof QrCode }[] = [
    {
      value: 'pageview',
      label: 'Ao entrar no /convite',
      desc: 'Dispara assim que a pessoa acessa a página do convite.',
      icon: MousePointerClick,
    },
    {
      value: 'pix',
      label: 'Ao gerar o PIX',
      desc: 'Dispara somente quando o PIX é efetivamente gerado.',
      icon: QrCode,
    },
  ]

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Gatilho do InitiateCheckout</h3>
          <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            Escolha em que momento o evento{' '}
            <span className="font-semibold text-foreground">InitiateCheckout</span> é enviado aos
            pixels.
          </p>
        </div>
        {savedOk && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-positive/15 px-2.5 py-1 text-xs font-bold text-positive">
            <Check className="size-3.5" /> Salvo
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const active = current === opt.value
          const isSaving = saving === opt.value
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => save(opt.value)}
              disabled={!!saving}
              aria-pressed={active}
              className={cn(
                'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition disabled:opacity-60',
                active
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border bg-background hover:border-primary/50',
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg',
                    active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[0.7rem] font-bold text-primary-foreground">
                    <Check className="size-3" /> Ativo
                  </span>
                ) : null}
              </div>
              <span className="text-sm font-bold text-foreground">{opt.label}</span>
              <span className="text-pretty text-xs leading-relaxed text-muted-foreground">
                {opt.desc}
              </span>
            </button>
          )
        })}
      </div>

      {saveError && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {saveError}
        </div>
      )}
    </section>
  )
}

function FacebookPixels() {
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

      {/* Gatilho do InitiateCheckout */}
      <InitiateCheckoutTrigger />

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

// ─────────────────────────────────────────────────────────────────────────────
// Taboola
// ─────────────────────────────────────────────────────────────────────────────

interface TaboolaRow {
  id: string
  label: string
  account_id: string
  enabled: boolean
  created_at: string
}

function TaboolaPixels() {
  const { data, error, isLoading, mutate } = useSWR<{ pixels: TaboolaRow[] }>(
    '/api/admin/taboola-pixels',
    fetcher,
  )

  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [accountId, setAccountId] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const pixels = data?.pixels || []

  const resetForm = () => {
    setLabel('')
    setAccountId('')
    setFormError(null)
  }

  const addPixel = async () => {
    setFormError(null)
    if (!accountId.trim()) {
      setFormError('Informe o Account ID do Taboola.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/taboola-pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), account_id: accountId.trim() }),
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

  const toggleEnabled = async (p: TaboolaRow) => {
    setBusyId(p.id)
    try {
      await fetch('/api/admin/taboola-pixels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, enabled: !p.enabled }),
      })
      await mutate()
    } finally {
      setBusyId(null)
    }
  }

  const removePixel = async (p: TaboolaRow) => {
    if (!confirm(`Remover o pixel do Taboola ${p.account_id}? Esta ação não pode ser desfeita.`))
      return
    setBusyId(p.id)
    try {
      await fetch(`/api/admin/taboola-pixels?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' })
      await mutate()
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
            <Newspaper className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">Pixels do Taboola</h2>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              Adicione um ou mais pixels (Account ID). Todos os pixels ativos recebem os eventos:{' '}
              <span className="font-semibold text-foreground">page_view</span> (em cada página),{' '}
              <span className="font-semibold text-foreground">start_checkout</span> (início do
              checkout) e <span className="font-semibold text-foreground">make_purchase</span> (compra
              confirmada), no formato exigido pelo Taboola (com revenue, currency e orderid).
            </p>
          </div>
        </div>
      </section>

      {/* Lista de pixels */}
      {pixels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum pixel do Taboola configurado ainda. Adicione o primeiro abaixo.
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
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Account ID: {p.account_id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
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
            </section>
          ))}
        </div>
      )}

      {/* Adicionar novo pixel */}
      {showForm ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold text-foreground">Novo pixel do Taboola</h3>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="tb-label" className="text-sm font-semibold text-foreground">
                Nome (opcional)
              </label>
              <input
                id="tb-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex.: Taboola principal"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="tb-id" className="text-sm font-semibold text-foreground">
                Account ID
              </label>
              <input
                id="tb-id"
                type="text"
                inputMode="numeric"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Ex.: 2086256"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                É o número que aparece na URL do seu pixel:{' '}
                <span className="font-mono">cdn.taboola.com/libtrc/unip/&lt;Account ID&gt;/tfa.js</span>
              </p>
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

// ───────────────────────────────────────────────���─────────────────────────────
// TikTok
// ─────────────────────────────────────────────────────────────────────────────

interface TiktokRow {
  id: string
  label: string
  pixel_id: string
  access_token_masked: string
  has_token: boolean
  test_event_code: string | null
  enabled: boolean
  created_at: string
}

function TiktokPixels() {
  const { data, error, isLoading, mutate } = useSWR<{ pixels: TiktokRow[] }>(
    '/api/admin/tiktok-pixels',
    fetcher,
  )

  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [pixelId, setPixelId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [testCode, setTestCode] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const pixels = data?.pixels || []

  const resetForm = () => {
    setLabel('')
    setPixelId('')
    setAccessToken('')
    setTestCode('')
    setFormError(null)
    setTestResult(null)
  }

  const addPixel = async () => {
    setFormError(null)
    if (!pixelId.trim()) {
      setFormError('Informe o Pixel ID do TikTok.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tiktok-pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          pixel_id: pixelId.trim(),
          access_token: accessToken.trim(),
          test_event_code: testCode.trim(),
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

  // Testa a Events API com os dados digitados no formulário (antes de salvar).
  const testConnection = async () => {
    setTestResult(null)
    if (!pixelId.trim() || !accessToken.trim()) {
      setTestResult({ ok: false, msg: 'Informe o Pixel ID e o Access Token para testar.' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tiktok-pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          pixelId: pixelId.trim(),
          accessToken: accessToken.trim(),
          testEventCode: testCode.trim() || null,
        }),
      })
      const json = await res.json()
      setTestResult({
        ok: Boolean(json?.ok),
        msg: json?.ok
          ? 'Conexão OK! O TikTok aceitou o evento de teste.'
          : json?.error || json?.body || 'O TikTok recusou o evento de teste.',
      })
    } catch {
      setTestResult({ ok: false, msg: 'Erro de conexão ao testar.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = async (p: TiktokRow) => {
    setBusyId(p.id)
    try {
      await fetch('/api/admin/tiktok-pixels', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, enabled: !p.enabled }),
      })
      await mutate()
    } finally {
      setBusyId(null)
    }
  }

  const removePixel = async (p: TiktokRow) => {
    if (!confirm(`Remover o pixel do TikTok ${p.pixel_id}? Esta ação não pode ser desfeita.`)) return
    setBusyId(p.id)
    try {
      await fetch(`/api/admin/tiktok-pixels?id=${encodeURIComponent(p.id)}`, { method: 'DELETE' })
      await mutate()
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
            <Music2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">Pixels do TikTok</h2>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              Adicione um ou mais pixels. Todos os pixels ativos recebem os eventos:{' '}
              <span className="font-semibold text-foreground">Pageview</span> (em cada página),{' '}
              <span className="font-semibold text-foreground">InitiateCheckout</span> (PIX gerado) e{' '}
              <span className="font-semibold text-foreground">CompletePayment</span> (compra
              confirmada).
            </p>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              O <span className="font-semibold text-foreground">Access Token</span> é opcional. Com
              ele, a compra também é enviada pelo servidor (Events API) quando o PIX é aprovado —
              garantindo a conversão mesmo se a pessoa fechar a aba antes da tela de confirmação. O
              mesmo <span className="font-mono text-xs">event_id</span> é usado nos dois envios,
              então o TikTok não conta em dobro.
            </p>
          </div>
        </div>
      </section>

      {/* Lista de pixels */}
      {pixels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum pixel do TikTok configurado ainda. Adicione o primeiro abaixo.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pixels.map((p) => (
            <section key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
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
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-bold',
                        p.has_token
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {p.has_token ? 'Events API' : 'Só navegador'}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Pixel ID: {p.pixel_id}
                  </p>
                  {p.has_token && (
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      Token: {p.access_token_masked}
                    </p>
                  )}
                  {p.test_event_code && (
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      Test code: {p.test_event_code}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
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
            </section>
          ))}
        </div>
      )}

      {/* Adicionar novo pixel */}
      {showForm ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-base font-bold text-foreground">Novo pixel do TikTok</h3>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="tt-label" className="text-sm font-semibold text-foreground">
                Nome (opcional)
              </label>
              <input
                id="tt-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex.: TikTok principal"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="tt-id" className="text-sm font-semibold text-foreground">
                Pixel ID
              </label>
              <input
                id="tt-id"
                type="text"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value.toUpperCase())}
                placeholder="Ex.: DA7MQU3C77UES9743UEG"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Está no TikTok Ads Manager em Ferramentas {'>'} Eventos {'>'} Web, no código do
                pixel.
              </p>
            </div>

            <div>
              <label htmlFor="tt-token" className="text-sm font-semibold text-foreground">
                Access Token (opcional)
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="tt-token"
                  type={showToken ? 'text' : 'password'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Vazio = só o pixel do navegador"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-secondary/40 p-2.5 text-muted-foreground transition hover:text-foreground"
                >
                  {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Gere em Eventos {'>'} Gerenciar {'>'} Events API. Com o token, o CompletePayment
                também é enviado pelo servidor quando o PIX é aprovado.
              </p>
            </div>

            <div>
              <label htmlFor="tt-test" className="text-sm font-semibold text-foreground">
                Test Event Code (opcional)
              </label>
              <input
                id="tt-test"
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="Só para depuração no Test Events"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                {formError}
              </div>
            )}

            {testResult && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-xl border px-3 py-2 text-xs',
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

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={addPixel}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Salvar pixel
              </button>
              <button
                onClick={testConnection}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                <Send className="size-4" /> Testar conexão
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

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper: alterna entre os provedores de pixel (Facebook, Taboola e TikTok)
// ─────────────────────────────────────────────────────────────────────────────

type Provider = 'facebook' | 'taboola' | 'tiktok'

export function PixelTab() {
  const [provider, setProvider] = useState<Provider>('facebook')

  const tabs: { key: Provider; label: string; icon: typeof Facebook }[] = [
    { key: 'facebook', label: 'Facebook', icon: Facebook },
    { key: 'taboola', label: 'Taboola', icon: Newspaper },
    { key: 'tiktok', label: 'TikTok', icon: Music2 },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Seletor de provedor */}
      <div className="flex gap-2 rounded-2xl border border-border bg-card p-1.5">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = provider === t.key
          return (
            <button
              key={t.key}
              onClick={() => setProvider(t.key)}
              aria-pressed={active}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {provider === 'facebook' && <FacebookPixels />}
      {provider === 'taboola' && <TaboolaPixels />}
      {provider === 'tiktok' && <TiktokPixels />}
    </div>
  )
}
