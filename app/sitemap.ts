import type { MetadataRoute } from 'next'

const baseUrl = 'https://kumplio.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/features/ley-21719`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/enterprise`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/use-cases`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/demo`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/resources/cumplimiento-normativo`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/security`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
  ]
}
