'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
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
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface TestResult {
  success: boolean
  error?: string
  latency?: number
  pixCode?: string
  transactionId?: string
  amount?: number
  customer?: {
    name: string
    email: string
    document: { number: string }
  }
}

export function GatewayTestTab() {
  const { data } = useSWR('/api/admin/gateway-test', fetcher)
  const gateways: { id: string; label: string; configured: boolean }[] =
    data?.gateways || []

  const [selected, setSelected] = useState<string>('bynet')
  const [amount, setAmount] = useState('24.80')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function runTest() {
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15">
            <Zap className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Teste de Gateways</h2>
            <p className="text-sm text-muted-foreground">
              Gere um PIX de teste com dados preenchidos automaticamente
            </p>
          </div>
        </div>

        {/* Selecao de gateway */}
        <label className="mb-2 block text-sm font-medium text-foreground">
          Gateway de pagamento
        </label>
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {gateways.map((g) => (
            <button
              key={g.id}
              onClick={() => g.configured && setSelected(g.id)}
              disabled={!g.configured}
              className={`relative rounded-xl border px-3 py-3 text-sm font-medium transition ${
                selected === g.id
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/40'
              } ${!g.configured ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {g.label}
              <span
                className={`mt-1 block text-[10px] font-normal ${
                  g.configured ? 'text-positive' : 'text-muted-foreground'
                }`}
              >
                {g.configured ? 'Configurado' : 'Indisponível'}
              </span>
            </button>
          ))}
        </div>

        {/* Valor */}
        <label className="mb-2 block text-sm font-medium text-foreground">
          Valor do PIX (R$)
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 py-3 pl-10 pr-4 text-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={runTest}
            disabled={loading || !gateways.find((g) => g.id === selected)?.configured}
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
                Gerar PIX de teste
              </>
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {['24.80', '49.90', '97.00', '197.00'].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="rounded-lg border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
            >
              R$ {v.replace('.', ',')}
            </button>
          ))}
        </div>
      </div>

      {/* Resultado */}
      {result && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 ${
            result.success
              ? 'border-positive/30 bg-positive/5'
              : 'border-destructive/30 bg-destructive/5'
          }`}
        >
          <div className="mb-4 flex items-center gap-3">
            {result.success ? (
              <CheckCircle2 className="size-6 text-positive" />
            ) : (
              <XCircle className="size-6 text-destructive" />
            )}
            <div>
              <h3 className="font-bold text-foreground">
                {result.success ? 'PIX gerado com sucesso' : 'Falha ao gerar PIX'}
              </h3>
              {result.latency != null && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  Latência: {result.latency}ms
                </p>
              )}
            </div>
          </div>

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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Valor" value={`R$ ${result.amount?.toFixed(2).replace('.', ',')}`} />
                  <Info label="Transação" value={result.transactionId?.slice(0, 12) + '...'} />
                  <Info label="Cliente (auto)" value={result.customer?.name || '-'} />
                  <Info label="CPF (auto)" value={result.customer?.document.number || '-'} />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Código PIX copia e cola
                  </p>
                  <div className="rounded-xl border border-border bg-muted/40 p-3">
                    <p className="break-all font-mono text-xs text-foreground">
                      {result.pixCode}
                    </p>
                  </div>
                  <button
                    onClick={copyCode}
                    className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
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
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate font-medium text-foreground">{value}</p>
    </div>
  )
}
