'use server'

import { revalidatePath } from 'next/cache'
import {
  checkCredentials,
  createAdminSession,
  destroyAdminSession,
} from '@/lib/admin-auth'

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const username = String(formData.get('username') || '').trim()
  const password = String(formData.get('password') || '')

  if (!checkCredentials(username, password)) {
    return { error: 'Usuário ou senha incorretos.' }
  }

  await createAdminSession()
  revalidatePath('/painel')
  return { success: true }
}

export async function logoutAction() {
  await destroyAdminSession()
  revalidatePath('/painel')
}
