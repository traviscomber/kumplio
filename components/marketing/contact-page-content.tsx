'use client'

import { ChangeEvent, FormEvent, Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { CONTACT_PUBLIC_COPY } from '@/lib/i18n/contact-public-copy'
import { getPublicSiteHref, withPublicLocale, type PublicLocale } from '@/lib/i18n/public-routing'

const canonicalServiceLabels: Record<string, string> = {
  enterprise: 'Kumplio Enterprise Studio',
  fullstack: 'Solución Fullstack',
  acompanado: 'Plan Acompañado',
}

const inputClass = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary'

type ContactForm = {
  nombre: string
  email: string
  empresa: string
  industria: string
  empleados: string
  telefono: string
  mensaje: string
  website: string
}

function isKnownService(value: string): value is keyof typeof CONTACT_PUBLIC_COPY.es.serviceLabels {
  return value === 'enterprise' || value === 'fullstack' || value === 'acompanado'
}

function ContactContent({ locale }: { locale: PublicLocale }) {
  const copy = CONTACT_PUBLIC_COPY[locale]
  const searchParams = useSearchParams()
  const service = searchParams.get('service') || ''
  const serviceKey = isKnownService(service) ? service : null
  const selectedService = serviceKey ? copy.serviceLabels[serviceKey] : undefined
  const canonicalService = serviceKey ? canonicalServiceLabels[serviceKey] : undefined
  const [formData, setFormData] = useState<ContactForm>({
    nombre: '',
    email: '',
    empresa: '',
    industria: '',
    empleados: '',
    telefono: '',
    mensaje: selectedService
      ? locale === 'es'
        ? `Me interesa conversar sobre ${selectedService}.`
        : `I’m interested in discussing ${selectedService}.`
      : '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const homeHref = getPublicSiteHref('/', locale)
  const pricingHref = getPublicSiteHref('/pricing', locale)
  const privacyHref = getPublicSiteHref('/privacy', locale)
  const alternateLocale = locale === 'es' ? 'en' : 'es'
  const alternateContactHref = `${withPublicLocale('/contact', alternateLocale)}${serviceKey ? `?service=${serviceKey}` : ''}`

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formData.nombre || !formData.email || !formData.empresa || !formData.industria || !formData.empleados) {
      setError(copy.form.requiredError)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(copy.form.emailError)
      return
    }

    setLoading(true)
    setError('')

    const commercialContext = canonicalService
      ? `[Interés: ${canonicalService}] ${formData.mensaje}`.trim()
      : formData.mensaje

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          mensaje: commercialContext,
          timestamp: new Date().toISOString(),
          source: service ? `contact-${service}` : 'contact-page',
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || copy.form.genericSubmitError)
      }

      setSuccess(true)
      setFormData({ nombre: '', email: '', empresa: '', industria: '', empleados: '', telefono: '', mensaje: '', website: '' })
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : copy.form.genericSubmitError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href={homeHref} className="flex items-center gap-2 font-extrabold tracking-[0.16em] hover:opacity-80">KUMPLIO</Link>
          <div className="flex items-center gap-2">
            <Link
              href={alternateContactHref}
              hrefLang={alternateLocale === 'es' ? 'es-CL' : 'en'}
              className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition hover:text-foreground"
              aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a español'}
            >
              {copy.nav.switchLanguage}
            </Link>
            <Button variant="ghost" asChild size="sm"><Link href={pricingHref}>{copy.nav.plans}</Link></Button>
            <Button asChild size="sm"><Link href="/sign-up">{copy.nav.start}</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border/50 bg-gradient-to-b from-primary/10 via-primary/5 to-background px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">{copy.hero.eyebrow}</p>
            <h1 className="mt-4 max-w-4xl text-balance text-5xl font-extrabold tracking-tight md:text-6xl">{copy.hero.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{copy.hero.description}</p>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <aside className="space-y-6">
              {selectedService && (
                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{copy.selected.eyebrow}</p>
                      <p className="mt-2 font-bold">{selectedService}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.selected.description}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-bold">{copy.direct.title}</h2>
                <ul className="mt-6 space-y-5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /><a href="mailto:info@kumplio.app" className="hover:text-primary">info@kumplio.app</a></li>
                  <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /><a href="tel:+56993826127" className="hover:text-primary">+56 9 9382 6127</a></li>
                  <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /><span>Santiago, Chile</span></li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-bold">{copy.after.title}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  {copy.after.steps.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />{item}</li>)}
                </ul>
              </div>
            </aside>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              {success ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                  <h2 className="mt-5 text-2xl font-bold">{copy.success.title}</h2>
                  <p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">{copy.success.description}</p>
                  <Button variant="outline" onClick={() => setSuccess(false)} className="mt-7">{copy.success.another}</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold">{copy.form.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.form.requiredNote}</p>
                  </div>

                  {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label={copy.form.fields.name}><input name="nombre" value={formData.nombre} onChange={handleChange} required maxLength={120} className={inputClass} placeholder={copy.form.placeholders.name} /></Field>
                    <Field label={copy.form.fields.email}><input name="email" type="email" value={formData.email} onChange={handleChange} required maxLength={180} className={inputClass} placeholder={copy.form.placeholders.email} /></Field>
                    <Field label={copy.form.fields.company}><input name="empresa" value={formData.empresa} onChange={handleChange} required maxLength={180} className={inputClass} placeholder={copy.form.placeholders.company} /></Field>
                    <Field label={copy.form.fields.industry}>
                      <select name="industria" value={formData.industria} onChange={handleChange} required className={inputClass}>
                        <option value="">{copy.form.select}</option>
                        {Object.entries(copy.form.industries).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </Field>
                    <Field label={copy.form.fields.size}>
                      <select name="empleados" value={formData.empleados} onChange={handleChange} required className={inputClass}>
                        <option value="">{copy.form.select}</option>
                        {Object.entries(copy.form.sizes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </Field>
                    <Field label={copy.form.fields.phone}><input name="telefono" type="tel" value={formData.telefono} onChange={handleChange} maxLength={40} className={inputClass} placeholder={copy.form.placeholders.phone} /></Field>
                  </div>

                  <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                    <label htmlFor="website">{copy.form.fields.website}</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      value={formData.website}
                      onChange={handleChange}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <Field label={copy.form.fields.challenge}>
                    <textarea name="mensaje" value={formData.mensaje} onChange={handleChange} maxLength={3000} rows={6} className={`${inputClass} resize-none`} placeholder={copy.form.placeholders.challenge} />
                  </Field>

                  <Button type="submit" className="w-full" disabled={loading}>{loading ? copy.form.submitting : <>{copy.form.submit} <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
                  <p className="text-center text-xs leading-5 text-muted-foreground">
                    {copy.form.privacyPrefix}{' '}
                    <Link href={privacyHref} className="font-semibold text-primary hover:underline">{copy.form.privacyLink}</Link>
                    {copy.form.privacySuffix}
                  </p>
                </form>
              )}
            </section>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  )
}

export function ContactPageContent({ locale }: { locale: PublicLocale }) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <ContactContent locale={locale} />
    </Suspense>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold">{label}</span>{children}</label>
}
