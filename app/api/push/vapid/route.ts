import { NextResponse } from 'next/server'
import { getVapidPublicKey, isPushConfigured } from '@/lib/push/web-push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// A chave VAPID publica e, por definicao, publica (vai embutida no cliente ao
// se inscrever). Nao exige sessao: em PWA instalado no iOS o cookie de sessao
// pode nao ser enviado neste fetch. A inscricao (subscribe) continua protegida.
export async function GET() {
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: getVapidPublicKey(),
  })
}
