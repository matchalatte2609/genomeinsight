/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/gateway/:path*',
        destination: 'http://localhost:3001/:path*',
      },
      {
        source: '/api/files/:path*',
        destination: 'http://localhost:8002/:path*',
      },
    ]
  },
}

module.exports = nextConfig