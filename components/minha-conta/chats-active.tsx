'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Wallet,
  BadgeCheck,
  Gift,
  Check,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react'
import { claimGift } from '@/app/minha-conta/actions'
import { PixModal } from '@/components/convite/pix-modal'
import { GiftReceivedModal, GiftEnableModal } from '@/components/minha-conta/gift-modals'

// Valor da habilitação de presentes (pagamento único)
const GIFT_UNLOCK_PRICE = 38.6

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// ─────────────────────────────────────────────────────────────────────────────
// Compradores simulados (iniciam a conversa com um elogio)
// ─────────────────────────────────────────────────────────────────────────────

type BuyerSeed = {
  id: string
  name: string
  avatar: string
  greeting: string
  online: boolean
  lastTime: string
}

const BUYERS: BuyerSeed[] = [
  {
    id: 'b1',
    name: 'Rafael Augusto',
    avatar: '/images/buyers/buyer-1.png',
    greeting: 'Boa noite, meu amor. Te achei linda demais aqui',
    online: true,
    lastTime: 'agora',
  },
  {
    id: 'b2',
    name: 'Bruno Carvalho',
    avatar: '/images/buyers/buyer-2.png',
    greeting: 'Oi meu anjo, tudo bem com você? Adorei seu perfil',
    online: true,
    lastTime: 'agora',
  },
  {
    id: 'b3',
    name: 'Lucas Ferreira',
    avatar: '/images/buyers/buyer-3.png',
    greeting: 'Olá bebê, você é simplesmente perfeita',
    online: false,
    lastTime: '2 min',
  },
  {
    id: 'b4',
    name: 'Diego Martins',
    avatar: '/images/buyers/buyer-4.png',
    greeting: 'Bom dia, gata. Não consegui parar de olhar seu perfil',
    online: true,
    lastTime: '5 min',
  },
]

// gera um valor de presente entre R$ 200 e R$ 600 (múltiplos de 10)
function randomGiftAmount() {
  const min = 20
  const max = 60
  const v = Math.floor(Math.random() * (max - min + 1)) + min
  return v * 10
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de mensagem
// ─────────────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string
  from: 'buyer' | 'creator'
  text?: string
  kind?: 'text' | 'gift'
  giftAmount?: number
  giftClaimed?: boolean
}

// passos do fluxo de cada conversa
// 0: saudação enviada, aguardando 1ª resposta da criadora
// 1: comprador perguntou sobre presente, aguardando 2ª resposta
// 2: comprador enviou o presente
// 3: encerrado
type FlowStep = 0 | 1 | 2 | 3

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

interface ChatsActiveProps {
  balance: number
  giftsEnabled: boolean
  userName: string
  userEmail: string
  onProfileRefresh: () => void
}

export function ChatsActive({
  balance,
  giftsEnabled,
  userName,
  userEmail,
  onProfileRefresh,
}: ChatsActiveProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  const activeBuyer = BUYERS.find((b) => b.id === openId) || null

  if (activeBuyer) {
    return (
      <ChatConversation
        buyer={activeBuyer}
        giftsEnabled={giftsEnabled}
        userName={userName}
        userEmail={userEmail}
        onBack={() => setOpenId(null)}
        onProfileRefresh={onProfileRefresh}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-9 w-auto" />
        <div className="luna-border relative flex items-center gap-2.5 rounded-2xl bg-card/80 px-4 py-2.5 backdrop-blur-sm">
          <Wallet className="size-6 text-primary" aria-hidden="true" />
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-xl font-bold text-foreground">{brl(balance)}</p>
          </div>
        </div>
      </header>

      {/* Título */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
          <MessageCircle className="size-6 text-primary-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Mensagens</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-positive/15 px-2 py-0.5 text-[0.65rem] font-semibold text-positive">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Ativo
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{BUYERS.length} conversas</p>
        </div>
      </div>

      {/* Lista de conversas */}
      <ul className="mt-6 flex flex-col gap-2">
        {BUYERS.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => setOpenId(b.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 text-left transition hover:border-primary/40 active:scale-[0.99]"
            >
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.avatar || '/placeholder.svg'} alt={b.name} className="size-12 rounded-full object-cover" />
                {b.online && (
                  <span className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-card bg-positive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{b.name}</p>
                  <span className="shrink-0 text-[0.65rem] text-muted-foreground">{b.lastTime}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{b.greeting}</p>
              </div>
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground">
                1
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tela de conversa individual (com fluxo automático)
// ─────────────────────────────────────────────────────────────────────────────

function ChatConversation({
  buyer,
  giftsEnabled,
  userName,
  userEmail,
  onBack,
  onProfileRefresh,
}: {
  buyer: BuyerSeed
  giftsEnabled: boolean
  userName: string
  userEmail: string
  onBack: () => void
  onProfileRefresh: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'm0', from: 'buyer', text: buyer.greeting, kind: 'text' },
  ])
  const [step, setStep] = useState<FlowStep>(0)
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')

  // Modais
  const [showGift, setShowGift] = useState(false)
  const [activeGiftAmount, setActiveGiftAmount] = useState(0)
  const [showEnable, setShowEnable] = useState(false)
  const [showPix, setShowPix] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typing, scrollToBottom])

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout)
    }
  }, [])

  function pushBuyerMessage(msg: ChatMessage, delay = 1600) {
    setTyping(true)
    const t = setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, msg])
    }, delay)
    timers.current.push(t)
  }

  function handleSend() {
    const text = input.trim()
    if (!text || step >= 3) return

    setMessages((prev) => [...prev, { id: `c-${Date.now()}`, from: 'creator', text, kind: 'text' }])
    setInput('')

    if (step === 0) {
      // comprador pergunta sobre o presente
      setStep(1)
      pushBuyerMessage(
        {
          id: `b-${Date.now()}`,
          from: 'buyer',
          text: 'Que delícia falar com você. Posso te enviar um presente? Seu perfil já pode aceitar?',
          kind: 'text',
        },
        1800,
      )
    } else if (step === 1) {
      // comprador envia o presente
      setStep(2)
      const amount = randomGiftAmount()
      pushBuyerMessage(
        {
          id: `g-${Date.now()}`,
          from: 'buyer',
          kind: 'gift',
          giftAmount: amount,
          giftClaimed: false,
        },
        2000,
      )
      const t = setTimeout(() => setStep(3), 2100)
      timers.current.push(t)
    }
  }

  function openGiftModal(amount: number) {
    setActiveGiftAmount(amount)
    setShowGift(true)
  }

  async function handleClaim(): Promise<boolean> {
    const res = await claimGift({ amount: activeGiftAmount, senderName: buyer.name, giftType: 'chat' })
    if (res?.success) {
      // marca o presente como resgatado na conversa
      setMessages((prev) =>
        prev.map((m) => (m.kind === 'gift' && m.giftAmount === activeGiftAmount ? { ...m, giftClaimed: true } : m)),
      )
      onProfileRefresh()
      return true
    }
    return false
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header da conversa */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card/95 px-3 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={buyer.avatar || '/placeholder.svg'} alt={buyer.name} className="size-10 rounded-full object-cover" />
          {buyer.online && (
            <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-positive" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{buyer.name}</p>
          <p className="text-xs text-positive">{typing ? 'digitando...' : buyer.online ? 'online' : 'visto recentemente'}</p>
        </div>
      </header>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-background px-4 py-4">
        <div className="mx-auto flex max-w-md flex-col gap-2.5">
          <p className="mx-auto mb-2 rounded-full bg-muted/60 px-3 py-1 text-center text-[0.65rem] text-muted-foreground">
            Converse com respeito. O Luna Privé protege você.
          </p>

          {messages.map((m) =>
            m.kind === 'gift' ? (
              <GiftBubble
                key={m.id}
                amount={m.giftAmount || 0}
                claimed={!!m.giftClaimed}
                onOpen={() => openGiftModal(m.giftAmount || 0)}
              />
            ) : (
              <MessageBubble key={m.id} from={m.from} text={m.text || ''} />
            ),
          )}

          {typing && <TypingBubble avatar={buyer.avatar} />}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
            placeholder={step >= 3 ? 'Conversa em andamento...' : 'Escreva uma mensagem...'}
            className="flex-1 rounded-full border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/60"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Enviar"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95 disabled:opacity-50"
          >
            <Send className="size-5" />
          </button>
        </div>
      </div>

      {/* Modal de presente recebido */}
      <GiftReceivedModal
        isOpen={showGift}
        onClose={() => setShowGift(false)}
        senderName={buyer.name}
        senderAvatar={buyer.avatar}
        amount={activeGiftAmount}
        giftsEnabled={giftsEnabled}
        onClaim={handleClaim}
        onActivate={() => {
          setShowGift(false)
          setShowEnable(true)
        }}
      />

      {/* Modal de habilitação */}
      <GiftEnableModal
        isOpen={showEnable}
        onClose={() => setShowEnable(false)}
        price={GIFT_UNLOCK_PRICE}
        onConfirm={() => {
          setShowEnable(false)
          setShowPix(true)
        }}
      />

      {/* PIX da habilitação */}
      {showPix && (
        <PixModal
          isOpen={showPix}
          onClose={() => setShowPix(false)}
          email={userEmail}
          amount={GIFT_UNLOCK_PRICE}
          userName={userName}
          type="gift_unlock"
          title="Habilitação de Presentes"
          subtitle="Pagamento único · Válido por 1 ano"
          onPaymentConfirmed={() => {
            onProfileRefresh()
            setShowPix(false)
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponentes de bolha
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({ from, text }: { from: 'buyer' | 'creator'; text: string }) {
  const isCreator = from === 'creator'
  return (
    <div className={`flex ${isCreator ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isCreator
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md border border-border bg-card text-foreground'
        }`}
      >
        <p className="text-pretty">{text}</p>
        {isCreator && (
          <span className="mt-1 flex items-center justify-end gap-0.5 text-[0.6rem] text-primary-foreground/70">
            <CheckCheck className="size-3" />
          </span>
        )}
      </div>
    </div>
  )
}

function TypingBubble({ avatar }: { avatar: string }) {
  return (
    <div className="flex items-end gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatar || '/placeholder.svg'} alt="" className="size-6 rounded-full object-cover" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  )
}

function GiftBubble({ amount, claimed, onOpen }: { amount: number; claimed: boolean; onOpen: () => void }) {
  return (
    <div className="flex justify-start">
      <div className="w-[85%] max-w-[300px] overflow-hidden rounded-2xl rounded-bl-md border border-primary/40 bg-gradient-to-br from-primary/15 to-card">
        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Gift className="size-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-primary">Presente enviado</p>
            <p className="text-2xl font-bold leading-none text-foreground">{brl(amount)}</p>
          </div>
        </div>
        <div className="px-4 pb-4 pt-3">
          {claimed ? (
            <div className="flex items-center justify-center gap-1.5 rounded-xl bg-positive/15 py-2.5 text-sm font-semibold text-positive">
              <Check className="size-4" />
              Presente resgatado
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow transition hover:brightness-110 active:scale-[0.98]"
            >
              <Gift className="size-4" />
              Resgatar meu presente
            </button>
          )}
          <p className="mt-2 flex items-center justify-center gap-1 text-[0.6rem] text-muted-foreground">
            <ShieldCheck className="size-3 text-positive" />
            Vira saldo imediato na sua conta
          </p>
        </div>
      </div>
    </div>
  )
}
