'use client'

import { useEffect, useRef, useState } from 'react'
import { Lock, MessageCircleHeart, ShieldCheck, X, MessagesSquare, Zap, Flame, Eye, DollarSign, Star, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Modal 1: Nova Venda! — pedido recebido (aceitar exige Chat Exclusivo)
// ─────────────────────────────────────────────────────────────────────────────

interface PersonalizedSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onUnlock: () => void
  buyerName?: string | null
  packTitle?: string | null
  amount?: number
  /** Valor que o comprador está disposto a pagar pelo pedido exclusivo. */
  maxAmount?: number
}

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function PersonalizedSaleModal({
  isOpen,
  onClose,
  onUnlock,
  buyerName,
  packTitle,
  amount,
  maxAmount = 2000,
}: PersonalizedSaleModalProps) {
  if (!isOpen) return null

  const handle = buyerName?.trim() || 'Um comprador'
  const displayHandle = buyerName?.trim()
    ? buyerName.startsWith('@')
      ? buyerName
      : `@${buyerName}`
    : 'Um comprador'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {/* Conteúdo */}
        <div className="overflow-y-auto px-5 pb-5 pt-7">
          {/* Ícone + título */}
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-positive/15 ring-1 ring-positive/30">
              <DollarSign className="size-8 text-positive" />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-foreground">Nova Venda! 🎉</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{displayHandle}</span> comprou seu pack
            </p>
          </div>

          {/* Card de detalhes da venda */}
          <div className="mt-5 rounded-2xl border border-positive/25 bg-positive/5 p-4">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Pack</dt>
                <dd className="truncate font-semibold text-foreground">{packTitle || 'Pack exclusivo'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Valor</dt>
                <dd className="font-bold text-positive">{typeof amount === 'number' ? brl(amount) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Comprador</dt>
                <dd className="truncate font-semibold text-foreground">{displayHandle}</dd>
              </div>
            </dl>
          </div>

          {/* Pedido personalizado */}
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MessageSquare className="size-4 text-primary" />
              Pedido personalizado
            </p>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              O comprador deseja um <span className="font-semibold text-primary">pack exclusivo de pé</span> e
              quer conversar por chat. Está disposto a pagar até{' '}
              <span className="font-semibold text-positive">{brl(maxAmount)}</span> para conversar com você.
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="size-3.5 text-primary" />
              Pedido exclusivo disponível
            </p>
          </div>

          {/* Ações */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={onClose}
              className="shrink-0 rounded-xl border border-border px-5 py-3.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Recusar
            </button>
            <button
              onClick={onUnlock}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
            >
              <ShieldCheck className="size-4" />
              Aceitar pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal 1.5: Chat não desbloqueado — aviso antes de oferecer a ativação do chat
// ─────────────────────────────────────────────────────────────────────────────

interface ChatLockedModalProps {
  isOpen: boolean
  onClose: () => void
  onUnlock: () => void
  /** Valor da ativação do chat exibido no botão. */
  price: number
  /** Valor que o comprador está disposto a pagar. Padrão R$ 2.000. */
  maxAmount?: number
}

export function ChatLockedModal({
  isOpen,
  onClose,
  onUnlock,
  price,
  maxAmount = 2000,
}: ChatLockedModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="overflow-y-auto px-5 pb-5 pt-7">
          {/* Ícone + título */}
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
              <Lock className="size-8 text-primary" />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-foreground">Chat não desbloqueado</h2>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              Para aceitar pedidos personalizados e conversar com os compradores, você precisa
              desbloquear o chat.
            </p>
          </div>

          {/* Destaque do valor que o comprador paga */}
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-positive/25 bg-positive/5 p-4">
            <DollarSign className="mt-0.5 size-4 shrink-0 text-positive" />
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              O comprador está disposto a pagar até{' '}
              <span className="font-semibold text-positive">{brl(maxAmount)}</span> para conversar.
              Desbloqueie o chat para não perder essa oportunidade!
            </p>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border/60 bg-background/40 p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              Você <span className="font-semibold text-foreground">não é obrigada a falar com
              ninguém</span> se não quiser. Mas para aceitar packs com chat, o chat precisa estar
              ativo. A escolha de conversar é sempre sua.
            </p>
          </div>

          <button
            onClick={onUnlock}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            <Lock className="size-4" />
            Desbloquear Chat · {brl(price)}
          </button>
          <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">
            Pagamento único · Acesso permanente
          </p>
          <p className="mt-1.5 text-center text-[0.7rem] font-medium text-positive">
            Garantia de 7 dias · reembolso total se não gostar
          </p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal 2: Detalhes do Chat Exclusivo — leva ao pagamento
// ─────────────────────────────────────────────────────────────────────────────

interface UnlockChatModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  price: number
  /** Preço "cheio" exibido riscado. Padrão R$ 697. */
  fullPrice?: number
  /** Quanto cada fã paga para conversar. Padrão R$ 299. */
  perFanPrice?: number
}

export function UnlockChatModal({
  isOpen,
  onClose,
  onConfirm,
  price,
  fullPrice = 697,
  perFanPrice = 299,
}: UnlockChatModalProps) {
  if (!isOpen) return null

  const discountPct =
    fullPrice > price ? Math.round((1 - price / fullPrice) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {/* Conteúdo */}
        <div className="overflow-y-auto px-5 pb-5 pt-7">
          {/* Ícone + título */}
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30">
              <MessageCircleHeart className="size-8 text-primary" />
            </div>
            <h2 className="mt-3 text-2xl font-bold text-foreground">Desbloquear Chat</h2>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              Receba mensagens pagas dos seus fans
            </p>
          </div>

          {/* Card de preço */}
          <div className="mt-5 rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 to-transparent p-5 text-center">
            <p className="text-xs text-muted-foreground">Ativação do Chat</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              {discountPct > 0 && (
                <span className="text-lg font-medium text-muted-foreground line-through">
                  {brl(fullPrice)}
                </span>
              )}
              <span className="text-3xl font-bold text-primary">{brl(price)}</span>
            </div>
            {discountPct > 0 && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-positive/15 px-2.5 py-1 text-xs font-semibold text-positive">
                <Zap className="size-3.5" />
                {discountPct}% OFF
              </span>
            )}
          </div>

          {/* Aviso promocional */}
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              Valor promocional <span className="font-semibold text-primary">válido apenas para novos
              usuários no primeiro dia</span> de criação da conta. Após isso, o valor volta para{' '}
              {brl(fullPrice)}.
            </p>
          </div>

          {/* Quanto cada fã paga */}
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-positive/25 bg-positive/5 p-4">
            <DollarSign className="mt-0.5 size-4 shrink-0 text-positive" />
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              Cada fan paga <span className="font-semibold text-positive">{brl(perFanPrice)} para
              conversar</span> · Valor direto no seu saldo
            </p>
          </div>

          {/* Você não precisa falar com ninguém */}
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-border/60 bg-background/40 p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              Você <span className="font-semibold text-foreground">não é obrigada a falar com
              ninguém</span> se não quiser. O chat ativo é apenas o que permite aceitar packs com
              conversa — você decide com quem e se quer falar.
            </p>
          </div>

          <button
            onClick={onConfirm}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            <Lock className="size-4" />
            Desbloquear por {brl(price)}
          </button>
          <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">
            Pagamento único · Acesso permanente
          </p>
          <p className="mt-1.5 text-center text-[0.7rem] font-medium text-positive">
            Garantia de 7 dias · reembolso total se não gostar
          </p>
        </div>
      </div>
    </div>
  )
}

// ──────────────────��──────────────────────────────────────────────────────────
// Modal 3: Conta bombando — pedidos aguardando (leva à aba de Chats)
// ��───────────────────────────��────────────────────────────────────────────────

interface FansWaitingModalProps {
  isOpen: boolean
  onClose: () => void
  onRespond: () => void
  chatCount: number
  totalViews: number
  pendingAmount: number
  /** Se o chat já foi desbloqueado. Muda o texto e a CTA do modal. */
  chatUnlocked?: boolean
}

export function FansWaitingModal({
  isOpen,
  onClose,
  onRespond,
  chatCount,
  totalViews,
  pendingAmount,
  chatUnlocked = false,
}: FansWaitingModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/8 to-transparent px-5 pb-3 pt-5 text-center">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>

          <h2 className="flex items-center justify-center gap-2 pr-8 text-lg font-bold text-foreground">
            Seus pedidos estão bombando!
            <Flame className="size-4 shrink-0 text-primary" />
          </h2>
          <p className="mt-1 text-sm font-medium text-primary">
            {chatUnlocked
              ? `${chatCount} ${chatCount === 1 ? 'pedido aguarda' : 'pedidos aguardam'} sua resposta agora`
              : `Você tem ${brl(pendingAmount)} em pedidos pendentes`}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto px-5 pb-5 pt-1">
          {/* Métricas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-center">
              <p className="flex items-center justify-center gap-1 text-xl font-bold text-primary">
                <Eye className="size-4" />
                {totalViews.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground">visualizações</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-center">
              <p className="text-xl font-bold text-positive">{brl(pendingAmount)}</p>
              <p className="text-xs text-muted-foreground">em pedidos pendentes</p>
            </div>
          </div>

          {/* Destaque */}
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <MessageCircleHeart className="mt-0.5 size-5 shrink-0 text-primary" />
              <div className="min-w-0">
                {chatUnlocked ? (
                  <>
                    <p className="text-sm leading-relaxed text-foreground">
                      Seus pedidos estão{' '}
                      <span className="font-semibold text-primary">esperando uma resposta</span>. Quanto
                      antes você responder, mais vendas você fecha.
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Conversas ativas convertem em{' '}
                      <span className="font-semibold text-foreground">média 3x mais</span> presentes e
                      pedidos.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-foreground">
                      Você tem{' '}
                      <span className="font-semibold text-positive">{brl(pendingAmount)}</span> em
                      pedidos pendentes aguardando você{' '}
                      <span className="font-semibold text-primary">liberar o chat</span>.
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Libere o chat para receber esses pedidos e{' '}
                      <span className="font-semibold text-foreground">liberar seu saldo</span>.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {!chatUnlocked && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border/60 bg-background/40 p-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
                Você <span className="font-semibold text-foreground">não é obrigada a falar com
                ninguém</span> se não quiser. Liberar o chat só permite aceitar packs com conversa —
                você continua no controle de com quem fala.
              </p>
            </div>
          )}

          <button
            onClick={onRespond}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98]"
          >
            {chatUnlocked ? (
              <>
                <MessagesSquare className="size-5" />
                Ver pedidos
              </>
            ) : (
              <>
                <Lock className="size-5" />
                Liberar chat e receber pedidos
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Agora não
          </button>
          {!chatUnlocked && (
            <p className="mt-2 text-center text-[0.7rem] font-medium text-positive">
              Garantia de 7 dias · reembolso total se não gostar
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal 4: Gerando seu PIX... — tela de transição com spinner + barra de progresso
// ───────────────────────��─────────────────────────────────────────────────────

interface GeneratingPixModalProps {
  isOpen: boolean
  /** Disparado quando a barra de progresso completa. */
  onDone: () => void
  /** Duração da animação em ms. Padrão 2200ms. */
  duration?: number
  /**
   * Quando o PIX já está 100% pronto para ser exibido. Enquanto false, a barra
   * segura em ~92% e a animação permanece na tela (sem lacunas). Se não
   * informado (undefined), mantém o comportamento legado (completa por tempo).
   */
  ready?: boolean
}

export function GeneratingPixModal({ isOpen, onDone, duration = 2200, ready }: GeneratingPixModalProps) {
  const [progress, setProgress] = useState(0)

  // No modo legado (ready === undefined) trata como "sempre pronto".
  const isReady = ready === undefined ? true : ready
  const isReadyRef = useRef(isReady)
  isReadyRef.current = isReady

  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      return
    }

    // Anima a barra até no máximo 92% enquanto o PIX não estiver pronto; quando
    // pronto, completa até 100% e dispara onDone.
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const rawPct = ((now - start) / duration) * 100
      const cap = isReadyRef.current ? 100 : 92
      const pct = Math.min(cap, rawPct)
      setProgress(pct)
      if (isReadyRef.current && pct >= 100) {
        onDone()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isOpen, duration, onDone])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm p-6">
      <div className="flex w-full max-w-[260px] flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
        <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-5 text-base font-semibold text-foreground">Gerando seu PIX...</p>
        <div
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Progresso da geração do PIX"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
