import type { MetadataRoute } from 'next'
import { chileComplianceGuides } from '@/lib/chile-compliance-content'
import { withPublicLocale } from '@/lib/i18n/public-routing'
import { SITE_URL } from '@/lib/public-site'

// Google recomienda que lastModified represente cambios sustantivos reales.
const publicUpdatedAt = new Date('2026-08-14T09:54:00-04:00')
const legalUpdatedAt = new Date('2026-08-03T12:00:00-04:00')

function localizedHome(locale: 'es' | 'en') {
  return `${SITE_URL}${withPublicLocale('/', locale)}`
}

function currentPublicUrl(pathname: string) {
  return `${SITE_URL}${pathname}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Locale migration is route-by-route. Only the reviewed home is published under
  // both locale prefixes; every other page keeps its existing canonical URL until
  // its own copy, metadata, links and discovery behavior are migrated together.
  const core: MetadataRoute.Sitemap = [
    { url: localizedHome('es'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 1 },
    { url: localizedHome('en'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.9 },
    { url: currentPublicUrl('/software-cumplimiento-chile'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: currentPublicUrl('/features/ley-21719'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: currentPublicUrl('/resources/ley-21719'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.92 },
    { url: currentPublicUrl('/resources/cumplimiento-normativo'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.82 },
    { url: currentPublicUrl('/use-cases'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.82 },
    { url: currentPublicUrl('/pricing'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: currentPublicUrl('/enterprise'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.76 },
    { url: currentPublicUrl('/demo'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.72 },
    { url: currentPublicUrl('/faq'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.78 },
    { url: currentPublicUrl('/about'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.7 },
    { url: currentPublicUrl('/como-pensamos'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.7 },
    { url: currentPublicUrl('/powered-by-n3uralia'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.68 },
    { url: currentPublicUrl('/contact'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.62 },
    { url: currentPublicUrl('/security'), lastModified: legalUpdatedAt, changeFrequency: 'monthly', priority: 0.55 },
    { url: currentPublicUrl('/privacy'), lastModified: legalUpdatedAt, changeFrequency: 'yearly', priority: 0.4 },
    { url: currentPublicUrl('/terms'), lastModified: legalUpdatedAt, changeFrequency: 'yearly', priority: 0.4 },
  ]

  const guides: MetadataRoute.Sitemap = chileComplianceGuides.map((guide) => ({
    url: currentPublicUrl(`/resources/ley-21719/${guide.slug}`),
    lastModified: publicUpdatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...core, ...guides]
}
