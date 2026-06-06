'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Gift,
  Sparkles,
  ShieldCheck,
  Lock,
  Wallet,
  Clock,
  BadgeCheck,
  Loader2,
  PartyPopper,
  Bot,
  UserX,
  Infinity as InfinityIcon,
} from 'lucide-react'

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Partículas de confete reaproveitadas em vários estados
function Confetti({ count = 14 }: { count?: number }) {
  const colors = ['bg-primary', 'bg-positive', 'bg-accent', 'bg-amber-400']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`animate-confetti absolute top-0 size-2 rounded-[2px] ${colors[i % colors.length]}`}
          style={{
            left: `${(i / count) * 100 + (i % 2 === 0 ? 3 : -3)}%`,
            animationDelay: `${(i % 5) * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Presente Recebido
// Fluxo: "sealed" (caixa fechada, abrir) -> "gift" (valor revelado) -> resgatar
// "locked" -> conta sem habilitação · "claimed" -> celebração final
// ─────────────────────────────────────────────────────────────────────────────

interface GiftReceivedModalProps {
  isOpen: boolean
  onClose: () => void
  senderName: string
  senderAvatar?: string | null
  amount: number
  /** A conta já pode aceitar presentes? */
  giftsEnabled: boolean
  /** Resgatar o presente (credita saldo). Retorna sucesso. */
  onClaim: () => Promise<boolean>
  /** Abrir o fluxo de habilitação de presentes */
  onActivate: () => void
  /** Disparada quando ela tenta resgatar mas a conta não tem presentes ativos */
  onLockedAttempt?: () => void
}

export function GiftReceivedModal({
  isOpen,
  onClose,
  senderName,
  senderAvatar,
  amount,
  giftsEnabled,
  onClaim,
  onActivate,
  onLockedAttempt,
}: GiftReceivedModalProps) {
  const [view, setView] = useState<'sealed' | 'opening' | 'gift' | 'locked' | 'claimed'>('sealed')
  const [claiming, setClaiming] = useState(false)

  // Sempre que reabrir, recomeça pela caixa fechada
  useEffect(() => {
    if (isOpen) {
      setView('sealed')
      setClaiming(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  function handleOpenGift() {
    // anima a caixa abrindo e então revela o valor
    setView('opening')
    setTimeout(() => setView('gift'), 1300)
  }

  async function handleClaim() {
    // Sem habilitação -> mostra o aviso de bloqueio e avisa o chat (remetente responde)
    if (!giftsEnabled) {
      onLockedAttempt?.()
      setView('locked')
      return
    }
    setClaiming(true)
    const ok = await onClaim()
    setClaiming(false)
    if (ok) setView('claimed')
  }

  function handleClose() {
    setView('sealed')
    setClaiming(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/20 p-2 text-white/90 transition hover:bg-black/40"
        >
          <X className="size-5" />
        </button>

        {/* ── Estado: Caixa fechada (chamando para abrir) ──────────────── */}
        {(view === 'sealed' || view === 'opening') && (
          <div className="relative overflow-hidden px-5 pb-7 pt-10 text-center">
            {/* fundo radial suave */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/5 to-transparent"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="flex items-center justify-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="size-3.5" />
                Você recebeu um presente
              </p>

              {/* caixa de presente */}
              <div className="relative mx-auto mt-6 flex size-32 items-center justify-center">
                <span className="animate-gift-glow absolute inset-0 rounded-[2rem] bg-primary/40 blur-xl" aria-hidden="true" />
                <div
                  className={`relative flex size-28 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/40 ${
                    view === 'opening' ? 'animate-gift-open' : 'animate-gift-wiggle'
                  }`}
                >
                  <Gift className="size-14 text-primary-foreground" />
                </div>
                {view === 'opening' && <Confetti count={16} />}
              </div>

              <p className="mx-auto mt-6 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{senderName}</span> enviou algo especial para
                você. Toque para abrir e descobrir o valor!
              </p>

              <button
                onClick={handleOpenGift}
                disabled={view === 'opening'}
                className="luna-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-80"
              >
                {view === 'opening' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Abrindo...
                  </>
                ) : (
                  <>
                    <Gift className="size-4" />
                    Abrir presente
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Estado: Presente aberto (valor revelado) ─────────────────── */}
        {view === 'gift' && (
          <>
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-transparent px-5 pb-6 pt-8 text-center">
              <Confetti count={14} />
              <div className="relative mx-auto flex size-20 items-center justify-center">
                <span className="animate-gift-glow absolute inset-0 rounded-3xl bg-primary/40 blur-lg" aria-hidden="true" />
                <div className="relative flex size-20 items-center justify-center rounded-3xl bg-primary shadow-xl shadow-primary/40">
                  <Gift className="size-10 text-primary-foreground" />
                </div>
              </div>
              <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-widest text-primary">
                Presente recebido
              </p>
              <p className="animate-amount-reveal mt-1 text-5xl font-extrabold text-foreground">{brl(amount)}</p>
            </div>

            <div className="px-5 py-5">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3">
                {senderAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={senderAvatar || '/placeholder.svg'}
                    alt={senderName}
                    className="size-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {senderName.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{senderName}</p>
                  <p className="text-xs text-muted-foreground">enviou este presente para você</p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-positive/30 bg-positive/5 px-4 py-3">
                <Wallet className="mt-0.5 size-4 shrink-0 text-positive" />
                <p className="text-xs leading-relaxed text-foreground">
                  Ao resgatar, o valor de <span className="font-bold">{brl(amount)}</span> vira{' '}
                  <span className="font-semibold text-positive">saldo imediato</span> na sua conta,
                  pronto para sacar.
                </p>
              </div>

              <button
                onClick={handleClaim}
                disabled={claiming}
                className="luna-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
              >
                {claiming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Resgatando...
                  </>
                ) : (
                  <>
                    <Gift className="size-4" />
                    Resgatar meu presente
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* ── Estado: Conta sem habilitação ────────────────────────────── */}
        {view === 'locked' && (
          <>
            <div className="relative border-b border-border bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent px-5 py-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/90 shadow-lg shadow-amber-500/30">
                <Lock className="size-7 text-white" />
              </div>
              <h2 className="mt-3 text-lg font-bold text-foreground">Habilitação necessária</h2>
            </div>

            <div className="px-5 py-5">
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Sua conta ainda <span className="font-semibold text-foreground">não tem habilitação</span> para
                aceitar presentes. Você pode:
              </p>

              <div className="mt-4 flex flex-col gap-2.5">
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-background/50 px-4 py-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-foreground">
                    Aguardar <span className="font-semibold">30 dias</span> para aceitar e enviar presentes
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-sm text-foreground">
                    Fazer a <span className="font-semibold">habilitação de presentes agora mesmo</span> e
                    liberar na hora
                  </p>
                </div>
              </div>

              <button
                onClick={onActivate}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
              >
                <Sparkles className="size-4" />
                Ativar Presentes
              </button>
              <button
                onClick={handleClose}
                className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Agora não
              </button>
            </div>
          </>
        )}

        {/* ── Estado: Presente resgatado ───────────────────────────────── */}
        {view === 'claimed' && (
          <div className="relative overflow-hidden px-5 py-9 text-center">
            <Confetti count={18} />
            <div className="relative mx-auto flex size-16 items-center justify-center">
              <span className="animate-gift-glow absolute inset-0 rounded-full bg-positive/30 blur-lg" aria-hidden="true" />
              <div className="relative flex size-16 items-center justify-center rounded-full bg-positive/15">
                <PartyPopper className="size-8 text-positive" />
              </div>
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">Presente resgatado!</h2>
            <p className="animate-amount-reveal mt-1 text-3xl font-extrabold text-positive">{brl(amount)}</p>
            <p className="mx-auto mt-2 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
              foi adicionado ao seu saldo. Você já pode sacar quando quiser.
            </p>
            <button
              onClick={handleClose}
              className="luna-gradient mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              <BadgeCheck className="size-4" />
              Concluir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal: Habilitação de Presentes (R$ 38,60) — leva ao PIX
// ─────────────────────────────────────────────────────────────────────────────

interface GiftEnableModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  price: number
}

export function GiftEnableModal({ isOpen, onClose, onConfirm, price }: GiftEnableModalProps) {
  if (!isOpen) return null

  const reasons = [
    { icon: Bot, text: 'Bloquear bots e automações' },
    { icon: UserX, text: 'Impedir contas falsas e perfis fake' },
    { icon: ShieldCheck, text: 'Evitar fraudes e tentativas de burlar a plataforma' },
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="relative border-b border-border bg-gradient-to-br from-primary/25 via-primary/10 to-transparent px-5 py-6">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <Gift className="size-7 text-primary-foreground" />
            </div>
            <h2 className="mt-3 text-xl font-bold text-foreground">Habilitar Presentes</h2>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              Libere sua conta para receber e enviar presentes
            </p>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {/* Valor */}
          <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5">
            <div>
              <p className="text-xs text-muted-foreground">Valor simbólico único</p>
              <p className="text-2xl font-bold text-foreground">{brl(price)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-1 rounded-full bg-positive/15 px-2.5 py-1 text-xs font-semibold text-positive">
                <InfinityIcon className="size-3.5" />
                Pago uma vez
              </span>
              <span className="text-[0.65rem] text-muted-foreground">Ativo por 1 ano em todos os chats</span>
            </div>
          </div>

          {/* Por que cobramos */}
          <div className="mt-4 rounded-2xl border border-border bg-background/40 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Por que esse valor?
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Esse valor simbólico existe para proteger o Luna Privé e as criadoras. Ele nos ajuda a:
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {reasons.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-positive" />
                  <span className="text-sm text-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={onConfirm}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            <Sparkles className="size-4" />
            Gerar PIX · {brl(price)}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.7rem] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-positive" />
            Pagamento seguro via PIX
          </p>
        </div>
      </div>
    </div>
  )
}
