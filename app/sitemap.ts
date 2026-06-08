import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://kumplio.app'
  const now = new Date()
  
  const routes: MetadataRoute.Sitemap = [
    // Core Pages
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    
    // Features Section
    {
      url: `${baseUrl}/features/ley-21719`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/features/documento-intelligence`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/compliance-matrix`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/risk-quantification`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/features/automation`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    
    // Resources Section
    {
      url: `${baseUrl}/resources/ley-21719-guia`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/resources/cumplimiento-normativo`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources/templates`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/resources/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resources/webinars`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    
    // Demo Pages - Industry Specific
    {
      url: `${baseUrl}/demo/transporte`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/demo/mineria`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/demo/manufactura`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/demo/retail`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/demo/fintech`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    
    // Company Section
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/press`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    
    // Product Section
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/enterprise`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/integrations`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    
    // Blog Section
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/compliance-tips`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/industry-news`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/case-studies`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    
    // Regional Pages (Chile Coverage)
    {
      url: `${baseUrl}/regiones/santiago`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/regiones/valparaiso`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${baseUrl}/regiones/concepcion`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${baseUrl}/regiones/antofagasta`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    
    // Legal Pages
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/compliance-statement`,
      lastModified: now,
      changeFrequency: 'quarterly',
      priority: 0.6,
    },
    
    // Support & Contact
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.65,
    },
    {
      url: `${baseUrl}/help-center`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.65,
    },
  ]
  
  return routes
}
