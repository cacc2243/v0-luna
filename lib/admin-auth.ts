import { cookies } from 'next/headers'
import { createHmac } from 'crypto'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = '080881'
const COOKIE_NAME = 'luna_admin_session'

// Segredo para assinar o cookie de sessao
const SECRET =
  process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'luna-prive-admin-secret'

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('hex')
}

function makeToken(): string {
  const payload = `admin:${Date.now()}`
  return `${payload}.${sign(payload)}`
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false
  const idx = token.lastIndexOf('.')
  if (idx === -1) return false
  const payload = token.slice(0, idx)
  const signature = token.slice(idx + 1)
  if (!payload.startsWith('admin:')) return false
  return sign(payload) === signature
}

export function checkCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export async function createAdminSession() {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 horas
  })
}

export async function destroyAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return verifyToken(token)
}
