import { isAdminAuthenticated } from '@/lib/admin-auth'
import { AdminLogin } from '@/components/painel/admin-login'
import { AdminDashboard } from '@/components/painel/admin-dashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Painel Admin · Luna Privé',
  robots: { index: false, follow: false },
  // Instalar o PWA a partir do painel salva um atalho que abre no /painel.
  manifest: '/painel.webmanifest',
}

export default async function PainelPage() {
  const authenticated = await isAdminAuthenticated()

  if (!authenticated) {
    return <AdminLogin />
  }

  return <AdminDashboard />
}
