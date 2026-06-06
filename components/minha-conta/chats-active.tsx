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
  Sparkles,
  Lock,
  Search,
  User,
} from 'lucide-react'
import { claimGift } from '@/app/minha-conta/actions'
import { PixModal } from '@/components/convite/pix-modal'
import { GiftReceivedModal, GiftEnableModal } from '@/components/minha-conta/gift-modals'

// Valor da habilitação de presentes (pagamento único)
const GIFT_UNLOCK_PRICE = 38.6

function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function nowTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─────────────────────────────────────────────────────────────────────────────
// Compradores simulados (iniciam a conversa com um elogio)
// ─────────────────────────────────────────────────────────────────────────────

type BuyerSeed = {
  id: string
  name: string
  greeting: string
  online: boolean
  lastTime: string
}

const BUYERS: BuyerSeed[] = [
  { id: 'b1', name: 'Rafael Augusto', greeting: 'Boa noite, meu amor. Te achei linda demais aqui', online: true, lastTime: 'agora' },
  { id: 'b2', name: 'Bruno Carvalho', greeting: 'Oi meu anjo, tudo bem com você? Adorei seu perfil', online: true, lastTime: 'agora' },
  { id: 'b3', name: 'Lucas Ferreira', greeting: 'Olá bebê, você é simplesmente perfeita', online: false, lastTime: '2 min' },
  { id: 'b4', name: 'Diego Martins', greeting: 'Bom dia, gata. Não consegui parar de olhar seu perfil', online: true, lastTime: '5 min' },
  { id: 'b5', name: 'Felipe Andrade', greeting: 'Oi linda, fiquei encantado com você agora mesmo', online: true, lastTime: 'agora' },
  { id: 'b6', name: 'Gustavo Lima', greeting: 'Que mulher maravilhosa, preciso te conhecer melhor', online: true, lastTime: 'agora' },
  { id: 'b7', name: 'Thiago Souza', greeting: 'Boa tarde, gata. Seu sorriso me ganhou na hora', online: false, lastTime: '8 min' },
  { id: 'b8', name: 'Marcelo Rocha', greeting: 'Oi amor, você é a coisa mais linda que vi hoje', online: true, lastTime: 'agora' },
  { id: 'b9', name: 'André Nogueira', greeting: 'Olá meu bem, fiquei impressionado com você', online: true, lastTime: 'agora' },
  { id: 'b10', name: 'Vinícius Costa', greeting: 'Oi gata, posso te conhecer melhor? Adorei tudo aqui', online: true, lastTime: 'agora' },
  { id: 'b11', name: 'Eduardo Pires', greeting: 'Boa noite, princesa. Você me deixou sem palavras', online: false, lastTime: '12 min' },
  { id: 'b12', name: 'Henrique Alves', greeting: 'Oi linda, seu perfil é o melhor que já vi', online: true, lastTime: 'agora' },
  { id: 'b13', name: 'Rodrigo Mendes', greeting: 'Olá amor, você é simplesmente deslumbrante', online: true, lastTime: 'agora' },
  { id: 'b14', name: 'Caio Barbosa', greeting: 'Oi gata, fiquei completamente encantado com você', online: true, lastTime: 'agora' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Variações de mensagens do comprador
// ─────────────────────────────────────────────────────────────────────────────

// 1ª mensagem do comprador após a resposta dela: pergunta sobre enviar presente
const ASK_GIFT_MESSAGES = [
  'Que delícia conversar com você. Posso te mandar um presente? Seu perfil já tá aceitando?',
  'Adorei te conhecer, gata. Queria te dar um mimo... sua conta já aceita presente?',
  'Você é maravilhosa mesmo. Posso te enviar um presente em dinheiro? Já consegue receber?',
  'Tô encantado com você. Deixa eu te mandar um agrado, seu perfil já libera presente?',
]

// 2ª mensagem do comprador: anuncia que está enviando o presente (com variações)
const SEND_GIFT_MESSAGES = [
  'Pronto, acabei de te mandar um presente. Espero que goste, linda!',
  'Te enviei um mimo agora mesmo, meu amor. É só pra te ver feliz.',
  'Olha só, deixei uma surpresa pra você aqui. Aproveita, você merece!',
  'Mandei um presentinho pra você. Pega que é todo seu, gata.',
  'Te mandei um agrado especial. Espero te ver sorrindo com ele!',
]

// Mensagem quando ela tenta resgatar mas a conta não tem presentes ativos
const LOCKED_MESSAGES = [
  'Poxa, mandei o presente mas acho que não chegou pra você... sua conta ainda não tem presentes ativos. Se você ativar, a gente continua conversando?',
  'Te enviei aqui, mas parece que você não recebeu porque seu perfil não tem presentes ativados. Consegue ativar? Aí seguimos a conversa.',
  'Mandei sim, só que acho que não caiu aí porque sua conta não aceita presentes ainda. Se conseguir ativar me avisa que continuamos!',
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
  time?: string
}

// passos do fluxo de cada conversa
// 0: saudação enviada, aguardando 1ª resposta da criadora
// 1: comprador perguntou sobre presente, aguardando 2ª resposta
// 2: comprador enviou o presente
// 3: encerrado
type FlowStep = 0 | 1 | 2 | 3

// ─────────────────────────────────────────────────────────────────────────────
// Avatar genérico (ícone, sem foto do usuário)
// ─────────────────────────────────────────────────────────────────────────────

function BuyerAvatar({
  online,
  size = 'md',
}: {
  online?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const box = size === 'lg' ? 'size-[3.25rem]' : size === 'md' ? 'size-10' : 'size-7'
  const icon = size === 'lg' ? 'size-6' : size === 'md' ? 'size-5' : 'size-4'
  const dot = size === 'lg' ? 'size-3.5' : 'size-3'
  return (
    <div className="relative shrink-0">
      <div
        className={`flex ${box} items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-accent/15 ring-2 ring-primary/20`}
      >
        <User className={`${icon} text-primary`} aria-hidden="true" />
      </div>
      {online && (
        <span className={`absolute bottom-0 right-0 ${dot} rounded-full border-2 border-card bg-positive`} />
      )}
    </div>
  )
}

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
  const [query, setQuery] = useState('')

  // Lista que cresce com o tempo (novas conversas chegando sempre)
  const [shown, setShown] = useState<BuyerSeed[]>(() => BUYERS.slice(0, 4))
  const nextIndex = useRef(4)

  useEffect(() => {
    const interval = setInterval(() => {
      setShown((prev) => {
        const idx = nextIndex.current
        const base = BUYERS[idx % BUYERS.length]
        nextIndex.current = idx + 1
        const incoming: BuyerSeed = {
          ...base,
          id: idx < BUYERS.length ? base.id : `${base.id}-${idx}`,
          lastTime: 'agora',
          online: true,
        }
        // novas conversas entram no topo; mantém no máximo 30
        return [incoming, ...prev].slice(0, 30)
      })
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  const activeBuyer = shown.find((b) => b.id === openId) || null

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

  const filtered = shown.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()))
  const onlineCount = shown.filter((b) => b.online).length

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
          <p className="text-sm text-muted-foreground">
            {shown.length} conversas · <span className="text-positive">{onlineCount} online agora</span>
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar conversa..."
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Dica de ganhos */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-pretty text-xs leading-relaxed text-foreground">
          Responda com carinho. Clientes que se sentem especiais costumam{' '}
          <span className="font-semibold text-primary">enviar presentes em dinheiro</span> direto pelo chat.
        </p>
      </div>

      {/* Lista de conversas */}
      <ul className="mt-5 flex flex-col gap-2.5">
        {filtered.map((b) => (
          <li key={b.id} className="animate-item">
            <button
              type="button"
              onClick={() => setOpenId(b.id)}
              className="luna-border-soft flex w-full items-center gap-3 rounded-2xl bg-card px-3.5 py-3.5 text-left transition hover:bg-card/70 active:scale-[0.99]"
            >
              <BuyerAvatar online={b.online} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
                    {b.name}
                    <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  </p>
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
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma conversa encontrada.
          </li>
        )}
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
    { id: 'm0', from: 'buyer', text: buyer.greeting, kind: 'text', time: nowTime() },
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
  const lockedMsgSent = useRef(false)

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
      setMessages((prev) => [...prev, { ...msg, time: nowTime() }])
    }, delay)
    timers.current.push(t)
  }

  function handleSend() {
    const text = input.trim()
    if (!text || step >= 3) return

    setMessages((prev) => [...prev, { id: `c-${Date.now()}`, from: 'creator', text, kind: 'text', time: nowTime() }])
    setInput('')

    if (step === 0) {
      // comprador pergunta sobre o presente
      setStep(1)
      pushBuyerMessage(
        {
          id: `b-${Date.now()}`,
          from: 'buyer',
          text: pick(ASK_GIFT_MESSAGES),
          kind: 'text',
        },
        1800,
      )
    } else if (step === 1) {
      // comprador anuncia e envia o presente
      setStep(2)
      const amount = randomGiftAmount()
      pushBuyerMessage(
        {
          id: `g-${Date.now()}`,
          from: 'buyer',
          text: pick(SEND_GIFT_MESSAGES),
          kind: 'text',
        },
        1500,
      )
      pushBuyerMessage(
        {
          id: `gift-${Date.now()}`,
          from: 'buyer',
          kind: 'gift',
          giftAmount: amount,
          giftClaimed: false,
        },
        3200,
      )
      const t = setTimeout(() => setStep(3), 3300)
      timers.current.push(t)
    }
  }

  function openGiftModal(amount: number) {
    setActiveGiftAmount(amount)
    setShowGift(true)
  }

  // Disparada quando ela tenta resgatar sem ter presentes ativos
  function handleLockedAttempt() {
    if (lockedMsgSent.current) return
    lockedMsgSent.current = true
    pushBuyerMessage(
      {
        id: `lock-${Date.now()}`,
        from: 'buyer',
        text: pick(LOCKED_MESSAGES),
        kind: 'text',
      },
      1400,
    )
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
        <BuyerAvatar online={buyer.online} size="md" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
            {buyer.name}
            <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          </p>
          <p className="text-xs text-positive">
            {typing ? 'digitando...' : buyer.online ? 'online' : 'visto recentemente'}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-positive/10 px-2.5 py-1 text-[0.6rem] font-semibold text-positive">
          <ShieldCheck className="size-3" />
          Protegido
        </span>
      </header>

      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-background px-4 py-4">
        <div className="mx-auto flex max-w-md flex-col gap-2.5">
          <p className="mx-auto mb-2 flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-center text-[0.65rem] text-muted-foreground">
            <Lock className="size-3" />
            Conversa protegida pelo Luna Privé
          </p>

          {messages.map((m) =>
            m.kind === 'gift' ? (
              <GiftBubble
                key={m.id}
                amount={m.giftAmount || 0}
                claimed={!!m.giftClaimed}
                senderName={buyer.name}
                onOpen={() => openGiftModal(m.giftAmount || 0)}
              />
            ) : (
              <MessageBubble key={m.id} from={m.from} text={m.text || ''} time={m.time} />
            ),
          )}

          {typing && <TypingBubble />}
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
        senderAvatar={null}
        amount={activeGiftAmount}
        giftsEnabled={giftsEnabled}
        onClaim={handleClaim}
        onLockedAttempt={handleLockedAttempt}
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

function MessageBubble({ from, text, time }: { from: 'buyer' | 'creator'; text: string; time?: string }) {
  const isCreator = from === 'creator'
  return (
    <div className={`flex animate-speech-enter ${isCreator ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isCreator
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md border border-border bg-card text-foreground'
        }`}
      >
        <p className="text-pretty">{text}</p>
        <span
          className={`mt-1 flex items-center justify-end gap-0.5 text-[0.6rem] ${
            isCreator ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {time}
          {isCreator && <CheckCheck className="size-3" />}
        </span>
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex animate-speech-enter items-end gap-2">
      <BuyerAvatar size="sm" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  )
}

// Card de presente RECEBIDO — exclusivo, com brilho, confete e botão de resgate
function GiftBubble({
  amount,
  claimed,
  senderName,
  onOpen,
}: {
  amount: number
  claimed: boolean
  senderName: string
  onOpen: () => void
}) {
  // posições/atrasos fixos para as partículas de confete (não recalcular a cada render)
  const confetti = [
    { left: '12%', delay: '0s', color: 'bg-primary' },
    { left: '28%', delay: '0.15s', color: 'bg-positive' },
    { left: '46%', delay: '0.05s', color: 'bg-accent' },
    { left: '64%', delay: '0.22s', color: 'bg-primary' },
    { left: '82%', delay: '0.1s', color: 'bg-positive' },
  ]

  return (
    <div className="flex animate-speech-enter justify-start">
      <div className="relative w-[88%] max-w-[320px] overflow-hidden rounded-3xl rounded-bl-md p-[1.5px]">
        {/* moldura em gradiente */}
        <div className="luna-gradient absolute inset-0 rounded-3xl rounded-bl-md opacity-90" aria-hidden="true" />

        <div className="animate-gift-shimmer relative overflow-hidden rounded-[1.4rem] rounded-bl-md bg-gradient-to-br from-card via-card to-primary/10">
          {/* confete decorativo no topo (apenas quando ainda não resgatado) */}
          {!claimed && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 overflow-hidden" aria-hidden="true">
              {confetti.map((c, i) => (
                <span
                  key={i}
                  className={`animate-confetti absolute top-0 size-1.5 rounded-[2px] ${c.color}`}
                  style={{ left: c.left, animationDelay: c.delay }}
                />
              ))}
            </div>
          )}

          {/* cabeçalho com ícone */}
          <div className="relative flex items-center gap-3 px-4 pt-4">
            <div className="relative shrink-0">
              <span className="animate-gift-glow absolute -inset-1.5 rounded-2xl bg-primary/40 blur-md" aria-hidden="true" />
              <div className="relative flex size-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/40">
                <Gift className="animate-gift-wiggle size-6 text-primary-foreground" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-primary">
                <Sparkles className="size-3" />
                Presente recebido
              </p>
              <p className="animate-amount-reveal text-[1.7rem] font-extrabold leading-none text-foreground">
                {brl(amount)}
              </p>
            </div>
          </div>

          {/* remetente */}
          <p className="relative mt-2.5 px-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{senderName}</span> enviou um presente para você
          </p>

          {/* ação */}
          <div className="relative px-4 pb-4 pt-3">
            {claimed ? (
              <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-positive/15 py-2.5 text-sm font-bold text-positive">
                <Check className="size-4" />
                Presente resgatado
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpen}
                className="luna-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:brightness-110 active:scale-[0.98]"
              >
                <Gift className="size-4" />
                Abrir e resgatar
              </button>
            )}
            <p className="mt-2 flex items-center justify-center gap-1 text-[0.6rem] text-muted-foreground">
              <ShieldCheck className="size-3 text-positive" />
              Vira saldo imediato na sua conta
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
