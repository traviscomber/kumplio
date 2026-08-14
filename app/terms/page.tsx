import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { TERMS_PUBLIC_COPY } from '@/lib/i18n/legal-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = TERMS_PUBLIC_COPY[locale]
  const canonical = withPublicLocale('/terms', locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale('/terms', 'es'),
        en: withPublicLocale('/terms', 'en'),
        'x-default': withPublicLocale('/terms', 'es'),
      },
    },
  }
}

export default async function TermsPage() {
  const { locale } = await getPublicRequestContext()
  const copy = TERMS_PUBLIC_COPY[locale]
  const homeHref = getPublicSiteHref('/', locale)
  const contactHref = getPublicSiteHref('/contact', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateHref = withPublicLocale('/terms', alternateLocale)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href={homeHref} className="font-extrabold tracking-[0.18em]">KUMPLIO</Link>
          <div className="flex items-center gap-3">
            <Link href={alternateHref} hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">{copy.nav.switchLanguage}</Link>
            <Link href={contactHref} className="text-sm font-semibold text-primary hover:underline">{copy.nav.contact}</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{copy.hero.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{copy.hero.title}</h1>
            <p className="mt-5 text-muted-foreground">{copy.hero.updatedLabel}: {copy.hero.updatedAt}</p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl space-y-10 leading-7 text-muted-foreground">
            {copy.sections.map((section, index) => {
              if (index === 14) {
                return (
                  <LegalSection key={section.title} title={section.title}>
                    {copy.contactBefore}{' '}
                    <a href="mailto:info@kumplio.app" className="font-semibold text-primary hover:underline">info@kumplio.app</a>.
                  </LegalSection>
                )
              }

              return <LegalSection key={section.title} title={section.title}>{section.body}</LegalSection>
            })}
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
