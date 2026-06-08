import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Suspense } from 'react'
import { FbPixel } from '@/components/fb-pixel'
import { AttributionTracker } from '@/components/attribution-tracker'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
}

export const metadata: Metadata = {
  title: 'Luna Privé — Ganhe com seus pés, 100% anônimo',
  description:
    'Mais de R$ 18.000,00 todo mês apenas com seus pés. 100% anônimo, sem mostrar rostos ou identidade real.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`dark bg-background ${manrope.variable}`}>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <FbPixel />
          <AttributionTracker />
        </Suspense>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        <Script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck
          data-utmify-prevent-subids
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
