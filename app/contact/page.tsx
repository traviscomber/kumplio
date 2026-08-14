import type { Metadata } from 'next'
import { ContactPageContent } from '@/components/marketing/contact-page-content'
import { CONTACT_PUBLIC_COPY } from '@/lib/i18n/contact-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { withPublicLocale } from '@/lib/i18n/public-routing'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = CONTACT_PUBLIC_COPY[locale]
  const canonical = withPublicLocale('/contact', locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/contact', 'es'),
        en: withPublicLocale('/contact', 'en'),
        'x-default': withPublicLocale('/contact', 'es'),
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: copy.metadata.title,
      description: copy.metadata.description,
    },
  }
}

export default async function ContactPage() {
  const { locale } = await getPublicRequestContext()
  return <ContactPageContent locale={locale} />
}
