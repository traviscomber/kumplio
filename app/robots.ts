import type { MetadataRoute } from 'next'

const baseUrl = 'https://kumplio.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/agents/',
        '/analytics/',
        '/auth/',
        '/cases/',
        '/dashboard/',
        '/documents/',
        '/forgot-password/',
        '/missions/',
        '/onboarding/',
        '/settings/',
        '/sign-in/',
        '/sign-up/',
        '/update-password/',
        '/sales-kit/',
        '/demo/transporte/',
        '/demo/mineria/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
