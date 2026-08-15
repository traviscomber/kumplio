import type { MetadataRoute } from 'next'
import { chileComplianceGuides } from '@/lib/chile-compliance-content'
import { withPublicLocale, type PublicLocale } from '@/lib/i18n/public-routing'
import { SITE_URL } from '@/lib/public-site'

// Google recomienda que lastModified represente cambios sustantivos reales.
const publicUpdatedAt = new Date('2026-08-15T12:00:00-04:00')
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
  lastModified = publicUpdatedAt,
): MetadataRoute.Sitemap {
  return [
    { url: localizedUrl(pathname, 'es'), lastModified, changeFrequency, priority: priorityEs },
    { url: localizedUrl(pathname, 'en'), lastModified, changeFrequency, priority: priorityEn },
  ]
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Locale migration is route-by-route. Only reviewed pages are published under
  // both locale prefixes; the rest keep their existing canonical URL until their
  // copy, metadata, links and discovery behavior are migrated together.
  const localized: MetadataRoute.Sitemap = [
    ...localizedPair('/', 'weekly', 1, 0.9),
    ...localizedPair('/demo', 'monthly', 0.86, 0.78),
    ...localizedPair('/pricing', 'monthly', 0.8, 0.72),
    ...localizedPair('/faq', 'monthly', 0.78, 0.7),
    ...localizedPair('/contact', 'monthly', 0.62, 0.56),
    ...localizedPair('/about', 'monthly', 0.7, 0.63),
    ...localizedPair('/como-pensamos', 'monthly', 0.7, 0.63),
    ...localizedPair('/powered-by-n3uralia', 'monthly', 0.68, 0.61),
    ...localizedPair('/security', 'monthly', 0.55, 0.5, legalUpdatedAt),
    ...localizedPair('/privacy', 'yearly', 0.4, 0.36, legalUpdatedAt),
    ...localizedPair('/terms', 'yearly', 0.4, 0.36, legalUpdatedAt),
  ]

  const current: MetadataRoute.Sitemap = [
    { url: currentPublicUrl('/software-cumplimiento-chile'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: currentPublicUrl('/features/ley-21719'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: currentPublicUrl('/resources/ley-21719'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.92 },
    { url: currentPublicUrl('/resources/cumplimiento-normativo'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.82 },
    { url: currentPublicUrl('/use-cases'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.82 },
    { url: currentPublicUrl('/enterprise'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.76 },
  ]

  const guides: MetadataRoute.Sitemap = chileComplianceGuides.map((guide) => ({
    url: currentPublicUrl(`/resources/ley-21719/${guide.slug}`),
    lastModified: publicUpdatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...localized, ...current, ...guides]
}
