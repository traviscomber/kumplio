import type { MetadataRoute } from 'next'
import { chileComplianceGuides } from '@/lib/chile-compliance-content'
import { withPublicLocale } from '@/lib/i18n/public-routing'
import { SITE_URL } from '@/lib/public-site'

// Google recomienda que lastModified represente cambios sustantivos reales.
const publicUpdatedAt = new Date('2026-08-14T09:54:00-04:00')
const legalUpdatedAt = new Date('2026-08-03T12:00:00-04:00')

function publicUrl(pathname: string) {
  return `${SITE_URL}${withPublicLocale(pathname, 'es')}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  // English remains intentionally excluded while /en carries a temporary noindex.
  // It will be added only after the English public copy passes content and claim review.
  const core: MetadataRoute.Sitemap = [
    { url: publicUrl('/'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 1 },
    { url: publicUrl('/software-cumplimiento-chile'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: publicUrl('/features/ley-21719'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: publicUrl('/resources/ley-21719'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.92 },
    { url: publicUrl('/resources/cumplimiento-normativo'), lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.82 },
    { url: publicUrl('/use-cases'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.82 },
    { url: publicUrl('/pricing'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: publicUrl('/enterprise'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.76 },
    { url: publicUrl('/demo'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.72 },
    { url: publicUrl('/faq'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.78 },
    { url: publicUrl('/about'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.7 },
    { url: publicUrl('/como-pensamos'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.7 },
    { url: publicUrl('/powered-by-n3uralia'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.68 },
    { url: publicUrl('/contact'), lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.62 },
    { url: publicUrl('/security'), lastModified: legalUpdatedAt, changeFrequency: 'monthly', priority: 0.55 },
    { url: publicUrl('/privacy'), lastModified: legalUpdatedAt, changeFrequency: 'yearly', priority: 0.4 },
    { url: publicUrl('/terms'), lastModified: legalUpdatedAt, changeFrequency: 'yearly', priority: 0.4 },
  ]

  const guides: MetadataRoute.Sitemap = chileComplianceGuides.map((guide) => ({
    url: publicUrl(`/resources/ley-21719/${guide.slug}`),
    lastModified: publicUpdatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...core, ...guides]
}
