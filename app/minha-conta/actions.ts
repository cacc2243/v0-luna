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
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string | null
  is_from_creator: boolean
  content: string | null
  message_type: 'text' | 'image' | 'gift'
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
    .limit(50)
  
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
  
  if (!user) return { error: 'Not authenticated' }
  
  // Get profile to check balance and PIX key
  const profile = await getProfile()
  if (!profile) return { error: 'Profile not found' }
  
  if (amount > profile.balance) {
    return { error: 'Saldo insuficiente' }
  }
  
  if (amount < 50) {
    return { error: 'Valor minimo para saque e R$ 50,00' }
  }
  
  if (!profile.pix_key) {
    return { error: 'Configure sua chave PIX primeiro' }
  }
  
  // Create withdrawal
  const { error: withdrawError } = await supabase
    .from('withdrawals')
    .insert({
      user_id: user.id,
      amount,
      pix_key: profile.pix_key,
      pix_key_type: profile.pix_key_type,
    })
  
  if (withdrawError) {
    return { error: withdrawError.message }
  }
  
  // Update balance
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      balance: profile.balance - amount,
      total_withdrawn: profile.total_withdrawn + amount,
    })
    .eq('id', user.id)
  
  if (updateError) {
    return { error: updateError.message }
  }
  
  // Create transaction record
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'withdrawal',
    amount: -amount,
    description: `Saque PIX - ${profile.pix_key}`,
    balance_after: profile.balance - amount,
  })
  
  revalidatePath('/minha-conta')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation Actions
// ─────────────────────────────────────────────────────────────────────────────

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

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      is_from_creator: true,
      content,
      message_type: 'text',
    })
  
  if (error) {
    return { error: error.message }
  }
  
  // Update conversation last message
  await supabase
    .from('conversations')
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
  
  revalidatePath('/minha-conta')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
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

const BUYER_NAMES = [
  'Rafael Mendes', 'Lucas Oliveira', 'Bruno Costa', 'Thiago Almeida',
  'Gabriel Santos', 'Felipe Rocha', 'Matheus Lima', 'Pedro Henrique',
  'Carlos Eduardo', 'Vinicius Souza', 'Diego Ferreira', 'Andre Martins',
  'Joao Vitor', 'Leonardo Dias', 'Gustavo Pereira', 'Rodrigo Barbosa',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Gera atividade para os packs do usuario: views, likes, seguidores e pedidos pendentes.
// Tudo fica salvo no banco. Retorna quantos pedidos novos foram criados.
export async function generatePackActivity(opts?: { initial?: boolean }) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: packs } = await supabase
    .from('packs')
    .select('id, title, price, views_count, likes_count')
    .eq('user_id', user.id)
    .eq('is_published', true)

  if (!packs || packs.length === 0) return { success: true, newOrders: 0 }

  const initial = opts?.initial
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
        const follower = pick(BUYER_NAMES)
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

    // Pedidos de venda pendentes (1-2 por pack, mais no inicio)
    const orders = initial ? randInt(1, 3) : randInt(0, 2)
    for (let i = 0; i < orders; i++) {
      const amount = Number(pack.price) || 0
      // A pessoa recebe o valor total da venda, sem desconto de taxa
      const netAmount = amount
      const buyer = pick(BUYER_NAMES)

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
        })
        .select()
        .single()

      if (sale) {
        newOrders++
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'sale',
          title: 'Novo pedido de venda',
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

  const { data: sale } = await supabase
    .from('sales')
    .select('*')
    .eq('id', saleId)
    .eq('seller_id', user.id)
    .single()

  if (!sale) return { error: 'Pedido nao encontrado' }
  if (sale.status !== 'pending') return { error: 'Pedido ja processado' }

  const profile = await getProfile()
  if (!profile) return { error: 'Profile not found' }

  const net = Number(sale.net_amount)
  const newBalance = Number(profile.balance) + net

  // Marca a venda como concluida
  await supabase
    .from('sales')
    .update({ status: 'completed' })
    .eq('id', saleId)
    .eq('seller_id', user.id)

  // Atualiza saldo, total ganho e contador de vendas
  await supabase
    .from('profiles')
    .update({
      balance: newBalance,
      total_earned: Number(profile.total_earned) + net,
      sales_count: Number(profile.sales_count) + 1,
    })
    .eq('id', user.id)

  // Incrementa vendas do pack
  const { data: pack } = await supabase
    .from('packs')
    .select('sales_count, title')
    .eq('id', sale.pack_id)
    .single()
  if (pack) {
    await supabase
      .from('packs')
      .update({ sales_count: (pack.sales_count || 0) + 1 })
      .eq('id', sale.pack_id)
      .eq('user_id', user.id)
  }

  // Registra transacao
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'sale',
    amount: net,
    description: `Venda confirmada - ${sale.buyer_name || 'Comprador'}`,
    reference_id: saleId,
    balance_after: newBalance,
  })

  // Notificacao
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'sale',
    title: 'Venda confirmada',
    description: `Voce recebeu ${formatBRL(net)} pela venda${pack ? ` de "${pack.title}"` : ''}`,
    reference_id: saleId,
  })

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
