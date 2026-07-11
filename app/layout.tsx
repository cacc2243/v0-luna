import type { Metadata, Viewport } from 'next'
import { Manrope, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import { Suspense } from 'react'
import { FbPixel } from '@/components/fb-pixel'
import { AttributionTracker } from '@/components/attribution-tracker'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
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
    default: 'Luna Privé — Crie seu conteúdo',
    template: '%s | Luna Privé',
  },
  description: 'Luna Privé é a plataforma onde você cria o seu conteúdo.',
  applicationName: 'Luna Privé',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Luna Privé',
  },
  keywords: ['criar conteúdo', 'conteúdo digital'],
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
    title: 'Luna Privé — Crie seu conteúdo',
    description: 'A plataforma onde você cria o seu conteúdo.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luna Privé — Crie seu conteúdo',
    description: 'A plataforma onde você cria o seu conteúdo.',
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
    apple: '/icons/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`dark bg-background ${manrope.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        {/*
          Fallback para quando o JavaScript esta BLOQUEADO.
          Alguns apps de e-mail/redes sociais abrem o link dentro de um iframe
          "sandbox" sem a permissao allow-scripts. Nesse modo o navegador bloqueia
          todo o JS (o React nunca inicializa) e a pagina fica visivel porem
          totalmente travada — nenhum toque funciona. Nao existe forma de "religar"
          o JS por codigo, pois a restricao vem do app antes do nosso codigo rodar.
          O <noscript> e a UNICA coisa que o navegador renderiza justamente quando
          o script esta desativado, entao usamos ele para explicar o problema e
          orientar a abrir no navegador real. Em navegadores normais isso nunca
          aparece.
        */}
        <noscript>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              padding: '32px 24px',
              textAlign: 'center',
              backgroundColor: '#0a090c',
              color: '#f5f5f5',
              fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                lineHeight: 1.3,
                color: '#ff4d79',
              }}
            >
              Abra no seu navegador
            </div>
            <p style={{ margin: 0, maxWidth: '340px', fontSize: '15px', lineHeight: 1.6, color: '#d4d4d4' }}>
              Este link foi aberto em um modo restrito do aplicativo, que impede a
              página de funcionar. Para continuar, toque no menu do aplicativo
              (normalmente os três pontinhos <strong>⋮</strong> ou o ícone de
              compartilhar no canto da tela) e escolha{' '}
              <strong>&quot;Abrir no navegador&quot;</strong> (Chrome ou Safari).
            </p>
            <a
              href="https://lunaprive.live/convite"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '4px',
                padding: '14px 28px',
                borderRadius: '9999px',
                backgroundColor: '#ff2d6b',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Abrir a página do convite
            </a>
            <p style={{ margin: 0, fontSize: '13px', color: '#9a9a9a' }}>
              Ou copie e cole este endereço no navegador:
              <br />
              <span style={{ color: '#f5f5f5', fontWeight: 600 }}>lunaprive.live/convite</span>
            </p>
          </div>
        </noscript>
        <Suspense fallback={null}>
          <FbPixel />
          <AttributionTracker />
        </Suspense>
        <ServiceWorkerRegister />
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
