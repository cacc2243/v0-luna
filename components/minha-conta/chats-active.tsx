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
  Smile,
  ImageIcon,
  Mic,
  X,
  Plus,
  Play,
  Pause,
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
  kind?: 'text' | 'gift' | 'image' | 'audio'
  giftAmount?: number
  giftClaimed?: boolean
  /** URL (object URL) para imagem ou áudio enviado pela criadora */
  mediaUrl?: string
  /** duração do áudio em segundos */
  audioDuration?: number
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
  // conversas que já foram abertas (some o badge de não lida)
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set())

  function openConversation(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setOpenId(id)
  }

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
        {filtered.map((b) => {
          const isRead = readIds.has(b.id)
          return (
            <li key={b.id} className="animate-item">
              <button
                type="button"
                onClick={() => openConversation(b.id)}
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
                  <p
                    className={`mt-0.5 truncate text-xs ${
                      isRead ? 'text-muted-foreground' : 'font-medium text-foreground'
                    }`}
                  >
                    {b.greeting}
                  </p>
                </div>
                {!isRead && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground">
                    1
                  </span>
                )}
              </button>
            </li>
          )
        })}
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

  // Recursos do compositor: emojis, anexos, presente e áudio
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [showGiftComposer, setShowGiftComposer] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordChunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      if (recordTimerRef.current) clearInterval(recordTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  function pushBuyerMessage(msg: ChatMessage, delay = 2800) {
    setTyping(true)
    const t = setTimeout(() => {
      setTyping(false)
      setMessages((prev) => [...prev, { ...msg, time: nowTime() }])
    }, delay)
    timers.current.push(t)
  }

  // Avança o fluxo do comprador após qualquer mensagem enviada pela criadora
  function advanceFlow() {
    if (step === 0) {
      setStep(1)
      pushBuyerMessage(
        { id: `b-${Date.now()}`, from: 'buyer', text: pick(ASK_GIFT_MESSAGES), kind: 'text' },
        3000,
      )
    } else if (step === 1) {
      setStep(2)
      const amount = randomGiftAmount()
      pushBuyerMessage(
        { id: `g-${Date.now()}`, from: 'buyer', text: pick(SEND_GIFT_MESSAGES), kind: 'text' },
        2800,
      )
      pushBuyerMessage(
        { id: `gift-${Date.now()}`, from: 'buyer', kind: 'gift', giftAmount: amount, giftClaimed: false },
        5400,
      )
      const t = setTimeout(() => setStep(3), 5500)
      timers.current.push(t)
    }
  }

  // Envia uma mensagem da criadora (texto, imagem ou áudio) e avança o fluxo
  function pushCreatorMessage(msg: Omit<ChatMessage, 'from' | 'time'>) {
    setMessages((prev) => [...prev, { ...msg, from: 'creator', time: nowTime() }])
    advanceFlow()
  }

  function handleSend() {
    const text = input.trim()
    if (!text || step >= 3) return
    setInput('')
    setShowEmoji(false)
    pushCreatorMessage({ id: `c-${Date.now()}`, text, kind: 'text' })
  }

  function handleEmoji(emoji: string) {
    setInput((prev) => prev + emoji)
  }

  function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    setShowAttach(false)
    if (!file || step >= 3) return
    const url = URL.createObjectURL(file)
    pushCreatorMessage({ id: `img-${Date.now()}`, kind: 'image', mediaUrl: url })
  }

  async function startRecording() {
    if (step >= 3) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recordChunksRef.current = []
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) recordChunksRef.current.push(ev.data)
      }
      recorder.onstop = () => {
        const duration = recordSeconds
        const blob = new Blob(recordChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        stream.getTracks().forEach((t) => t.stop())
        if (recordChunksRef.current.length > 0) {
          pushCreatorMessage({ id: `aud-${Date.now()}`, kind: 'audio', mediaUrl: url, audioDuration: duration })
        }
        setRecordSeconds(0)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setRecordSeconds(0)
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } catch {
      // permissão negada ou indisponível — ignora silenciosamente
      setRecording(false)
    }
  }

  function stopRecording(send: boolean) {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current)
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      if (!send) recordChunksRef.current = [] // descarta
      recorder.stop()
    }
    setRecording(false)
  }

  // Envia um presente em dinheiro para o comprador
  function handleSendGift(amount: number) {
    setShowGiftComposer(false)
    if (step >= 3) return
    pushCreatorMessage({ id: `cgift-${Date.now()}`, kind: 'text', text: `Te enviei um presente de ${brl(amount)} 🎁` })
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
            ) : m.kind === 'image' ? (
              <ImageBubble key={m.id} from={m.from} url={m.mediaUrl || ''} time={m.time} />
            ) : m.kind === 'audio' ? (
              <AudioBubble key={m.id} from={m.from} url={m.mediaUrl || ''} duration={m.audioDuration || 0} time={m.time} />
            ) : (
              <MessageBubble key={m.id} from={m.from} text={m.text || ''} time={m.time} />
            ),
          )}

          {typing && <TypingBubble />}
        </div>
      </div>

      {/* Input + recursos */}
      <div className="relative shrink-0 border-t border-border bg-card/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        {/* Seletor de emojis */}
        {showEmoji && (
          <EmojiPicker onPick={handleEmoji} onClose={() => setShowEmoji(false)} />
        )}

        {/* Menu de anexos */}
        {showAttach && (
          <div className="absolute bottom-full left-3 mb-2 flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 rounded-xl px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <ImageIcon className="size-5" />
              </span>
              Imagem
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAttach(false)
                setShowGiftComposer(true)
              }}
              className="flex flex-col items-center gap-1 rounded-xl px-4 py-2.5 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Gift className="size-5" />
              </span>
              Presente
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />

        {recording ? (
          // Barra de gravação de áudio
          <div className="flex items-center gap-3 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <span className="size-2.5 animate-pulse rounded-full bg-destructive" />
              {formatDuration(recordSeconds)}
            </span>
            <span className="flex-1 text-xs text-muted-foreground">Gravando áudio...</span>
            <button
              type="button"
              onClick={() => stopRecording(false)}
              aria-label="Cancelar gravação"
              className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => stopRecording(true)}
              aria-label="Enviar áudio"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95"
            >
              <Send className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowAttach((v) => !v)
                setShowEmoji(false)
              }}
              aria-label="Anexar"
              disabled={step >= 3}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <Plus className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEmoji((v) => !v)
                setShowAttach(false)
              }}
              aria-label="Emojis"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Smile className="size-5" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => {
                setShowEmoji(false)
                setShowAttach(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
              placeholder={step >= 3 ? 'Conversa em andamento...' : 'Escreva uma mensagem...'}
              className="min-w-0 flex-1 rounded-full border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/60"
            />
            {input.trim() ? (
              <button
                type="button"
                onClick={handleSend}
                aria-label="Enviar"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95"
              >
                <Send className="size-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                aria-label="Gravar áudio"
                disabled={step >= 3}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-95 disabled:opacity-50"
              >
                <Mic className="size-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Compositor de presente (criadora envia dinheiro) */}
      {showGiftComposer && (
        <GiftComposerModal
          onClose={() => setShowGiftComposer(false)}
          onSend={handleSendGift}
        />
      )}

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
// ────────────────────────────────────────────��────────────────────────────────

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
  return (
    <div className="flex animate-speech-enter justify-start">
      <div className="relative w-[88%] max-w-[320px] overflow-hidden rounded-3xl rounded-bl-md p-[1.5px]">
        {/* moldura em gradiente */}
        <div className="luna-gradient absolute inset-0 rounded-3xl rounded-bl-md opacity-90" aria-hidden="true" />

        <div className="relative overflow-hidden rounded-[1.4rem] rounded-bl-md bg-card">
          {/* cabeçalho com ícone */}
          <div className="relative flex items-center gap-3 px-4 pt-4">
            <div className="relative shrink-0">
              <span className="absolute -inset-1 rounded-2xl bg-primary/15 blur-sm" aria-hidden="true" />
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

// ─────────────────────────────────────────────────────────────────────────────
// Recursos do compositor: emojis, mídia e presente
// ─────────────────────────────────────────────────────────────────────────────

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const EMOJIS = [
  '😀', '😍', '🥰', '😘', '😏', '😜', '🤩', '😈',
  '❤️', '🔥', '💋', '💕', '😻', '🌹', '✨', '💎',
  '🎁', '💰', '💸', '🥂', '🍓', '🍑', '👑', '😇',
  '😉', '🤤', '💖', '💞', '🙈', '👅', '💃', '🫦',
]

function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl border border-border bg-card p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">Emojis</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar emojis"
          className="rounded-full p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onPick(e)}
            className="flex aspect-square items-center justify-center rounded-lg text-xl transition hover:bg-muted active:scale-90"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

function ImageBubble({ from, url, time }: { from: 'buyer' | 'creator'; url: string; time?: string }) {
  const isCreator = from === 'creator'
  return (
    <div className={`flex animate-speech-enter ${isCreator ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`overflow-hidden rounded-2xl p-1 shadow-sm ${
          isCreator ? 'rounded-br-md bg-primary' : 'rounded-bl-md border border-border bg-card'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url || '/placeholder.svg'}
          alt="Imagem enviada"
          className="max-h-60 w-full max-w-[240px] rounded-xl object-cover"
        />
        <span
          className={`mt-1 flex items-center justify-end gap-0.5 px-1 pb-0.5 text-[0.6rem] ${
            isCreator ? 'text-primary-foreground/80' : 'text-muted-foreground'
          }`}
        >
          {time}
          {isCreator && <CheckCheck className="size-3" />}
        </span>
      </div>
    </div>
  )
}

function AudioBubble({
  from,
  url,
  duration,
  time,
}: {
  from: 'buyer' | 'creator'
  url: string
  duration: number
  time?: string
}) {
  const isCreator = from === 'creator'
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
    } else {
      a.play().catch(() => {})
    }
  }

  return (
    <div className={`flex animate-speech-enter ${isCreator ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-sm ${
          isCreator ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border border-border bg-card text-foreground'
        }`}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pausar' : 'Reproduzir'}
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
            isCreator ? 'bg-primary-foreground/20' : 'bg-primary/15 text-primary'
          }`}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full ${isCreator ? 'bg-primary-foreground/60' : 'bg-primary/50'}`}
              style={{ height: `${6 + ((i * 7) % 16)}px` }}
            />
          ))}
        </div>
        <span className={`text-[0.65rem] ${isCreator ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
          {formatDuration(duration)}
        </span>
        <audio
          ref={audioRef}
          src={url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
        <span className={`ml-1 text-[0.6rem] ${isCreator ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {time}
        </span>
      </div>
    </div>
  )
}

// Modal para a criadora enviar um presente em dinheiro (R$ 50 a R$ 10.000)
const GIFT_MIN = 50
const GIFT_MAX = 10000
const GIFT_PRESETS = [50, 100, 250, 500, 1000, 5000]

function GiftComposerModal({
  onClose,
  onSend,
}: {
  onClose: () => void
  onSend: (amount: number) => void
}) {
  const [value, setValue] = useState('')
  const amount = Number(value)
  const valid = amount >= GIFT_MIN && amount <= GIFT_MAX

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/20 p-2 text-white/90 transition hover:bg-black/40"
        >
          <X className="size-5" />
        </button>

        <div className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-transparent px-5 pb-5 pt-7 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary shadow-xl shadow-primary/40">
            <Gift className="size-8 text-primary-foreground" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-foreground">Enviar presente</h2>
          <p className="mt-1 text-xs text-muted-foreground">Escolha um valor entre {brl(GIFT_MIN)} e {brl(GIFT_MAX)}</p>
        </div>

        <div className="px-5 py-5">
          {/* Valores rápidos */}
          <div className="grid grid-cols-3 gap-2">
            {GIFT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue(String(p))}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                  amount === p
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border bg-background/50 text-foreground hover:bg-muted'
                }`}
              >
                {brl(p)}
              </button>
            ))}
          </div>

          {/* Valor personalizado */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Outro valor</label>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">R$</span>
              <input
                type="number"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min={GIFT_MIN}
                max={GIFT_MAX}
                placeholder="0,00"
                className="w-full bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            {value !== '' && !valid && (
              <p className="mt-1.5 text-xs text-destructive">
                O valor deve estar entre {brl(GIFT_MIN)} e {brl(GIFT_MAX)}.
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!valid}
            onClick={() => onSend(amount)}
            className="luna-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <Gift className="size-4" />
            {valid ? `Enviar ${brl(amount)}` : 'Enviar presente'}
          </button>
        </div>
      </div>
    </div>
  )
}
