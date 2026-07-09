'use client'

import { useState } from 'react'
import { AlertTriangle, Ban, Loader2, ShieldCheck } from 'lucide-react'
import { BAN_REASONS } from '@/lib/painel/ban-reasons'
import { cn } from '@/lib/utils'

interface BanUserModalProps {
  // Dados minimos para identificar a conta a banir/desbanir
  userId: string
  label: string
  // Se a conta ja esta banida, o modal opera em modo "desbanir"
  banned?: boolean
  currentReason?: string | null
  onClose: () => void
  onDone: () => void
}

const OTHER = '__other__'

export function BanUserModal({
  userId,
  label,
  banned = false,
  currentReason,
  onClose,
  onDone,
}: BanUserModalProps) {
  const [selected, setSelected] = useState<string>(BAN_REASONS[0])
  const [customReason, setCustomReason] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reason = selected === OTHER ? customReason.trim() : selected
  const canSubmit = banned || reason.length > 0

  async function submit() {
    setWorking(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: banned ? 'unban' : 'ban',
          reason: banned ? undefined : reason,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.error) {
        setError(json?.error || 'Falha na operação')
        return
      }
      onDone()
      onClose()
    } catch {
      setError('Erro de conexão')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Fechar"
        onClick={() => !working && onClose()}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-3 flex items-center gap-2.5">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              banned ? 'bg-primary/15' : 'bg-destructive/15',
            )}
          >
            {banned ? (
              <ShieldCheck className="size-5 text-primary" />
            ) : (
              <AlertTriangle className="size-5 text-destructive" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground">
              {banned ? 'Desbanir conta' : 'Banir conta'}
            </h3>
            <p className="truncate text-xs text-muted-foreground">{label}</p>
          </div>
        </div>

        {banned ? (
          <p className="mb-4 text-sm text-muted-foreground">
            {currentReason ? (
              <>
                Esta conta está banida por:{' '}
                <strong className="text-foreground">{currentReason}</strong>. Ao desbanir, ela
                poderá fazer login novamente.
              </>
            ) : (
              'Ao desbanir, esta conta poderá fazer login novamente.'
            )}
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Selecione o motivo do banimento. Ele será exibido à usuária quando ela tentar
              acessar a conta.
            </p>
            <div className="mb-4 flex flex-col gap-1.5">
              {BAN_REASONS.map((r) => (
                <label
                  key={r}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition',
                    selected === r
                      ? 'border-primary/60 bg-primary/10 text-foreground'
                      : 'border-border bg-background/40 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <input
                    type="radio"
                    name="ban-reason"
                    checked={selected === r}
                    onChange={() => setSelected(r)}
                    className="accent-primary"
                  />
                  {r}
                </label>
              ))}
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition',
                  selected === OTHER
                    ? 'border-primary/60 bg-primary/10 text-foreground'
                    : 'border-border bg-background/40 text-muted-foreground hover:text-foreground',
                )}
              >
                <input
                  type="radio"
                  name="ban-reason"
                  checked={selected === OTHER}
                  onChange={() => setSelected(OTHER)}
                  className="accent-primary"
                />
                Outro motivo
              </label>
              {selected === OTHER && (
                <input
                  autoFocus
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Descreva o motivo..."
                  maxLength={300}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                />
              )}
            </div>
          </>
        )}

        {error && (
          <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={working}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={working || !canSubmit}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50',
              banned
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-destructive text-destructive-foreground hover:opacity-90',
            )}
          >
            {working ? (
              <Loader2 className="size-4 animate-spin" />
            ) : banned ? (
              <ShieldCheck className="size-4" />
            ) : (
              <Ban className="size-4" />
            )}
            {banned ? 'Desbanir' : 'Banir'}
          </button>
        </div>
      </div>
    </div>
  )
}
