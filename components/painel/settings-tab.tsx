'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import {
  Settings,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Check,
  AlertTriangle,
  Server,
  Plug,
  Gift,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GatewayMeta {
  id: string
  label: string
  description: string
  configured: boolean
}

interface SettingsPayload {
  settings: {
    verificationEnabled: boolean
    activeCashoutGateway: string
    activeCashinGateway: string
    verificationAmountCents: number
    inviteAmountCents: number
  }
  gateways: GatewayMeta[]
  cashinGateways: GatewayMeta[]
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

export function SettingsTab() {
  const { data, error, isLoading, mutate } = useSWR<SettingsPayload>(
    '/api/admin/settings',
    fetcher,
    { revalidateOnFocus: false },
  )

  // Estado local de edicao
  const [enabled, setEnabled] = useState(true)
  const [gateway, setGateway] = useState('pixup')
  const [cashinGateway, setCashinGateway] = useState('bynet')
  const [amountReais, setAmountReais] = useState('0,90')
  const [inviteReais, setInviteReais] = useState('24,80')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Sincroniza estado local quando os dados chegam
  useEffect(() => {
    if (data?.settings) {
      setEnabled(data.settings.verificationEnabled)
      setGateway(data.settings.activeCashoutGateway)
      setCashinGateway(data.settings.activeCashinGateway)
      setAmountReais(
        ((data.settings.verificationAmountCents || 0) / 100)
          .toFixed(2)
          .replace('.', ','),
      )
      setInviteReais(
        ((data.settings.inviteAmountCents || 0) / 100).toFixed(2).replace('.', ','),
      )
    }
  }, [data])

  const gateways = data?.gateways || []
  const cashinGateways = data?.cashinGateways || []

  const parseAmountCents = (str: string): number | null => {
    const normalized = str.replace(/\./g, '').replace(',', '.')
    const reais = Number(normalized)
    if (!Number.isFinite(reais)) return null
    return Math.round(reais * 100)
  }

  const dirty =
    data?.settings &&
    (enabled !== data.settings.verificationEnabled ||
      gateway !== data.settings.activeCashoutGateway ||
      cashinGateway !== data.settings.activeCashinGateway ||
      parseAmountCents(amountReais) !== data.settings.verificationAmountCents ||
      parseAmountCents(inviteReais) !== data.settings.inviteAmountCents)

  const save = async () => {
    setSaveError(null)
    const cents = parseAmountCents(amountReais)
    if (cents === null || cents < 1 || cents > 5000) {
      setSaveError('Valor de verificação inválido. Use algo entre R$ 0,01 e R$ 50,00.')
      return
    }
    const inviteCents = parseAmountCents(inviteReais)
    if (inviteCents === null || inviteCents < 100 || inviteCents > 100000) {
      setSaveError('Valor do convite inválido. Use algo entre R$ 1,00 e R$ 1.000,00.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationEnabled: enabled,
          activeCashoutGateway: gateway,
          verificationAmountCents: cents,
          inviteAmountCents: inviteCents,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveError(json?.error || 'Falha ao salvar configurações.')
        return
      }
      await mutate(json, { revalidate: false })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError('Erro de conexão ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Carregando configurações...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <AlertTriangle className="size-7 text-destructive" />
        <p className="text-sm text-muted-foreground">Não foi possível carregar as configurações.</p>
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
      {/* Verificacao de chave PIX */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              enabled ? 'bg-positive/15 text-positive' : 'bg-muted text-muted-foreground',
            )}
          >
            {enabled ? <ShieldCheck className="size-5" /> : <ShieldOff className="size-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">Verificação de chave PIX</h2>
            <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
              Quando ativa, novos usuários precisam confirmar o valor recebido por PIX para
              concluir o cadastro. Quando desativada, o cadastro é concluído logo após informar a
              chave, sem a etapa de verificação.
            </p>

            <button
              onClick={() => setEnabled((v) => !v)}
              role="switch"
              aria-checked={enabled}
              className={cn(
                'mt-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                enabled ? 'border-positive/40 bg-positive/5' : 'border-border bg-secondary/40',
              )}
            >
              <span
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
                  enabled ? 'bg-positive' : 'bg-muted-foreground/40',
                )}
              >
                <span
                  className={cn(
                    'inline-block size-5 transform rounded-full bg-white shadow transition',
                    enabled ? 'translate-x-[1.4rem]' : 'translate-x-0.5',
                  )}
                />
              </span>
              <span className="text-sm font-semibold text-foreground">
                {enabled ? 'Etapa de verificação ativa' : 'Etapa de verificação desativada'}
              </span>
            </button>
          </div>
        </div>

        {/* Valor do PIX de confirmacao */}
        <div
          className={cn(
            'mt-5 border-t border-border pt-5 transition',
            !enabled && 'pointer-events-none opacity-50',
          )}
        >
          <label htmlFor="amount" className="text-sm font-semibold text-foreground">
            Valor do PIX de confirmação
          </label>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">
            Valor exato que o usuário deverá confirmar no cadastro. Aplicado no servidor — o
            cliente não consegue alterar.
          </p>
          <div className="relative max-w-[12rem]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              R$
            </span>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amountReais}
              onChange={(e) => setAmountReais(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-semibold text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* Gateway de cashout */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Server className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Gateway de cash-out</h2>
            <p className="text-sm text-muted-foreground">
              Plataforma que envia o PIX de verificação.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {gateways.map((g) => {
            const active = gateway === g.id
            const selectable = g.configured
            return (
              <button
                key={g.id}
                disabled={!selectable}
                onClick={() => selectable && setGateway(g.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3.5 text-left transition',
                  active
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-secondary/30 hover:border-muted-foreground/40',
                  !selectable && 'cursor-not-allowed opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition',
                    active ? 'border-primary bg-primary' : 'border-muted-foreground/50',
                  )}
                >
                  {active && <span className="size-2 rounded-full bg-primary-foreground" />}
                </span>
                <Plug
                  className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{g.label}</span>
                    {!g.configured && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-500">
                        Não configurado
                      </span>
                    )}
                    {g.configured && active && (
                      <span className="rounded-full bg-positive/15 px-2 py-0.5 text-[0.65rem] font-semibold text-positive">
                        Ativo
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {g.description}
                  </span>
                </span>
              </button>
            )
          })}
          {gateways.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nenhum gateway registrado.
            </p>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Para adicionar um novo gateway, basta registrá-lo no servidor — ele aparece aqui
          automaticamente como opção selecionável.
        </p>
      </section>

      {/* Valor do convite (/convite) */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Gift className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Valor do convite</h2>
            <p className="text-sm text-muted-foreground">
              Preço exibido e cobrado na página <span className="font-medium">/convite</span>.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="invite-amount" className="text-sm font-semibold text-foreground">
            Valor do convite (PIX)
          </label>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">
            Define o preço mostrado no card e o valor do PIX gerado. Aplicado no servidor — o
            cliente não consegue alterar.
          </p>
          <div className="relative max-w-[12rem]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              R$
            </span>
            <input
              id="invite-amount"
              type="text"
              inputMode="decimal"
              value={inviteReais}
              onChange={(e) => setInviteReais(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-semibold text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* Barra de salvar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3.5 shadow-lg backdrop-blur">
        <div className="min-w-0 text-sm">
          {saveError ? (
            <span className="flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {saveError}
            </span>
          ) : dirty ? (
            <span className="text-muted-foreground">Alterações não salvas</span>
          ) : (
            <span className="text-muted-foreground">Tudo salvo</span>
          )}
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className={cn(
            'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition',
            dirty && !saving
              ? 'bg-primary text-primary-foreground hover:opacity-90'
              : 'cursor-not-allowed bg-muted text-muted-foreground',
          )}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4" />
          ) : (
            <Settings className="size-4" />
          )}
          {saving ? 'Salvando...' : saved ? 'Salvo' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
