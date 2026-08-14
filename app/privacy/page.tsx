import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { PRIVACY_PUBLIC_COPY } from '@/lib/i18n/legal-public-copy'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { getPublicSiteHref, withPublicLocale } from '@/lib/i18n/public-routing'
import { PRIVACY_NOTICE } from '@/lib/privacy/notice'

const noticeMetadata = { canonical: PRIVACY_NOTICE.route }

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPublicRequestContext()
  const copy = PRIVACY_PUBLIC_COPY[locale]
  const canonical = withPublicLocale(noticeMetadata.canonical, locale)

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: {
      canonical,
      languages: {
        'es-CL': withPublicLocale(PRIVACY_NOTICE.route, 'es'),
        en: withPublicLocale(PRIVACY_NOTICE.route, 'en'),
        'x-default': withPublicLocale(PRIVACY_NOTICE.route, 'es'),
      },
    },
  }
}

export default async function PrivacyPage() {
  const { locale } = await getPublicRequestContext()
  const copy = PRIVACY_PUBLIC_COPY[locale]
  const homeHref = getPublicSiteHref('/', locale)
  const contactHref = getPublicSiteHref('/contact', locale)
  const securityHref = getPublicSiteHref('/security', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateHref = withPublicLocale(PRIVACY_NOTICE.route, alternateLocale)

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
            <p className="mt-5 text-muted-foreground">
              {locale === 'es' ? (
                <>{copy.hero.updatedLabel}: {copy.hero.updatedAt} · versión {PRIVACY_NOTICE.version}</>
              ) : (
                <>{copy.hero.updatedLabel}: {copy.hero.updatedAt} · version {PRIVACY_NOTICE.version}</>
              )}
            </p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl space-y-10 leading-7 text-muted-foreground">
            {copy.sections.map((section, index) => {
              if (index === 7) {
                return (
                  <LegalSection key={section.title} title={section.title}>
                    {section.body}{' '}
                    {locale === 'es' ? 'Más información está disponible en nuestra' : 'More information is available on our'}{' '}
                    <Link href={securityHref} className="font-semibold text-primary hover:underline">{copy.securityLinkLabel}</Link>.
                  </LegalSection>
                )
              }

              if (index === 11) {
                return (
                  <LegalSection key={section.title} title={section.title}>
                    {copy.contactBefore}{' '}
                    <a href={`mailto:${PRIVACY_NOTICE.contact}`} className="font-semibold text-primary hover:underline">{PRIVACY_NOTICE.contact}</a>
                    {copy.contactAfter}
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
