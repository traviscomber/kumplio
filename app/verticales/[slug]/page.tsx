import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { getPublicRequestContext } from '@/lib/i18n/request-context'
import { withPublicLocale } from '@/lib/i18n/public-routing'
import { isVerticalSlug, VERTICAL_PUBLIC_COPY, VERTICAL_SLUGS } from '@/lib/i18n/vertical-public-copy'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return VERTICAL_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!isVerticalSlug(slug)) return {}
  const copy = VERTICAL_PUBLIC_COPY.es[slug]
  return { title: `${copy.name} | Kumplio`, description: copy.description, alternates: { canonical: `/verticales/${slug}` } }
}

export default async function VerticalPage({ params }: Props) {
  const { slug } = await params
  if (!isVerticalSlug(slug)) notFound()
  const { locale } = await getPublicRequestContext()
  const copy = VERTICAL_PUBLIC_COPY[locale][slug]
  const home = withPublicLocale('/', locale)

  return (
    <div className="min-h-screen bg-[#151513] text-[#C2A887]">
      <header className="border-b border-white/10 bg-[#151513]/95">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link href={home} aria-label="Kumplio"><Image src="/kumplio-logo-canonical.png" alt="Kumplio" width={455} height={171} priority className="h-auto w-[145px]" /></Link>
          <Button asChild><Link href={`${home}#resolver-form`}>{copy.cta}</Link></Button>
        </div>
      </header>
      <main>
        <section className="relative overflow-hidden border-b border-white/10 px-5 py-24 sm:px-8 md:py-32">
          <Image src="/brand/kumplio-mining-transport.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#151513_5%,rgba(21,21,19,.88)_55%,#151513_100%)]" />
          <div className="relative mx-auto max-w-[1280px]">
            <Link href={`${home}#verticales`} className="inline-flex items-center gap-2 text-sm text-[#A7C63A] hover:underline"><ArrowLeft className="h-4 w-4" />{copy.back}</Link>
            <p className="mt-16 text-[11px] font-semibold uppercase tracking-[.22em] text-[#B17A4D]">{copy.eyebrow}</p>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-light leading-[1.05] tracking-[-.04em] text-[#E0C5A1] md:text-7xl">{copy.title}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#AAA08F]">{copy.description}</p>
          </div>
        </section>
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <div><p className="text-[11px] uppercase tracking-[.2em] text-[#B17A4D]">{copy.prioritiesTitle}</p><ul className="mt-8 space-y-5">{copy.priorities.map((item) => <li key={item} className="flex gap-3 text-base leading-7 text-[#D5B994]"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#A7C63A]" />{item}</li>)}</ul></div>
            <div><h2 className="text-4xl font-light tracking-[-.03em] text-[#E0C5A1]">{copy.resultTitle}</h2><div className="mt-8 grid gap-px bg-white/10 sm:grid-cols-3">{copy.results.map((item) => <article key={item.title} className="bg-[#1C1C19] p-6"><h3 className="text-lg text-[#D5B994]">{item.title}</h3><p className="mt-3 text-sm leading-6 text-[#AAA08F]">{item.description}</p></article>)}</div><p className="mt-6 text-xs leading-6 text-[#827A6E]">{copy.note}</p></div>
          </div>
        </section>
        <section className="px-5 py-20 text-center sm:px-8"><h2 className="mx-auto max-w-3xl text-4xl font-light text-[#E0C5A1]">{copy.title}</h2><Button asChild className="mt-8 h-12 px-6"><Link href={`${home}#resolver-form`}>{copy.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button></section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
