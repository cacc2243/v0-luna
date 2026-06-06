import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Apenas as rotas autenticadas precisam atualizar a sessao no servidor.
  // As paginas publicas (home, /convite) nao chamam o Supabase no middleware,
  // evitando uma ida-e-volta de rede em cada navegacao e deixando o site rapido.
  matcher: ['/minha-conta/:path*', '/painel/:path*'],
}
