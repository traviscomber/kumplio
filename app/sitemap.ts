import type { MetadataRoute } from 'next'
import { chileComplianceGuides } from '@/lib/chile-compliance-content'
import { SITE_URL } from '@/lib/public-site'

// Google recomienda que lastModified represente cambios sustantivos reales.
const publicUpdatedAt = new Date('2026-08-09T11:15:00-04:00')
const legalUpdatedAt = new Date('2026-08-03T12:00:00-04:00')

export default function sitemap(): MetadataRoute.Sitemap {
  const core: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/software-cumplimiento-chile`, lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${SITE_URL}/features/ley-21719`, lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${SITE_URL}/resources/ley-21719`, lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.92 },
    { url: `${SITE_URL}/resources/cumplimiento-normativo`, lastModified: publicUpdatedAt, changeFrequency: 'weekly', priority: 0.82 },
    { url: `${SITE_URL}/use-cases`, lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.82 },
    { url: `${SITE_URL}/pricing`, lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/enterprise`, lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.76 },
    { url: `${SITE_URL}/demo`, lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.72 },
    { url: `${SITE_URL}/faq`, lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.78 },
    { url: `${SITE_URL}/about`, lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/como-pensamos`, lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/powered-by-n3uralia`, lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.68 },
    { url: `${SITE_URL}/contact`, lastModified: publicUpdatedAt, changeFrequency: 'monthly', priority: 0.62 },
    { url: `${SITE_URL}/security`, lastModified: legalUpdatedAt, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${SITE_URL}/privacy`, lastModified: legalUpdatedAt, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/terms`, lastModified: legalUpdatedAt, changeFrequency: 'yearly', priority: 0.4 },
  ]

  const guides: MetadataRoute.Sitemap = chileComplianceGuides.map((guide) => ({
    url: `${SITE_URL}/resources/ley-21719/${guide.slug}`,
    lastModified: publicUpdatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...core, ...guides]
}
