import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/public-site'

const privatePaths = [
  '/api',
  '/accountability',
  '/advisor',
  '/agents',
  '/analytics',
  '/auth',
  '/cases',
  '/context',
  '/controls',
  '/dashboard',
  '/decisions',
  '/digital-twin',
  '/documents',
  '/evidence',
  '/findings',
  '/forgot-password',
  '/libraries',
  '/missions',
  '/my-work',
  '/obligations',
  '/onboarding',
  '/operations',
  '/projects',
  '/readiness',
  '/regulations',
  '/regulatory',
  '/review-center',
  '/risks',
  '/roadmaps',
  '/settings',
  '/sign-in',
  '/sign-up',
  '/situations',
  '/team',
  '/update-password',
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

const publicDiscoveryPaths = [
  '/',
  '/es',
  '/en',
  '/software-cumplimiento-chile',
  '/features/ley-21719',
  '/resources/',
  '/use-cases',
  '/demo',
  '/pricing',
  '/enterprise',
  '/faq',
  '/about',
  '/como-pensamos',
  '/powered-by-n3uralia',
  '/contact',
  '/security',
  '/privacy',
  '/terms',
  '/llms.txt',
  '/llms-full.txt',
  '/kumplio.json',
  '/feed.xml',
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
        allow: publicDiscoveryPaths,
        disallow: privatePaths,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
