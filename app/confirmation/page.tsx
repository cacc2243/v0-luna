import type { Metadata } from 'next'
import { ConfirmationContent } from '@/components/confirmation/confirmation-content'
import { PageBackground } from '@/components/page-background'

export const metadata: Metadata = {
  title: 'Pagamento confirmado · Luna Privé',
  description: 'Seu pagamento foi confirmado e sua conta no Luna Privé já está ativa.',
}

export default function ConfirmationPage() {
  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col items-center bg-background px-5 pb-12 pt-10">
      <div className="fixed inset-0 z-0">
        <PageBackground />
        <div className="absolute inset-0 bg-background/90" aria-hidden="true" />
      </div>
      <ConfirmationContent />
    </main>
  )
}
