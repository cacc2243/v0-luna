'use client'

import { Lock, MessageCircleHeart, Sparkles, ShieldCheck, BadgeCheck, X, Wallet, Crown, Gift, MessagesSquare, HandCoins } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Modal 1: Pedido bloqueado — venda personalizada exige Chat Exclusivo
// ─────────────────────────────────────────────────────────────────────────────

interface PersonalizedSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onUnlock: () => void
  buyerName?: string | null
  packTitle?: string | null
  amount?: number
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
}: PersonalizedSaleModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-border bg-gradient-to-br from-primary/25 via-primary/10 to-transparent px-5 py-5">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 ring-1 ring-primary/30">
              <MessagesSquare className="size-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight text-foreground">Pedido de venda personalizado</h2>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Lock className="size-3.5" />
                Requer Chat Exclusivo ativo
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto px-5 py-5">
          {/* Card da venda */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-primary">
              Novo pedido recebido
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm leading-snug text-foreground">
                  {buyerName ? (
                    <>
                      <span className="font-bold">{buyerName}</span> quer comprar{' '}
                      {packTitle ? <span className="font-semibold">{packTitle}</span> : 'um pack seu'}
                    </>
                  ) : (
                    'Um cliente quer comprar um pack seu'
                  )}
                </p>
              </div>
              {typeof amount === 'number' && (
                <div className="shrink-0 text-right">
                  <p className="text-[0.65rem] text-muted-foreground">Valor</p>
                  <p className="text-lg font-bold leading-none text-foreground">{brl(amount)}</p>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
            Para <span className="font-semibold text-foreground">aceitar este pedido</span> e receber o
            valor no seu saldo, você precisa ter o{' '}
            <span className="font-semibold text-foreground">Chat Exclusivo</span> ativo. É por ele que
            você conversa, combina os detalhes e fecha cada venda com seus clientes.
          </p>

          {/* Destaque: presentes */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-positive/30 bg-positive/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-positive/15">
                <Gift className="size-5 text-positive" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  Receba até <span className="text-positive">R$ 10 mil</span> em presentes
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Com o chat ativo, compradores podem te enviar presentes exclusivos que viram saldo na
                  hora.
                </p>
              </div>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-2.5">
            {[
              { icon: MessagesSquare, text: 'Converse diretamente com seus compradores' },
              { icon: HandCoins, text: 'Aceite e receba por todas as suas vendas' },
              { icon: BadgeCheck, text: 'Atendimento personalizado que aumenta a conversão' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 size-4 shrink-0 text-positive" />
                <span className="text-sm text-foreground">{text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={onUnlock}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            <Sparkles className="size-4" />
            Liberar Chat Privé
          </button>
          <button
            onClick={onClose}
            className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Agora não
          </button>
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
}

export function UnlockChatModal({ isOpen, onClose, onConfirm, price }: UnlockChatModalProps) {
  if (!isOpen) return null

  const benefits = [
    {
      icon: MessageCircleHeart,
      title: 'Chat direto com clientes',
      desc: 'Converse em tempo real e feche vendas personalizadas.',
    },
    {
      icon: Wallet,
      title: 'Receba por suas vendas',
      desc: 'Aceite pedidos e veja o valor cair no seu saldo na hora.',
    },
    {
      icon: Crown,
      title: 'Perfil em destaque',
      desc: 'Criadoras com chat ativo aparecem como verificadas.',
    },
    {
      icon: ShieldCheck,
      title: 'Acesso vitalício',
      desc: 'Pagamento único. Sem mensalidade, sem renovação.',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative flex max-h-[95dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
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
              <MessageCircleHeart className="size-7 text-primary-foreground" />
            </div>
            <h2 className="mt-3 text-xl font-bold text-foreground">Chat Exclusivo Luna Privé</h2>
            <p className="mt-1 text-pretty text-sm text-muted-foreground">
              Desbloqueie as conversas e comece a vender de verdade
            </p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto px-5 py-5">
          <ul className="flex flex-col gap-3">
            {benefits.map((b) => {
              const Icon = b.icon
              return (
                <li key={b.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                    <Icon className="size-4 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{b.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{b.desc}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Preço */}
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5">
            <div>
              <p className="text-xs text-muted-foreground">Valor único</p>
              <p className="text-2xl font-bold text-foreground">{brl(price)}</p>
            </div>
            <span className="rounded-full bg-positive/15 px-2.5 py-1 text-xs font-semibold text-positive">
              Acesso vitalício
            </span>
          </div>

          <button
            onClick={onConfirm}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            <Sparkles className="size-4" />
            Liberar Chat Privé · {brl(price)}
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
