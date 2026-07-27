/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Permite que as Server Actions aceitem requisicoes vindas dos dominios de
  // preview do v0/Vercel Sandbox (evita "Invalid Server Actions request").
  allowedDevOrigins: ['*.vusercontent.net', '*.vercel.run'],
  experimental: {
    serverActions: {
      allowedOrigins: ['*.vusercontent.net', '*.vercel.run'],
    },
  },
  // NAO usamos X-Frame-Options/frame-ancestors para "recusar" o iframe.
  // Motivo: quando um app de e-mail/webview abre o link dentro de um iframe,
  // recusar o framing faz o navegador NAO renderizar a pagina (tela em branco /
  // travada) e ainda impede que qualquer script de "fuga" rode. A abordagem
  // correta é PERMITIR o carregamento no iframe e escapar dele via JavaScript
  // (frame-buster no layout), reabrindo o link no contexto de topo (navegador
  // real), onde o app funciona normalmente.
}

export default nextConfig
