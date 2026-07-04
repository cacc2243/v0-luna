'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  location: string | null
  instagram: string | null
  website: string | null
  is_verified: boolean
  is_creator: boolean
  balance: number
  total_earned: number
  total_withdrawn: number
  followers_count: number
  sales_count: number
  rating: number
  pix_key: string | null
  pix_key_type: string | null
  chat_unlocked: boolean
  chat_unlocked_at: string | null
  gifts_enabled: boolean
  gifts_enabled_at: string | null
  withdrawal_verified: boolean
  withdrawal_verified_at: string | null
  created_at: string
}

export type Pack = {
  id: string
  user_id: string
  title: string
  description: string | null
  price: number
  cover_image_url: string | null
  is_published: boolean
  is_featured: boolean
  views_count: number
  sales_count: number
  likes_count: number
  created_at: string
  images?: PackImage[]
}

export type PackImage = {
  id: string
  pack_id: string
  image_url: string
  is_preview: boolean
  order_index: number
}

export type Sale = {
  id: string
  seller_id: string
  buyer_id: string | null
  buyer_name: string | null
  pack_id: string
  amount: number
  platform_fee: number
  net_amount: number
  status: string
  is_direct?: boolean
  created_at: string
  pack?: Pack
}

export type Transaction = {
  id: string
  user_id: string
  type: 'sale' | 'gift_received' | 'withdrawal' | 'bonus'
  amount: number
  description: string | null
  reference_id: string | null
  balance_after: number | null
  created_at: string
}

export type Withdrawal = {
  id: string
  user_id: string
  amount: number
  pix_key: string
  pix_key_type: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_at: string | null
  analysis_until: string | null
  failure_reason: string | null
  created_at: string
  }

export type Conversation = {
  id: string
  creator_id: string
  participant_id: string | null
  participant_name: string | null
  participant_avatar: string | null
  last_message: string | null
  last_message_at: string
  unread_count: number
  is_online: boolean
  flow_step: number
  pack_id?: string | null
  pack_title?: string | null
  pack_price?: number | null
  purchase_status?: 'pending' | 'purchased'
  is_follower?: boolean
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string | null
  is_from_creator: boolean
  content: string | null
  message_type: 'text' | 'image' | 'gift' | 'audio' | 'video'
  media_url: string | null
  gift_amount: number | null
  gift_claimed: boolean
  audio_duration: number | null
  is_read: boolean
  created_at: string
}

export type Boost = {
  id: string
  user_id: string
  pack_id: string | null
  boost_type: 'profile' | 'pack'
  plan_name: string
  amount: number
  duration_days: number
  views_gained: number
  clicks_gained: number
  conversions_gained: number
  starts_at: string
  ends_at: string
  is_active: boolean
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  type: 'sale' | 'follow' | 'like' | 'message' | 'gift' | 'boost'
  title: string
  description: string | null
  reference_id: string | null
  is_read: boolean
  created_at: string
}

export type Highlight = {
  id: string
  user_id: string
  label: string
  image_url: string
  order_index: number
}

export type UserSettings = {
  id: string
  user_id: string
  dark_mode: boolean
  notifications_push: boolean
  notifications_email: boolean
  private_profile: boolean
  show_online: boolean
  show_location: boolean
  language: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return null
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return data
}

export async function updateProfile(updates: Partial<Profile>) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/minha-conta')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pack Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getPacks(): Promise<Pack[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('packs')
    .select(`
      *,
      images:pack_images(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching packs:', error)
    return []
  }
  
  return data || []
}

export async function createPack(pack: {
  title: string
  description?: string
  price: number
  cover_image_url?: string
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { data, error } = await supabase
    .from('packs')
    .insert({
      user_id: user.id,
      title: pack.title,
      description: pack.description || null,
      price: pack.price,
      cover_image_url: pack.cover_image_url || null,
    })
    .select()
    .single()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/minha-conta')
  return { success: true, pack: data }
}

export async function updatePack(packId: string, updates: Partial<Pack>) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { error } = await supabase
    .from('packs')
    .update(updates)
    .eq('id', packId)
    .eq('user_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/minha-conta')
  return { success: true }
}

export async function deletePack(packId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { error } = await supabase
    .from('packs')
    .delete()
    .eq('id', packId)
    .eq('user_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/minha-conta')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sales Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getSales(): Promise<Sale[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      pack:packs(id, title, price, cover_image_url)
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching sales:', error)
    return []
  }
  
  return data || []
}

export async function getTodaySales(): Promise<{ count: number; total: number }> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { count: 0, total: 0 }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('sales')
    .select('net_amount')
    .eq('seller_id', user.id)
    .gte('created_at', today.toISOString())
  
  if (error) {
    console.error('Error fetching today sales:', error)
    return { count: 0, total: 0 }
  }
  
  const total = data?.reduce((sum, sale) => sum + Number(sale.net_amount), 0) || 0
  return { count: data?.length || 0, total }
}

export async function getMonthSales(): Promise<{ count: number; total: number }> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { count: 0, total: 0 }
  
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('sales')
    .select('net_amount')
    .eq('seller_id', user.id)
    .gte('created_at', firstDayOfMonth.toISOString())
  
  if (error) {
    console.error('Error fetching month sales:', error)
    return { count: 0, total: 0 }
  }
  
  const total = data?.reduce((sum, sale) => sum + Number(sale.net_amount), 0) || 0
  return { count: data?.length || 0, total }
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)
  
  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
  
  return data || []
}

// ─────────────────────────────────────────────────────────────────────────────
// Withdrawal Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching withdrawals:', error)
    return []
  }
  
  return data || []
}

export async function requestWithdrawal(amount: number) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) return { error: 'not_authenticated' as const }

  const profile = await getProfile()
  if (!profile) return { error: 'profile_not_found' as const }

  if (amount > profile.balance) {
    return { error: 'Saldo insuficiente' as const }
  }

  if (amount < 50) {
    return { error: 'Valor minimo para saque e R$ 50,00' as const }
  }

  if (!profile.pix_key) {
    return { error: 'no_pix_key' as const }
  }

  // Saque so pode ser solicitado se a conta estiver verificada
  if (!profile.withdrawal_verified) {
    return { error: 'not_verified' as const }
  }

  // Cria o saque em analise (24h). O saldo nao e deduzido enquanto a analise corre.
  const analysisUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { error: withdrawError } = await supabase.from('withdrawals').insert({
    user_id: user.id,
    amount,
    pix_key: profile.pix_key,
    pix_key_type: profile.pix_key_type,
    status: 'processing',
    analysis_until: analysisUntil,
  })

  if (withdrawError) {
    return { error: withdrawError.message }
  }

  revalidatePath('/minha-conta')
  return { success: true as const }
}

// Marca como "falhado" os saques cuja janela de analise de 24h ja passou.
// O motivo informado e a recusa do banco — o saldo permanece intacto.
export async function settleExpiredWithdrawals() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { settled: 0 }

  const { data: expired } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'processing')
    .lt('analysis_until', new Date().toISOString())

  if (!expired || expired.length === 0) return { settled: 0 }

  const { error } = await supabase
    .from('withdrawals')
    .update({
      status: 'failed',
      failure_reason: 'Seu banco recusou a transação. Tente novamente, por favor.',
      processed_at: new Date().toISOString(),
    })
    .in(
      'id',
      expired.map((w) => w.id),
    )

  if (error) return { settled: 0 }

  revalidatePath('/minha-conta')
  return { settled: expired.length }
}

// ───────���─────────────────────────────────────────────────────────────────────
// Conversation Actions
// ───────────────────�������───────────────────────────────────────────────────────�����─

// Compradores simulados que iniciam a conversa (semeados uma única vez por conta)
const BUYER_SEEDS: { name: string; greeting: string; online: boolean }[] = [
  { name: 'Rafael Augusto', greeting: 'Boa noite, meu amor. Te achei linda demais aqui', online: true },
  { name: 'Bruno Carvalho', greeting: 'Oi meu anjo, tudo bem com você? Adorei seu perfil', online: true },
  { name: 'Lucas Ferreira', greeting: 'Olá bebê, você é simplesmente perfeita', online: false },
  { name: 'Diego Martins', greeting: 'Bom dia, gata. Não consegui parar de olhar seu perfil', online: true },
  { name: 'Felipe Andrade', greeting: 'Oi linda, fiquei encantado com você agora mesmo', online: true },
  { name: 'Gustavo Lima', greeting: 'Que mulher maravilhosa, preciso te conhecer melhor', online: true },
  { name: 'Thiago Souza', greeting: 'Boa tarde, gata. Seu sorriso me ganhou na hora', online: false },
  { name: 'Marcelo Rocha', greeting: 'Oi amor, você é a coisa mais linda que vi hoje', online: true },
  { name: 'André Nogueira', greeting: 'Olá meu bem, fiquei impressionado com você', online: true },
  { name: 'Vinícius Costa', greeting: 'Oi gata, posso te conhecer melhor? Adorei tudo aqui', online: true },
  { name: 'Eduardo Pires', greeting: 'Boa noite, princesa. Você me deixou sem palavras', online: false },
  { name: 'Henrique Alves', greeting: 'Oi linda, seu perfil é o melhor que já vi', online: true },
  { name: 'Rodrigo Mendes', greeting: 'Olá amor, você é simplesmente deslumbrante', online: true },
  { name: 'Caio Barbosa', greeting: 'Oi gata, fiquei completamente encantado com você', online: true },
]

// Cada variante e uma "rajada" de bolhas curtas (mais natural, como gente digitando).
// Comecam em minusculas e quebradas em varios envios.
const ASK_GIFT_MESSAGES: string[][] = [
  ['oi', 'que delicia conversar com vc', 'posso te mandar um presente?', 'seu perfil ja ta aceitando?'],
  ['nossa', 'adorei te conhecer gata', 'queria muito te dar um mimo', 'sua conta ja aceita presente?'],
  ['vc e maravilhosa mesmo', 'posso te enviar um presente em dinheiro?', 'ja consegue receber ai?'],
  ['to encantado com vc', 'deixa eu te mandar um agrado', 'seu perfil ja libera presente?'],
  ['oii', 'fiquei pensando em vc o dia todo', 'queria te mimar', 'ja da pra te mandar presente?'],
]

const SEND_GIFT_MESSAGES: string[][] = [
  ['pronto', 'acabei de te mandar um presente', 'espero que goste linda'],
  ['te enviei um mimo agora', 'é só pra te ver feliz', 'aproveita amor'],
  ['olha so', 'deixei uma surpresa pra vc aqui', 'vc merece'],
  ['mandei um presentinho pra vc', 'pega que é todo seu gata'],
  ['te mandei um agrado especial', 'quero te ver sorrindo com ele'],
]

const LOCKED_MESSAGES: string[][] = [
  ['poxa', 'mandei o presente mas acho que nao chegou pra vc', 'sua conta ainda nao tem presentes ativos', 'se vc ativar a gente continua conversando?'],
  ['ué', 'te enviei aqui mas parece que vc nao recebeu', 'seu perfil nao tem presentes ativados', 'consegue ativar? ai seguimos'],
  ['mandei sim', 'só que acho que nao caiu ai', 'sua conta nao aceita presentes ainda', 'se conseguir ativar me avisa que continuamos!'],
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomGiftAmount() {
  // múltiplos de 10 entre R$ 200 e R$ 600 (mesma faixa aceita por claimGift)
  const v = Math.floor(Math.random() * (60 - 20 + 1)) + 20
  return v * 10
}

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('creator_id', user.id)
    .order('last_message_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
  
  return data || []
}

// Cria as conversas iniciais uma única vez por conta. Idempotente: se já existir
// qualquer conversa, não cria nada e apenas retorna as existentes.
export async function seedConversations(): Promise<Conversation[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return []

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('creator_id', user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return getConversations()
  }

  const now = Date.now()
  // Acumula no maximo 4 conversas: usa apenas os 4 primeiros seeds.
  const conversationsToInsert = BUYER_SEEDS.slice(0, 4).map((b, i) => ({
    creator_id: user.id,
    participant_id: null,
    participant_name: b.name,
    participant_avatar: null,
    last_message: b.greeting,
    // espaça os horários para preservar a ordem da lista
    last_message_at: new Date(now - i * 60_000).toISOString(),
    unread_count: 1,
    is_online: b.online,
    flow_step: 0,
  }))

  const { data: inserted, error } = await supabase
    .from('conversations')
    .insert(conversationsToInsert)
    .select('*')

  if (error || !inserted) {
    console.error('Error seeding conversations:', error)
    return getConversations()
  }

  // insere a mensagem de saudação (do comprador) em cada conversa
  const greetingMessages = inserted.map((c) => ({
    conversation_id: c.id,
    sender_id: null,
    is_from_creator: false,
    content: c.last_message,
    message_type: 'text',
    is_read: false,
  }))
  await supabase.from('messages').insert(greetingMessages)

  revalidatePath('/minha-conta')
  return getConversations()
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }
  
  return data || []
}

export async function markConversationRead(conversationId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'not_authenticated' as const }

  await supabase
    .from('conversations')
    .update({ unread_count: 0 })
    .eq('id', conversationId)
    .eq('creator_id', user.id)

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_from_creator', false)

  return { success: true as const }
}

type CreatorMessageInput = {
  kind: 'text' | 'image' | 'audio' | 'video'
  content?: string | null
  mediaUrl?: string | null
  audioDuration?: number | null
}

// Envia a mensagem da criadora e avança o fluxo do comprador no servidor,
// persistindo também as respostas automáticas (texto + presente) para que
// tudo sobreviva ao refresh. Retorna as mensagens do comprador geradas.
export async function sendCreatorMessage(
  conversationId: string,
  input: CreatorMessageInput,
) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'not_authenticated' as const }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, flow_step, participant_name')
    .eq('id', conversationId)
    .eq('creator_id', user.id)
    .single()

  if (!conversation) return { error: 'conversation_not_found' as const }

  // Insere a mensagem da criadora
  const { error: insErr } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    is_from_creator: true,
    content: input.kind === 'text' ? (input.content ?? null) : null,
    message_type: input.kind,
    media_url: input.mediaUrl ?? null,
    audio_duration: input.audioDuration ?? null,
    is_read: true,
  })
  if (insErr) return { error: insErr.message }

  const step = conversation.flow_step ?? 0
  const buyerInserts: Array<Record<string, unknown>> = []
  let newStep = step

  if (step === 0) {
    newStep = 1
    const burst = pickRandom(ASK_GIFT_MESSAGES)
    burst.forEach((line, i) => {
      buyerInserts.push({
        conversation_id: conversationId,
        sender_id: null,
        is_from_creator: false,
        content: line,
        message_type: 'text',
        gift_amount: null,
        gift_claimed: false,
        is_read: false,
        created_at: new Date(Date.now() + (i + 1) * 80).toISOString(),
      })
    })
  } else if (step === 1) {
    newStep = 3
    const burst = pickRandom(SEND_GIFT_MESSAGES)
    burst.forEach((line, i) => {
      buyerInserts.push({
        conversation_id: conversationId,
        sender_id: null,
        is_from_creator: false,
        content: line,
        message_type: 'text',
        gift_amount: null,
        gift_claimed: false,
        is_read: false,
        created_at: new Date(Date.now() + (i + 1) * 80).toISOString(),
      })
    })
    buyerInserts.push({
      conversation_id: conversationId,
      sender_id: null,
      is_from_creator: false,
      content: null,
      message_type: 'gift',
      gift_amount: randomGiftAmount(),
      gift_claimed: false,
      is_read: false,
      created_at: new Date(Date.now() + (burst.length + 1) * 80).toISOString(),
    })
  }

  let buyerMessages: Message[] = []
  if (buyerInserts.length > 0) {
    const { data: insertedBuyer, error: buyerErr } = await supabase
      .from('messages')
      .insert(buyerInserts)
      .select('*')
    if (buyerErr) return { error: buyerErr.message }
    buyerMessages = (insertedBuyer as Message[]) || []
  }

  const lastContent =
    buyerMessages.length > 0
      ? (buyerMessages[buyerMessages.length - 1].content ?? 'Presente recebido')
      : input.kind === 'text'
        ? (input.content ?? '')
        : input.kind === 'image'
          ? 'Imagem'
          : 'Áudio'

  await supabase
    .from('conversations')
    .update({
      last_message: lastContent,
      last_message_at: new Date().toISOString(),
      flow_step: newStep,
      unread_count: 0,
    })
    .eq('id', conversationId)

  revalidatePath('/minha-conta')
  return { success: true as const, buyerMessages, flowStep: newStep }
}

// Envia a mensagem do comprador dizendo que o presente não chegou (conta
// sem presentes ativos). Persistida para sobreviver ao refresh.
export async function sendLockedMessage(conversationId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'not_authenticated' as const }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('creator_id', user.id)
    .single()
  if (!conversation) return { error: 'conversation_not_found' as const }

  const burst = pickRandom(LOCKED_MESSAGES)
  const lockedInserts = burst.map((line, i) => ({
    conversation_id: conversationId,
    sender_id: null,
    is_from_creator: false,
    content: line,
    message_type: 'text',
    is_read: false,
    created_at: new Date(Date.now() + (i + 1) * 80).toISOString(),
  }))
  const { data: inserted } = await supabase
    .from('messages')
    .insert(lockedInserts)
    .select('*')

  const lastContent = burst[burst.length - 1]
  await supabase
    .from('conversations')
    .update({ last_message: lastContent, last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return { success: true as const, messages: (inserted as Message[]) || [] }
}

// Mensagens de cobrança de presença quando a criadora some sem ativar o chat.
// Dois estágios: ~5 min (leve) e ~10 min (mais insistente).
const INACTIVITY_NUDGES: Record<1 | 2, string[]> = {
  1: ['tá por aí ainda?', 'oi, sumiu? 🥺', 'cadê vc? ainda tô aqui te esperando', 'oi linda, você travou aí?'],
  2: [
    'ainda quer conversar comigo? 🥹',
    'puxa, achei que a gente tava se curtindo... ainda tá aí?',
    'fiquei esperando você voltar, ainda tá online?',
    'me responde só pra eu saber que você não sumiu de vez 🙏',
  ],
}

// Insere uma única mensagem do comprador cobrando presença. Chamada pelo client
// após 5 e 10 minutos de inatividade da criadora (enquanto o chat não foi ativado).
export async function sendInactivityNudge(conversationId: string, stage: 1 | 2) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'not_authenticated' as const }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('creator_id', user.id)
    .single()
  if (!conversation) return { error: 'conversation_not_found' as const }

  const content = pickRandom(INACTIVITY_NUDGES[stage] ?? INACTIVITY_NUDGES[1])
  const { data: inserted } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: null,
      is_from_creator: false,
      content,
      message_type: 'text',
      is_read: false,
    })
    .select('*')
    .single()

  await supabase
    .from('conversations')
    .update({ last_message: content, last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return { success: true as const, message: (inserted as Message) || null }
}

// Mensagens espontâneas de novos clientes chegando ao chat
const NEW_CHAT_GREETINGS = [
  'Oi linda, acabei de ver seu perfil e fiquei encantado',
  'Boa noite, gata. Posso te conhecer melhor?',
  'Oi amor, você é simplesmente maravilhosa',
  'Olá meu bem, adorei tudo que vi no seu perfil',
  'Oi princesa, fiquei sem palavras agora mesmo',
  'Bom dia, linda. Seu sorriso me ganhou na hora',
  'Oi gata, preciso muito conversar com você',
  'Olá amor, você é a mulher mais linda que vi hoje',
]

// Gera atividade de chat: novos clientes mandando a primeira mensagem.
// Cada nova conversa vira uma notificacao do tipo "message" (para o toast).
// Tudo persiste no banco, sobrevivendo ao refresh.
export async function generateChatActivity() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'not_authenticated' as const }

  // Limite: acumula no maximo 4 conversas. Se ja existirem 4 ou mais, nao
  // gera novos chats (evita o excesso de pedidos relatado).
  const MAX_CHATS = 4
  const { count: convoCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', user.id)
  if ((convoCount ?? 0) >= MAX_CHATS) {
    return { success: true as const, skipped: 'max_chats_reached' as const }
  }

  // Evita repetir nomes já presentes nas conversas existentes
  const usedNames = new Set<string>()
  const usedGreetings = new Set<string>()
  const { data: existingConvos } = await supabase
    .from('conversations')
    .select('participant_name, last_message')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(120)
  for (const c of existingConvos ?? []) {
    if (c.participant_name) usedNames.add(c.participant_name)
    if (c.last_message) usedGreetings.add(c.last_message)
  }

  const buyer = generateBuyerName(usedNames)
  // Saudacao sem repetir: prioriza as que ainda nao foram usadas.
  const availableGreetings = NEW_CHAT_GREETINGS.filter((g) => !usedGreetings.has(g))
  const greeting = pickRandom(availableGreetings.length > 0 ? availableGreetings : NEW_CHAT_GREETINGS)
  const nowIso = new Date().toISOString()

  // Escolhe um pack publicado da criadora para vincular ao novo fã.
  const { data: packs } = await supabase
    .from('packs')
    .select('id, title, price')
    .eq('user_id', user.id)
    .eq('is_published', true)
  const chosenPack = packs && packs.length > 0 ? pickRandom(packs) : null
  // ~30% dos fãs já compraram o pack; o restante está com a compra pendente.
  const alreadyPurchased = Math.random() < 0.3

  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .insert({
      creator_id: user.id,
      participant_id: null,
      participant_name: buyer,
      participant_avatar: null,
      last_message: greeting,
      last_message_at: nowIso,
      unread_count: 1,
      is_online: true,
      flow_step: 0,
      pack_id: chosenPack?.id ?? null,
      pack_title: chosenPack?.title ?? null,
      pack_price: chosenPack ? Number(chosenPack.price) : null,
      purchase_status: alreadyPurchased ? 'purchased' : 'pending',
      is_follower: true,
    })
    .select('*')
    .single()

  if (convErr || !conversation) return { error: convErr?.message ?? 'insert_failed' }

  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    sender_id: null,
    is_from_creator: false,
    content: greeting,
    message_type: 'text',
    is_read: false,
  })

  // O fã que abriu o chat também passa a seguir a criadora.
  await supabase.from('followers').insert({
    creator_id: user.id,
    follower_name: buyer,
  })
  const { data: prof } = await supabase
    .from('profiles')
    .select('followers_count')
    .eq('id', user.id)
    .single()
  await supabase
    .from('profiles')
    .update({ followers_count: (prof?.followers_count || 0) + 1 })
    .eq('id', user.id)

  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'follow',
    title: 'Novo seguidor',
    description: `${buyer} começou a seguir você`,
  })

  // Notificacao de mensagem (alimenta o toast no topo do app)
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'message',
    title: `Nova mensagem de ${buyer}`,
    description: greeting,
    reference_id: conversation.id,
  })

  revalidatePath('/minha-conta')
  return { success: true as const, buyerName: buyer }
}

// Marca uma mensagem de presente como resgatada (após claimGift creditar o saldo)
export async function markGiftClaimed(messageId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'not_authenticated' as const }

  const { error } = await supabase
    .from('messages')
    .update({ gift_claimed: true })
    .eq('id', messageId)

  if (error) return { error: error.message }
  revalidatePath('/minha-conta')
  return { success: true as const }
}

// ──────────────���─────────────────────────────────────────────────────────────��
// Boost Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getBoosts(): Promise<Boost[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('boosts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching boosts:', error)
    return []
  }
  
  return data || []
}

export async function getActiveBoosts(): Promise<Boost[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('boosts')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching active boosts:', error)
    return []
  }
  
  return data || []
}

// ──────────────────────────────────────────────────────────────────────────���──
// Notification Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
  
  return data || []
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return 0
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
  
  if (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }
  
  return count || 0
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/minha-conta')
  return { success: true }
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/minha-conta')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Highlight Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getHighlights(): Promise<Highlight[]> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })
  
  if (error) {
    console.error('Error fetching highlights:', error)
    return []
  }
  
  return data || []
}

// ──────────────────────────────────────���──���───────────────────────────────────
// Settings Actions
// ─────────────────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return null
  
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching settings:', error)
    return null
  }
  
  return data
}

export async function updateSettings(updates: Partial<UserSettings>) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { error } = await supabase
    .from('user_settings')
    .update(updates)
    .eq('user_id', user.id)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/minha-conta')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pack Activity Engine (views, pedidos pendentes, notificacoes)
// ─────────────────────────────────────────────────────────────────────────────

const BUYER_FIRST_NAMES = [
  'Rafael', 'Lucas', 'Bruno', 'Thiago', 'Gabriel', 'Felipe', 'Matheus', 'Pedro',
  'Carlos', 'Vinicius', 'Diego', 'Andre', 'Joao', 'Leonardo', 'Gustavo', 'Rodrigo',
  'Eduardo', 'Marcelo', 'Ricardo', 'Fernando', 'Daniel', 'Marcos', 'Paulo', 'Caio',
  'Henrique', 'Igor', 'Otavio', 'Renato', 'Fabio', 'Alexandre', 'Murilo', 'Luiz',
  'Guilherme', 'Arthur', 'Enzo', 'Davi', 'Bernardo', 'Samuel', 'Nicolas', 'Vitor',
  'Cauã', 'Yuri', 'Erick', 'Wesley', 'Danilo', 'Robson', 'Anderson', 'Jonas',
  'Breno', 'Heitor', 'Lorenzo', 'Theo', 'Miguel', 'Benjamin', 'Joaquim', 'Pietro',
  'Tomas', 'Emanuel', 'Kaique', 'Ruan', 'Alan', 'Maicon', 'Cristian', 'Jeferson',
  'Leandro', 'Sergio', 'Adriano', 'Claudio', 'Edson', 'Wagner', 'Roberto', 'Mauricio',
]

const BUYER_LAST_NAMES = [
  'Mendes', 'Oliveira', 'Costa', 'Almeida', 'Santos', 'Rocha', 'Lima', 'Henrique',
  'Ferreira', 'Souza', 'Martins', 'Dias', 'Pereira', 'Barbosa', 'Silva', 'Carvalho',
  'Gomes', 'Ribeiro', 'Araujo', 'Cardoso', 'Teixeira', 'Moreira', 'Nascimento', 'Cavalcanti',
  'Pinto', 'Moura', 'Freitas', 'Azevedo', 'Correia', 'Cunha', 'Monteiro', 'Nunes',
  'Vieira', 'Ramos', 'Castro', 'Campos', 'Machado', 'Lopes', 'Fernandes', 'Borges',
  'Duarte', 'Reis', 'Tavares', 'Andrade', 'Farias', 'Pacheco', 'Siqueira', 'Brito',
  'Macedo', 'Sampaio', 'Magalhaes', 'Figueiredo', 'Antunes', 'Caldeira', 'Bezerra', 'Aguiar',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Gera um nome completo unico (primeiro + sobrenome), evitando os que ja estao em `used`.
function generateBuyerName(used: Set<string>): string {
  for (let attempt = 0; attempt < 40; attempt++) {
    const name = `${pick(BUYER_FIRST_NAMES)} ${pick(BUYER_LAST_NAMES)}`
    if (!used.has(name)) {
      used.add(name)
      return name
    }
  }
  // Fallback extremamente improvavel: adiciona um segundo sobrenome
  const name = `${pick(BUYER_FIRST_NAMES)} ${pick(BUYER_LAST_NAMES)} ${pick(BUYER_LAST_NAMES)}`
  used.add(name)
  return name
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Gera atividade para os packs do usuario: views, likes, seguidores e pedidos pendentes.
// Tudo fica salvo no banco. Retorna quantos pedidos novos foram criados.
export async function generatePackActivity(opts?: { initial?: boolean; maxOrders?: number }) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: packs } = await supabase
    .from('packs')
    .select('id, title, price, views_count, likes_count')
    .eq('user_id', user.id)
    .eq('is_published', true)

  if (!packs || packs.length === 0) return { success: true, newOrders: 0 }

  // Carrega os nomes ja usados recentemente (vendas e seguidores) para nao repetir
  const usedNames = new Set<string>()
  const { data: recentSales } = await supabase
    .from('sales')
    .select('buyer_name')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })
    .limit(250)
  for (const s of recentSales ?? []) {
    if (s.buyer_name) usedNames.add(s.buyer_name)
  }

  // Contagem total de pedidos ja gerados (para a regra de pedido direto).
  // Regra: os 4 PRIMEIROS pedidos sao diretos (sem chat). Depois disso,
  // a cada 10 pedidos apenas 1 e direto e os outros 9 sao com chat exclusivo.
  const { count: existingOrders } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', user.id)
  let orderIndex = existingOrders ?? 0

  const initial = opts?.initial
  // Limite de pedidos por chamada (para os pedidos aparecerem um a um, e nao em lote).
  const maxOrders = opts?.maxOrders ?? Infinity
  let newOrders = 0
  let followersGained = 0

  for (const pack of packs) {
    // Visualizacoes
    const viewsGained = initial ? randInt(8, 25) : randInt(2, 9)
    const likesGained = initial ? randInt(2, 8) : randInt(0, 3)
    await supabase
      .from('packs')
      .update({
        views_count: (pack.views_count || 0) + viewsGained,
        likes_count: (pack.likes_count || 0) + likesGained,
      })
      .eq('id', pack.id)
      .eq('user_id', user.id)

    // Notificacao de visualizacoes
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'like',
      title: `${viewsGained} novas visualizacoes`,
      description: `Seu pack "${pack.title}" esta recebendo atencao`,
      reference_id: pack.id,
    })

    // Seguidores crescem conforme as views: 1 seguidor a cada 5-10 views
    let remainingViews = viewsGained
    while (remainingViews > 0) {
      const threshold = randInt(5, 10)
      if (remainingViews >= threshold) {
        remainingViews -= threshold
        followersGained++
        const follower = generateBuyerName(usedNames)
        await supabase.from('followers').insert({
          creator_id: user.id,
          follower_name: follower,
        })
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'follow',
          title: 'Novo seguidor',
          description: `${follower} comecou a seguir voce`,
        })
      } else {
        break
      }
    }

    // Pedidos de venda pendentes (menos frequentes para nao acumular demais)
    const orders = initial ? randInt(1, 2) : randInt(0, 1)
    for (let i = 0; i < orders; i++) {
      // Respeita o limite global de pedidos por chamada.
      if (newOrders >= maxOrders) break
      const amount = Number(pack.price) || 0
      // A pessoa recebe o valor total da venda, sem desconto de taxa
      const netAmount = amount
      const buyer = generateBuyerName(usedNames)

      // Regra de pedido direto:
      // - proporcao de 12 pedidos com chat para 1 pedido direto;
      // - ou seja, a cada bloco de 13 pedidos apenas 1 e direto.
      orderIndex++
      const isDirect = orderIndex % 13 === 1

      const { data: sale } = await supabase
        .from('sales')
        .insert({
          seller_id: user.id,
          buyer_name: buyer,
          pack_id: pack.id,
          amount,
          platform_fee: 0,
          net_amount: netAmount,
          status: 'pending',
          is_direct: isDirect,
        })
        .select()
        .single()

      if (sale) {
        newOrders++
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'sale',
          title: isDirect ? 'Novo pedido direto' : 'Novo pedido de venda',
          description: `${buyer} quer comprar "${pack.title}" por ${formatBRL(amount)}`,
          reference_id: sale.id,
        })
      }
    }
  }

  // Atualiza o contador de seguidores do perfil
  if (followersGained > 0) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('followers_count')
      .eq('id', user.id)
      .single()
    await supabase
      .from('profiles')
      .update({ followers_count: (prof?.followers_count || 0) + followersGained })
      .eq('id', user.id)
  }

  revalidatePath('/minha-conta')
  return { success: true, newOrders }
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// Aceitar um pedido de venda: pendente -> saldo disponivel
export async function acceptSale(saleId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  // Processa tudo atomicamente no banco (com lock de linha) para evitar
  // corridas que fazem o saldo "voltar" ao aceitar pedidos rapidamente.
  const { data, error } = await supabase.rpc('accept_sale_atomic', { p_sale_id: saleId })
  if (error) return { error: error.message }
  if (data && (data as { error?: string }).error) {
    const errCode = (data as { error?: string }).error
    // Sinaliza ao cliente que falta liberar o Chat Exclusivo
    if (errCode === 'chat_locked') return { error: 'chat_locked' }
    return { error: errCode }
  }

  revalidatePath('/minha-conta')
  return { success: true }
}

// Recusar um pedido de venda
export async function rejectSale(saleId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('sales')
    .update({ status: 'cancelled' })
    .eq('id', saleId)
    .eq('seller_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/minha-conta')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Presentes (Chat) — resgate de presente vira saldo
// ────────��────────────────────────────────────────────────────────────────────

// Resgata um presente recebido no chat, creditando o valor no saldo da usuaria.
// Requer que a conta tenha a habilitacao de presentes ativa (gifts_enabled).
export async function claimGift(params: {
  amount: number
  senderName?: string | null
  giftType?: string | null
}) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'not_authenticated' as const }

  // Valor seguro: presentes simulados variam entre R$ 200 e R$ 600
  const amount = Math.round(Number(params.amount))
  if (!Number.isFinite(amount) || amount < 200 || amount > 600) {
    return { error: 'invalid_amount' as const }
  }

  // Verifica perfil e habilitacao de presentes
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('balance, total_earned, gifts_enabled')
    .eq('id', user.id)
    .single()

  if (profErr || !profile) return { error: 'profile_not_found' as const }
  if (!profile.gifts_enabled) return { error: 'gifts_locked' as const }

  const newBalance = Number(profile.balance) + amount
  const newEarned = Number(profile.total_earned) + amount

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ balance: newBalance, total_earned: newEarned })
    .eq('id', user.id)

  if (updErr) return { error: updErr.message }

  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'gift',
    amount,
    description: params.senderName
      ? `Presente de ${params.senderName}`
      : 'Presente recebido no chat',
    balance_after: newBalance,
  })

  revalidatePath('/minha-conta')
  return { success: true as const, newBalance }
}

// ───────────────────────────────��─────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [profile, todaySales, monthSales, packs] = await Promise.all([
    getProfile(),
    getTodaySales(),
    getMonthSales(),
    getPacks(),
  ])
  
  // Calculate total views from packs
  const totalViews = packs.reduce((sum, pack) => sum + pack.views_count, 0)
  
  return {
    balance: profile?.balance || 0,
    todayEarnings: todaySales.total,
    todaySalesCount: todaySales.count,
    monthEarnings: monthSales.total,
    monthSalesCount: monthSales.count,
    totalViews,
    totalSales: profile?.sales_count || 0,
    totalEarned: profile?.total_earned || 0,
    totalWithdrawn: profile?.total_withdrawn || 0,
    followersCount: profile?.followers_count || 0,
  }
}
