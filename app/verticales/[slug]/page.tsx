import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { withPublicLocale } from '@/lib/i18n/public-routing'
import { isVerticalSlug, VERTICAL_IMAGES, VERTICAL_IMAGE_POSITIONS, VERTICAL_PUBLIC_COPY, VERTICAL_SLUGS } from '@/lib/i18n/vertical-public-copy'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return VERTICAL_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!isVerticalSlug(slug)) return {}
  const { locale } = await getPublicRequestContext()
  const copy = VERTICAL_PUBLIC_COPY[locale][slug]
  return { title: copy.metadataTitle, description: copy.metadataDescription, alternates: { canonical: withPublicLocale(`/verticales/${slug}`, locale) } }
}

export default async function VerticalPage({ params }: Props) {
  const { slug } = await params
  if (!isVerticalSlug(slug)) notFound()
  const { locale } = await getPublicRequestContext()
  const copy = VERTICAL_PUBLIC_COPY[locale][slug]
  const home = withPublicLocale('/', locale)

  return (
    <div className="min-h-screen bg-[#171715] text-[#AAA69C]">
      <header className="border-b border-[#393833] bg-[#171715]/95">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link href={home} aria-label="Kumplio"><Image src="/kumplio-logo-canonical.png" alt="Kumplio" width={455} height={171} priority className="h-auto w-[154px] sm:w-[190px]" /></Link>
          <Button asChild className="rounded-[4px]"><Link href={`${home}#resolver-form`}>{copy.cta}</Link></Button>
        </div>
      </header>
      <main>
        <section className="relative min-h-[650px] overflow-hidden border-b border-[#393833] px-5 py-24 sm:px-8 md:py-32">
          <Image src={VERTICAL_IMAGES[slug]} alt="" fill priority sizes="100vw" style={{ objectPosition: VERTICAL_IMAGE_POSITIONS[slug] }} className="object-cover opacity-30 grayscale-[25%]" />
          <div className="absolute inset-0 bg-[#171715]/45" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#171715_6%,rgba(23,23,21,.91)_48%,rgba(23,23,21,.38)_100%)]" />
          <div className="relative mx-auto max-w-[1280px]">
            <Link href={`${home}#areas`} className="inline-flex items-center gap-2 text-sm text-[#C2A887] hover:text-[#A7C63A]"><ArrowLeft className="h-4 w-4" />{copy.back}</Link>
            <p className="mt-16 text-[11px] font-medium uppercase tracking-[.22em] text-[#B17A4D]">{copy.eyebrow}</p>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-light leading-[1.05] tracking-[-.04em] text-[#C2A887] md:text-7xl">{copy.heroQuestion}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#AAA69C]">{copy.heroSupport}</p>
          </div>
        </section>

        <section className="border-b border-[#393833] px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-[1280px]">
            <p className="text-[11px] uppercase tracking-[.2em] text-[#B17A4D]">{locale === 'es' ? 'Ejemplo operacional' : 'Operational example'}</p>
            <div className="mt-8 grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                <h2 className="text-4xl font-light tracking-[-.03em] text-[#C2A887]">{copy.exampleInput}</h2>
                <p className="mt-8 border-l border-[#B17A4D] pl-5 text-base leading-8 text-[#AAA69C]">{copy.exampleResult}</p>
              </div>
              <ul className="grid gap-0 sm:grid-cols-2">
                {copy.checks.map((item, index) => <li key={item} className="flex gap-3 border-t border-[#393833] py-5 text-base text-[#C2A887] sm:px-5"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#A7C63A]" /><span><small className="mr-2 text-[#747169]">0{index + 1}</small>{item}</span></li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-[#393833] bg-[#20201D] px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-[1280px]">
            <p className="text-[11px] uppercase tracking-[.2em] text-[#B17A4D]">{locale === 'es' ? 'Un mismo núcleo' : 'One shared core'}</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-light text-[#C2A887]">{locale === 'es' ? 'De la entidad a la acción, sin perder la evidencia.' : 'From entity to action, without losing the evidence.'}</h2>
            <ol className="mt-12 grid gap-0 border-y border-[#393833] sm:grid-cols-3 lg:grid-cols-6">
              {copy.workflow.map((step, index) => <li key={step} className="border-b border-[#393833] px-4 py-6 sm:border-r sm:last:border-r-0 lg:border-b-0"><span className="text-[10px] text-[#A7C63A]">0{index + 1}</span><p className="mt-3 text-sm text-[#C2A887]">{step}</p></li>)}
            </ol>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-10 border-y border-[#393833] py-10 md:grid-cols-3">
              {copy.outcomes.map((item, index) => <article key={item.title} className="md:border-r md:border-[#393833] md:pr-10 last:border-r-0"><span className="text-[10px] text-[#B17A4D]">0{index + 1}</span><h3 className="mt-4 text-2xl font-light text-[#C2A887]">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#AAA69C]">{item.description}</p></article>)}
            </div>
            <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-6 text-[#747169]">{copy.note}</p>
            <div className="mt-8 text-center"><Button asChild className="h-12 rounded-[4px] px-6"><Link href={`${home}#resolver-form`}>{copy.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
