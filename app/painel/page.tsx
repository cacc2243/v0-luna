import { isAdminAuthenticated } from '@/lib/admin-auth'
import { AdminLogin } from '@/components/painel/admin-login'
import { AdminDashboard } from '@/components/painel/admin-dashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Painel Admin · Luna Privé',
  robots: { index: false, follow: false },
}

export default async function PainelPage() {
  const authenticated = await isAdminAuthenticated()

  if (!authenticated) {
    return <AdminLogin />
  }

  return <AdminDashboard />
}
