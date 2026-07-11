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
  // Impede que o site seja carregado dentro de um <iframe> de terceiros.
  // Alguns apps de e-mail/webviews abrem o link em um iframe "sandbox" sem a
  // permissao 'allow-scripts', o que BLOQUEIA todo o JavaScript da pagina — por
  // isso o modal do /convite ficava totalmente travado (nada de toque, nada de
  // animacao) quando aberto pelo link do e-mail, mas funcionava ao copiar o
  // link para uma aba normal. Com estes cabecalhos o navegador se recusa a
  // renderizar a pagina dentro do iframe e o app abre o link no navegador real,
  // onde o JS roda normalmente.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none';" },
        ],
      },
    ]
  },
}

export default nextConfig
