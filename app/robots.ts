import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/public-site'

const privatePaths = [
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
]

const discoveryAgents = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      ...discoveryAgents.map((userAgent) => ({
        userAgent,
        allow: [
          '/',
          '/software-cumplimiento-chile',
          '/features/ley-21719',
          '/resources/',
          '/use-cases',
          '/demo',
          '/pricing',
          '/enterprise',
          '/faq',
          '/about',
          '/powered-by-n3uralia',
          '/security',
          '/privacy',
          '/terms',
          '/llms.txt',
          '/llms-full.txt',
          '/kumplio.json',
          '/feed.xml',
        ],
        disallow: privatePaths,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
