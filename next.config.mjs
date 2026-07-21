/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 5,
  },
  staticPageGenerationTimeout: 120,
  allowedDevOrigins: [
    'vm-78e3ge8hc20jbvfj4sutbj03.vusercontent.net',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.kumplio.app' }],
        destination: 'https://kumplio.app/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    const privateRoutes = [
      '/dashboard/:path*',
      '/documents/:path*',
      '/obligations/:path*',
      '/controls/:path*',
      '/evidence/:path*',
      '/findings/:path*',
      '/risks/:path*',
      '/roadmaps/:path*',
      '/projects/:path*',
      '/sales-kit/:path*',
    ]

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      ...privateRoutes.map((source) => ({
        source,
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      })),
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=21600, stale-while-revalidate=43200' },
          { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=21600, stale-while-revalidate=43200' },
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        ],
      },
      {
        source: '/llms.txt',
        headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }],
      },
    ]
  },
  compress: true,
}

export default nextConfig
