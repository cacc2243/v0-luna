import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface PackRow {
  id: string
  user_id: string | null
  title: string | null
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
  balance: number | null
}

export interface AdminImage {
  // id sintetico: `${type}:${rowId}` para acoes de exclusao
  key: string
  type: 'cover' | 'pack_image'
  rowId: string // id da pack_image OU id do pack (para a capa)
  packId: string | null
  packTitle: string | null
  imageUrl: string
  isPreview: boolean
  createdAt: string
  ownerId: string | null
  ownerName: string | null
  ownerUsername: string | null
  ownerEmail: string | null
  ownerBalance: number | null
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const [packsRes, packImagesRes, profilesRes] = await Promise.all([
    supabase
      .from('packs')
      .select('id, user_id, title, cover_image_url, is_published, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('pack_images')
      .select('id, pack_id, image_url, is_preview, order_index, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, username, display_name, balance'),
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

  // Mapa de emails (auth.users) — paginado
  const emailMap = new Map<string, string>()
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
      for (const u of users) if (u.email) emailMap.set(u.id, u.email)
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
      imageUrl: pk.cover_image_url,
      isPreview: true,
      createdAt: pk.created_at,
      ownerId: pk.user_id,
      ownerName: prof?.display_name || null,
      ownerUsername: prof?.username || null,
      ownerEmail: pk.user_id ? emailMap.get(pk.user_id) || null : null,
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
      imageUrl: img.image_url,
      isPreview: !!img.is_preview,
      createdAt: img.created_at,
      ownerId,
      ownerName: prof?.display_name || null,
      ownerUsername: prof?.username || null,
      ownerEmail: ownerId ? emailMap.get(ownerId) || null : null,
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
