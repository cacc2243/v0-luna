import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface PackRow {
  id: string
  user_id: string | null
  title: string | null
  price: number | null
  cover_image_url: string | null
  is_published: boolean | null
  created_at: string
}

interface PackImageRow {
  id: string
  pack_id: string | null
  image_url: string | null
  is_preview: boolean | null
  order_index: number | null
  created_at: string
}

interface ProfileRow {
  id: string
  username: string | null
  display_name: string | null
  chat_unlocked: boolean | null
}

export interface AdminImage {
  // id sintetico: `${type}:${rowId}` para acoes de exclusao
  key: string
  type: 'cover' | 'pack_image'
  rowId: string // id da pack_image OU id do pack (para a capa)
  packId: string | null
  packTitle: string | null
  packPrice: number | null
  imageUrl: string
  isPreview: boolean
  createdAt: string
  ownerId: string | null
  ownerName: string | null
  ownerUsername: string | null
  ownerEmail: string | null
  ownerChatUnlocked: boolean
  ownerBanned: boolean
  ownerBanReason: string | null
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const [packsRes, packImagesRes, profilesRes] = await Promise.all([
    supabase
      .from('packs')
      .select('id, user_id, title, price, cover_image_url, is_published, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('pack_images')
      .select('id, pack_id, image_url, is_preview, order_index, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, username, display_name, chat_unlocked'),
  ])

  if (packsRes.error) console.error('[v0] Erro ao buscar packs:', packsRes.error)
  if (packImagesRes.error) console.error('[v0] Erro ao buscar pack_images:', packImagesRes.error)
  if (profilesRes.error) console.error('[v0] Erro ao buscar profiles:', profilesRes.error)

  const packs = (packsRes.data || []) as PackRow[]
  const packImages = (packImagesRes.data || []) as PackImageRow[]
  const profiles = (profilesRes.data || []) as ProfileRow[]

  // Mapa de perfis
  const profileMap = new Map<string, ProfileRow>()
  for (const p of profiles) profileMap.set(p.id, p)

  // Mapa de auth (email + status de banimento) — paginado
  const emailMap = new Map<string, string>()
  const banMap = new Map<string, { banned: boolean; reason: string | null }>()
  const isBanned = (bannedUntil: string | null | undefined) => {
    if (!bannedUntil) return false
    const t = new Date(bannedUntil).getTime()
    return Number.isFinite(t) && t > Date.now()
  }
  try {
    let page = 1
    // até 50 páginas de 1000 = 50k usuários
    for (; page <= 50; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
      if (error) {
        console.error('[v0] Erro ao listar usuários:', error)
        break
      }
      const users = data?.users || []
      for (const u of users) {
        if (u.email) emailMap.set(u.id, u.email)
        const banned = isBanned((u as { banned_until?: string | null }).banned_until)
        banMap.set(u.id, {
          banned,
          reason: banned
            ? (u.app_metadata as { ban_reason?: string | null } | undefined)?.ban_reason ?? null
            : null,
        })
      }
      if (users.length < 1000) break
    }
  } catch (e) {
    console.error('[v0] Falha ao buscar emails:', e)
  }

  // Mapa de pack por id (para titulo das imagens)
  const packMap = new Map<string, PackRow>()
  for (const pk of packs) packMap.set(pk.id, pk)

  const images: AdminImage[] = []

  // Capas dos packs
  for (const pk of packs) {
    if (!pk.cover_image_url) continue
    const prof = pk.user_id ? profileMap.get(pk.user_id) : undefined
    images.push({
      key: `cover:${pk.id}`,
      type: 'cover',
      rowId: pk.id,
      packId: pk.id,
      packTitle: pk.title,
      packPrice: pk.price != null ? Number(pk.price) : null,
      imageUrl: pk.cover_image_url,
      isPreview: true,
      createdAt: pk.created_at,
      ownerId: pk.user_id,
      ownerName: prof?.display_name || null,
      ownerUsername: prof?.username || null,
      ownerEmail: pk.user_id ? emailMap.get(pk.user_id) || null : null,
      ownerChatUnlocked: !!prof?.chat_unlocked,
      ownerBanned: pk.user_id ? banMap.get(pk.user_id)?.banned ?? false : false,
      ownerBanReason: pk.user_id ? banMap.get(pk.user_id)?.reason ?? null : null,
    })
  }

  // Imagens internas dos packs
  for (const img of packImages) {
    if (!img.image_url) continue
    const pk = img.pack_id ? packMap.get(img.pack_id) : undefined
    const ownerId = pk?.user_id || null
    const prof = ownerId ? profileMap.get(ownerId) : undefined
    images.push({
      key: `pack_image:${img.id}`,
      type: 'pack_image',
      rowId: img.id,
      packId: img.pack_id,
      packTitle: pk?.title || null,
      packPrice: pk?.price != null ? Number(pk.price) : null,
      imageUrl: img.image_url,
      isPreview: !!img.is_preview,
      createdAt: img.created_at,
      ownerId,
      ownerName: prof?.display_name || null,
      ownerUsername: prof?.username || null,
      ownerEmail: ownerId ? emailMap.get(ownerId) || null : null,
      ownerChatUnlocked: !!prof?.chat_unlocked,
      ownerBanned: ownerId ? banMap.get(ownerId)?.banned ?? false : false,
      ownerBanReason: ownerId ? banMap.get(ownerId)?.reason ?? null : null,
    })
  }

  // Mais recentes primeiro
  images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ images, fetchedAt: new Date().toISOString() })
}

// Extrai { bucket, path } de uma URL publica de storage do Supabase
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const marker = '/storage/v1/object/public/'
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    const rest = url.slice(idx + marker.length) // <bucket>/<path...>
    const slash = rest.indexOf('/')
    if (slash === -1) return null
    const bucket = rest.slice(0, slash)
    const path = decodeURIComponent(rest.slice(slash + 1).split('?')[0])
    return { bucket, path }
  } catch {
    return null
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { type?: string; rowId?: string; imageUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const { type, rowId, imageUrl } = body
  if (!type || !rowId) {
    return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // 1) Remove o registro no banco
  if (type === 'pack_image') {
    const { error } = await supabase.from('pack_images').delete().eq('id', rowId)
    if (error) {
      console.error('[v0] Erro ao excluir pack_image:', error)
      return NextResponse.json({ error: 'Falha ao excluir imagem' }, { status: 500 })
    }
  } else if (type === 'cover') {
    const { error } = await supabase
      .from('packs')
      .update({ cover_image_url: null })
      .eq('id', rowId)
    if (error) {
      console.error('[v0] Erro ao remover capa do pack:', error)
      return NextResponse.json({ error: 'Falha ao remover capa' }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  // 2) Remove o arquivo do storage (best-effort)
  if (imageUrl) {
    const parsed = parseStorageUrl(imageUrl)
    if (parsed) {
      const { error: storageError } = await supabase.storage
        .from(parsed.bucket)
        .remove([parsed.path])
      if (storageError) {
        console.error('[v0] Aviso: falha ao remover do storage:', storageError)
        // Nao falha a requisicao: o registro ja foi removido do banco
      }
    }
  }

  return NextResponse.json({ success: true })
}

// Dias permitidos para a limpeza em massa (evita valores arbitrarios).
const ALLOWED_CLEANUP_DAYS = [5, 7, 14, 30, 60, 90] as const

// POST: limpeza em massa. Exclui COMPLETAMENTE todos os packs criados ha mais
// de `olderThanDays` dias — registro do pack, todas as pack_images e os
// arquivos correspondentes no Storage. Acao destrutiva e irreversivel.
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: { olderThanDays?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const days = Number(body.olderThanDays)
  if (!ALLOWED_CLEANUP_DAYS.includes(days as (typeof ALLOWED_CLEANUP_DAYS)[number])) {
    return NextResponse.json(
      { error: `Período inválido. Use um de: ${ALLOWED_CLEANUP_DAYS.join(', ')} dias.` },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const cutoffIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // 1) Packs alvo (mais antigos que o corte)
  const { data: packs, error: packsError } = await supabase
    .from('packs')
    .select('id, cover_image_url')
    .lt('created_at', cutoffIso)

  if (packsError) {
    console.error('[v0] Erro ao buscar packs para limpeza:', packsError)
    return NextResponse.json({ error: 'Falha ao buscar packs' }, { status: 500 })
  }

  const packIds = (packs ?? []).map((p) => p.id)
  if (packIds.length === 0) {
    return NextResponse.json({
      success: true,
      deletedPacks: 0,
      deletedImages: 0,
      removedFiles: 0,
      cutoff: cutoffIso,
    })
  }

  // 2) Imagens desses packs
  const { data: images, error: imagesError } = await supabase
    .from('pack_images')
    .select('id, image_url')
    .in('pack_id', packIds)

  if (imagesError) {
    console.error('[v0] Erro ao buscar pack_images para limpeza:', imagesError)
    return NextResponse.json({ error: 'Falha ao buscar imagens' }, { status: 500 })
  }

  // 3) Remove arquivos do Storage (best-effort), agrupados por bucket
  const urls: string[] = []
  for (const p of packs ?? []) if (p.cover_image_url) urls.push(p.cover_image_url)
  for (const img of images ?? []) if (img.image_url) urls.push(img.image_url)

  const byBucket = new Map<string, string[]>()
  for (const url of urls) {
    const parsed = parseStorageUrl(url)
    if (!parsed) continue
    const list = byBucket.get(parsed.bucket) ?? []
    list.push(parsed.path)
    byBucket.set(parsed.bucket, list)
  }

  let removedFiles = 0
  for (const [bucket, paths] of byBucket) {
    // Remove em lotes de 100 para nao exceder limites da API de storage
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100)
      const { error: storageError } = await supabase.storage.from(bucket).remove(chunk)
      if (storageError) {
        console.error('[v0] Aviso: falha ao remover arquivos do storage:', storageError)
      } else {
        removedFiles += chunk.length
      }
    }
  }

  // 4) Remove os registros do banco (imagens primeiro, depois os packs)
  const { error: delImagesError } = await supabase
    .from('pack_images')
    .delete()
    .in('pack_id', packIds)
  if (delImagesError) {
    console.error('[v0] Erro ao excluir pack_images:', delImagesError)
    return NextResponse.json({ error: 'Falha ao excluir imagens do banco' }, { status: 500 })
  }

  const { error: delPacksError } = await supabase.from('packs').delete().in('id', packIds)
  if (delPacksError) {
    console.error('[v0] Erro ao excluir packs:', delPacksError)
    return NextResponse.json({ error: 'Falha ao excluir packs do banco' }, { status: 500 })
  }

  console.log(
    `[v0] Limpeza concluída: ${packIds.length} packs, ${images?.length ?? 0} imagens, ${removedFiles} arquivos (corte: ${cutoffIso})`,
  )

  return NextResponse.json({
    success: true,
    deletedPacks: packIds.length,
    deletedImages: images?.length ?? 0,
    removedFiles,
    cutoff: cutoffIso,
  })
}
