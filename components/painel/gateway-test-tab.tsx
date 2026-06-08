'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import QRCode from 'qrcode'
import {
  Zap,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  AlertTriangle,
} from 'lucide-react'

interface TestResult {
  success: boolean
  error?: string
  latency?: number
  pixCode?: string
  transactionId?: string
  amount?: number
  gateway?: string
  gatewayLabel?: string
  customer?: {
    name: string
    email: string
  }
}

interface GatewayMeta {
  id: string
  label: string
  description: string
  configured: boolean
}

const PRESETS = ['24.80', '49.90', '97.00', '197.00']

export function GatewayTestTab() {
  const [amount, setAmount] = useState('24.80')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [gateways, setGateways] = useState<GatewayMeta[]>([])
  const [selected, setSelected] = useState<string>('')

  // Carrega os gateways de cash-in disponiveis (Bynet, SigiloPay, etc.)
  useEffect(() => {
    fetch('/api/admin/gateway-test')
      .then((r) => r.json())
      .then((d) => {
        const list: GatewayMeta[] = d?.gateways || []
        setGateways(list)
        // Pre-seleciona o primeiro gateway configurado.
        const firstConfigured = list.find((g) => g.configured) || list[0]
        if (firstConfigured) setSelected(firstConfigured.id)
      })
      .catch(() => setGateways([]))
  }, [])

  async function runTest() {
    if (!selected) return
    setLoading(true)
    setResult(null)
    setQrCode(null)
    try {
      const res = await fetch('/api/admin/gateway-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway: selected, amount: parseFloat(amount) }),
      })
      const json: TestResult = await res.json()
      setResult(json)

      if (json.success && json.pixCode) {
        const url = await QRCode.toDataURL(json.pixCode, {
          width: 200,
          margin: 1,
          errorCorrectionLevel: 'M',
        })
        setQrCode(url)
      }
    } catch {
      setResult({ success: false, error: 'Falha de conexão ao testar o gateway.' })
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    if (result?.pixCode) {
      navigator.clipboard.writeText(result.pixCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const selectedMeta = gateways.find((g) => g.id === selected)

  return (
    <div className="flex flex-col gap-5">
      {/* Card de teste */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-positive/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-positive/15">
              <ShieldCheck className="size-6 text-positive" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Teste de Gateway</p>
              <p className="text-xs text-muted-foreground">
                Gere um PIX real em qualquer gateway de geração
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Gere um PIX de teste real. O sistema preenche automaticamente nome, e-mail e CPF
            válidos para garantir a emissão.
          </p>

          {/* Seletor de gateway */}
          <label className="mb-2 block text-sm font-medium text-foreground">Gateway</label>
          <div className="mb-4 flex flex-wrap gap-2">
            {gateways.map((g) => {
              const active = selected === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => g.configured && setSelected(g.id)}
                  disabled={!g.configured}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background/40 text-muted-foreground hover:text-foreground'
                  } ${!g.configured ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {g.label}
                  {!g.configured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-amber-500">
                      <AlertTriangle className="size-2.5" />
                      Não config.
                    </span>
                  )}
                </button>
              )
            })}
            {gateways.length === 0 && (
              <p className="text-sm text-muted-foreground">Carregando gateways...</p>
            )}
          </div>
          {selectedMeta && (
            <p className="mb-4 -mt-2 text-xs text-muted-foreground">{selectedMeta.description}</p>
          )}

          <label className="mb-2 block text-sm font-medium text-foreground">Valor do PIX</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 py-3 pl-10 pr-4 text-lg font-semibold text-foreground outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={runTest}
              disabled={loading || !selected}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="size-4" />
                  Gerar PIX
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                  amount === v
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                R$ {v.replace('.', ',')}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Resultado */}
      {result && (
        <section
          className={`overflow-hidden rounded-3xl border ${
            result.success ? 'border-positive/30' : 'border-destructive/30'
          }`}
        >
          <div
            className={`flex items-center gap-3 px-5 py-4 ${
              result.success ? 'bg-positive/5' : 'bg-destructive/5'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="size-6 text-positive" />
            ) : (
              <XCircle className="size-6 text-destructive" />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-foreground">
                {result.success
                  ? `PIX gerado com sucesso${result.gatewayLabel ? ` · ${result.gatewayLabel}` : ''}`
                  : 'Falha ao gerar PIX'}
              </h3>
              {result.latency != null && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  Latência: {result.latency}ms
                </p>
              )}
            </div>
          </div>

          <div className="bg-card p-5 sm:p-6">
            {result.success ? (
              <div className="grid gap-6 md:grid-cols-[auto_1fr]">
                {qrCode && (
                  <div className="flex justify-center">
                    <div className="rounded-2xl bg-white p-3">
                      <Image
                        src={qrCode}
                        alt="QR Code PIX de teste"
                        width={160}
                        height={160}
                        className="size-[160px]"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Info
                      label="Valor"
                      value={`R$ ${result.amount?.toFixed(2).replace('.', ',')}`}
                    />
                    <Info
                      label="Transação"
                      value={(result.transactionId?.slice(0, 12) || '-') + '...'}
                    />
                  </div>
                  <div className="rounded-xl border border-border bg-background/40 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <User className="size-3" />
                      Dados preenchidos automaticamente
                    </p>
                    <p className="text-sm font-medium text-foreground">{result.customer?.name}</p>
                    <p className="text-xs text-muted-foreground">{result.customer?.email}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Código PIX copia e cola
                    </p>
                    <div className="rounded-xl border border-border bg-background/40 p-3">
                      <p className="break-all font-mono text-xs text-foreground">
                        {result.pixCode}
                      </p>
                    </div>
                    <button
                      onClick={copyCode}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied ? 'Copiado!' : 'Copiar código'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-destructive">{result.error}</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate font-medium text-foreground">{value}</p>
    </div>
  )
}
