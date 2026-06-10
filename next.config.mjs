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
}

export default nextConfig
