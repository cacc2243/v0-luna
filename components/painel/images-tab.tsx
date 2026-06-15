'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Search,
  Trash2,
  Loader2,
  ImageOff,
  Clock,
  UserRound,
  Mail,
  X,
  ImageIcon,
  ShieldAlert,
  Package,
} from 'lucide-react'
import type { AdminImage } from '@/app/api/admin/images/route'
import { formatDateTime } from '@/lib/painel/metrics'
import { cn } from '@/lib/utils'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) {
    const err = new Error('fetch_failed') as Error & { status?: number }
    err.status = r.status
    throw err
  }
  const json = await r.json()
  if (json?.error) throw new Error(json.error)
  return json
}

type ImageFilter = 'all' | 'cover' | 'pack_image'

interface PackGroup {
  packId: string
  packTitle: string | null
  ownerName: string | null
  ownerUsername: string | null
  ownerEmail: string | null
  images: AdminImage[]
  latestAt: string
  postedAt: string
}

export function ImagesTab() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ImageFilter>('all')
  const [preview, setPreview] = useState<AdminImage | null>(null)
  const [toDelete, setToDelete] = useState<AdminImage | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<{
    images: AdminImage[]
    fetchedAt: string
  }>('/api/admin/images', fetcher, {
    refreshInterval: 15000,
    keepPreviousData: true,
  })

  const images = data?.images || []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return images.filter((img) => {
      if (filter !== 'all' && img.type !== filter) return false
      if (!q) return true
      return (
        (img.ownerEmail || '').toLowerCase().includes(q) ||
        (img.ownerUsername || '').toLowerCase().includes(q) ||
        (img.ownerName || '').toLowerCase().includes(q) ||
        (img.packTitle || '').toLowerCase().includes(q)
      )
    })
  }, [images, query, filter])

  // Agrupa as imagens por pack — cada grupo vira uma "linha" com todas as imagens do pack
  const groups = useMemo(() => {
    const map = new Map<string, PackGroup>()
    for (const img of filtered) {
      const groupKey = img.packId || `sem-pack:${img.key}`
      let g = map.get(groupKey)
      if (!g) {
        g = {
          packId: groupKey,
          packTitle: img.packTitle,
          ownerName: img.ownerName,
          ownerUsername: img.ownerUsername,
          ownerEmail: img.ownerEmail,
          images: [],
          latestAt: img.createdAt,
          postedAt: img.createdAt,
        }
        map.set(groupKey, g)
      }
      g.images.push(img)
      if (new Date(img.createdAt).getTime() > new Date(g.latestAt).getTime()) {
        g.latestAt = img.createdAt
      }
      // postedAt = momento em que o pack foi postado (imagem mais antiga do grupo)
      if (new Date(img.createdAt).getTime() < new Date(g.postedAt).getTime()) {
        g.postedAt = img.createdAt
      }
    }
    const list = Array.from(map.values())
    // Dentro de cada pack: capa primeiro, depois mais recentes
    for (const g of list) {
      g.images.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'cover' ? -1 : 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }
    // Packs com a imagem mais recente primeiro
    list.sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime())
    return list
  }, [filtered])

  const coverCount = images.filter((i) => i.type === 'cover').length
  const packImgCount = images.filter((i) => i.type === 'pack_image').length

  const FILTERS: { key: ImageFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: images.length },
    { key: 'cover', label: 'Capas', count: coverCount },
    { key: 'pack_image', label: 'Imagens dos packs', count: packImgCount },
  ]

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    // Otimista: remove da lista imediatamente
    const removedKey = toDelete.key
    mutate(
      (current) =>
        current
          ? { ...current, images: current.images.filter((i) => i.key !== removedKey) }
          : current,
      { revalidate: false },
    )
    try {
      const res = await fetch('/api/admin/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: toDelete.type,
          rowId: toDelete.rowId,
          imageUrl: toDelete.imageUrl,
        }),
      })
      if (!res.ok) throw new Error('delete_failed')
    } catch {
      // Reverte revalidando do servidor em caso de erro
      mutate()
    } finally {
      setDeleting(false)
      setToDelete(null)
      // Confirma estado real com o servidor
      mutate()
    }
  }

  const sessionExpired = (error as (Error & { status?: number }) | undefined)?.status === 401

  return (
    <div className="flex flex-col gap-4">
      {/* Busca */}
      <div className="flex items-center rounded-xl border border-border bg-card px-3 focus-within:border-primary/60">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por email, usuária ou pack..."
          className="w-full bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition',
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
            <span
              className={cn(
                'rounded-full px-1.5 text-xs tabular-nums',
                filter === f.key ? 'bg-primary-foreground/20' : 'bg-secondary',
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Conteudo */}
      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Carregando imagens...</p>
        </div>
      ) : sessionExpired ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <ShieldAlert className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sessão expirada. Faça login novamente.
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <ImageOff className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Erro ao carregar as imagens.</p>
          <button
            onClick={() => mutate()}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Tentar novamente
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <ImageIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma imagem encontrada.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {groups.length} pack{groups.length === 1 ? '' : 's'} · {filtered.length} imagem
            {filtered.length === 1 ? '' : 's'}
          </p>
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <PackRow
                key={group.packId}
                group={group}
                onView={(img) => setPreview(img)}
                onDelete={(img) => setToDelete(img)}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal de visualizacao */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              aria-label="Fechar"
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur transition hover:bg-background"
            >
              <X className="size-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.imageUrl || '/placeholder.svg'}
              alt={preview.packTitle || 'Imagem'}
              className="max-h-[55dvh] w-full bg-background object-contain"
              crossOrigin="anonymous"
            />
            <div className="flex flex-col gap-3 p-5">
              <OwnerInfo image={preview} />
              <button
                onClick={() => {
                  setToDelete(preview)
                  setPreview(null)
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-destructive/90 px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive"
              >
                <Trash2 className="size-4" />
                Excluir imagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmacao de exclusao */}
      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15">
                <Trash2 className="size-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Excluir imagem?</h3>
                <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {toDelete.type === 'cover'
                ? 'A capa será removida do pack e do armazenamento.'
                : 'A imagem será removida do pack e do armazenamento.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PackRow({
  group,
  onView,
  onDelete,
}: {
  group: PackGroup
  onView: (img: AdminImage) => void
  onDelete: (img: AdminImage) => void
}) {
  const name = group.ownerName || group.ownerUsername || 'Sem nome'
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Cabecalho do pack */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Package className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-foreground">
              {group.packTitle || 'Pack sem título'}
            </h3>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <UserRound className="size-3 shrink-0" />
              {name}
              {group.ownerUsername ? ` · @${group.ownerUsername}` : ''}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground/80">
              <Clock className="size-3 shrink-0" />
              Postado em {formatDateTime(group.postedAt)}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {group.images.length} imagem{group.images.length === 1 ? '' : 's'}
        </span>
      </header>

      {/* Email do dono, se houver */}
      {group.ownerEmail && (
        <div className="flex items-center gap-1 border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <Mail className="size-3 shrink-0" />
          <span className="truncate">{group.ownerEmail}</span>
        </div>
      )}

      {/* Imagens do pack */}
      <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-6">
        {group.images.map((img) => (
          <PackImageThumb
            key={img.key}
            image={img}
            onView={() => onView(img)}
            onDelete={() => onDelete(img)}
          />
        ))}
      </div>
    </section>
  )
}

function PackImageThumb({
  image,
  onView,
  onDelete,
}: {
  image: AdminImage
  onView: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-background">
      <button onClick={onView} className="relative block aspect-square w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.imageUrl || '/placeholder.svg'}
          alt={image.packTitle || 'Imagem do pack'}
          className="size-full object-cover transition group-hover:scale-105"
          loading="lazy"
          crossOrigin="anonymous"
        />
        <span
          className={cn(
            'absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide backdrop-blur',
            image.type === 'cover'
              ? 'bg-primary/80 text-primary-foreground'
              : 'bg-background/70 text-foreground',
          )}
        >
          {image.type === 'cover' ? 'Capa' : 'Pack'}
        </span>
      </button>
      <button
        onClick={onDelete}
        aria-label="Excluir imagem"
        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-md bg-background/70 text-destructive opacity-0 backdrop-blur transition hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

function OwnerInfo({ image, compact }: { image: AdminImage; compact?: boolean }) {
  const name = image.ownerName || image.ownerUsername || 'Sem nome'
  return (
    <div className="flex flex-col gap-1 text-left">
      {image.packTitle && (
        <p className={cn('truncate font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>
          {image.packTitle}
        </p>
      )}
      <p
        className={cn(
          'flex items-center gap-1 truncate text-muted-foreground',
          compact ? 'text-[0.7rem]' : 'text-sm',
        )}
      >
        <UserRound className="size-3 shrink-0" />
        {name}
        {image.ownerUsername ? ` · @${image.ownerUsername}` : ''}
      </p>
      {image.ownerEmail && (
        <p
          className={cn(
            'flex items-center gap-1 truncate text-muted-foreground',
            compact ? 'text-[0.7rem]' : 'text-sm',
          )}
        >
          <Mail className="size-3 shrink-0" />
          {image.ownerEmail}
        </p>
      )}
      <p
        className={cn(
          'flex items-center gap-1 truncate text-muted-foreground/80',
          compact ? 'text-[0.7rem]' : 'text-xs',
        )}
      >
        <Clock className="size-3 shrink-0" />
        {formatDateTime(image.createdAt)}
      </p>
    </div>
  )
}
