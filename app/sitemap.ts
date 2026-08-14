import type { MetadataRoute } from 'next'
import { chileComplianceGuides } from '@/lib/chile-compliance-content'
import { withPublicLocale, type PublicLocale } from '@/lib/i18n/public-routing'
import { SITE_URL } from '@/lib/public-site'

// Google recomienda que lastModified represente cambios sustantivos reales.
const publicUpdatedAt = new Date('2026-08-14T09:54:00-04:00')
const legalUpdatedAt = new Date('2026-08-03T12:00:00-04:00')

function localizedUrl(pathname: string, locale: PublicLocale) {
  return `${SITE_URL}${withPublicLocale(pathname, locale)}`
}

function currentPublicUrl(pathname: string) {
  return `${SITE_URL}${pathname}`
}

function localizedPair(
  pathname: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priorityEs: number,
  priorityEn: number,
): MetadataRoute.Sitemap {
  return [
    { url: localizedUrl(pathname, 'es'), lastModified: publicUpdatedAt, changeFrequency, priority: priorityEs },
    { url: localizedUrl(pathname, 'en'), lastModified: publicUpdatedAt, changeFrequency, priority: priorityEn },
  ]
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Locale migration is route-by-route. Only reviewed pages are published under
  // both locale prefixes; the rest keep their existing canonical URL until their
  // copy, metadata, links and discovery behavior are migrated together.
  const localized: MetadataRoute.Sitemap = [
    ...localizedPair('/', 'weekly', 1, 0.9),
    ...localizedPair('/pricing', 'monthly', 0.8, 0.72),
    ...localizedPair('/faq', 'monthly', 0.78, 0.7),
    ...localizedPair('/contact', 'monthly', 0.62, 0.56),
  ]

  const current: MetadataRoute.Sitemap = [
    { url: currentPublicUrl('/software-cumplimiento-chile'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: currentPublicUrl('/features/ley-21719'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: currentPublicUrl('/resources/ley-21719'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.92 },
    { url: currentPublicUrl('/resources/cumplimiento-normativo'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.82 },
    { url: currentPublicUrl('/use-cases'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.82 },
    { url: currentPublicUrl('/enterprise'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.76 },
    { url: currentPublicUrl('/demo'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.72 },
    { url: currentPublicUrl('/about'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.7 },
    { url: currentPublicUrl('/como-pensamos'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.7 },
    { url: currentPublicUrl('/powered-by-n3uralia'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.68 },
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

  return [...localized, ...current, ...guides]
}
