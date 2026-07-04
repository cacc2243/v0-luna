import type { Metadata, Viewport } from 'next'
import { Manrope, Playfair_Display } from 'next/font/google'
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

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-playfair',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://lunaprive.com'),
  title: {
    default: 'Luna Privé — Plataforma para criadores de conteúdo',
    template: '%s | Luna Privé',
  },
  description:
    'Luna Privé é a plataforma onde criadores publicam seu conteúdo, definem seus preços e recebem pagamentos de forma simples, rápida e segura.',
  applicationName: 'Luna Privé',
  keywords: [
    'plataforma para criadores',
    'monetização de conteúdo',
    'criadores de conteúdo',
    'renda digital',
    'pagamentos online',
  ],
  category: 'business',
  generator: 'v0.app',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Luna Privé',
    title: 'Luna Privé — Plataforma para criadores de conteúdo',
    description:
      'Publique seu conteúdo, defina seus preços e receba pagamentos de forma simples, rápida e segura com a Luna Privé.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luna Privé — Plataforma para criadores de conteúdo',
    description:
      'Publique seu conteúdo, defina seus preços e receba pagamentos de forma simples, rápida e segura.',
  },
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
    <html lang="pt-BR" className={`dark bg-background ${manrope.variable} ${playfair.variable}`}>
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
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "xgevas2sl3");`}
        </Script>
      </body>
    </html>
  )
}
