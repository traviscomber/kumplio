'use client'

export const dynamic = 'force-dynamic'

import { ChangeEvent, FormEvent, Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

const serviceLabels: Record<string, string> = {
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

function ContactContent() {
  const searchParams = useSearchParams()
  const service = searchParams.get('service') || ''
  const selectedService = serviceLabels[service]
  const [formData, setFormData] = useState<ContactForm>({
    nombre: '',
    email: '',
    empresa: '',
    industria: '',
    empleados: '',
    telefono: '',
    mensaje: selectedService ? `Me interesa conversar sobre ${selectedService}.` : '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formData.nombre || !formData.email || !formData.empresa || !formData.industria || !formData.empleados) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    setLoading(true)
    setError('')

    const commercialContext = selectedService
      ? `[Interés: ${selectedService}] ${formData.mensaje}`.trim()
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
        throw new Error(payload.error || 'No fue posible registrar tu solicitud.')
      }

      setSuccess(true)
      setFormData({ nombre: '', email: '', empresa: '', industria: '', empleados: '', telefono: '', mensaje: '', website: '' })
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Ocurrió un error. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-[0.16em] hover:opacity-80">KUMPLIO</Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild size="sm"><Link href="/pricing">Planes</Link></Button>
            <Button asChild size="sm"><Link href="/sign-up">Comenzar</Link></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border/50 bg-gradient-to-b from-primary/10 via-primary/5 to-background px-5 py-20 sm:px-8 md:py-28">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Contacto</p>
            <h1 className="mt-4 max-w-4xl text-balance text-5xl font-extrabold tracking-tight md:text-6xl">Conversemos sobre el resultado que necesitas.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">Cuéntanos el problema, el contexto de tu organización y qué esperas conseguir. Revisaremos la solicitud antes de recomendar un plan o un proyecto.</p>
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
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Interés identificado</p>
                      <p className="mt-2 font-bold">{selectedService}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">La conversación parte con este contexto, pero confirmaremos primero si es la alternativa correcta.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-bold">Contacto directo</h2>
                <ul className="mt-6 space-y-5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /><a href="mailto:info@kumplio.app" className="hover:text-primary">info@kumplio.app</a></li>
                  <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /><a href="tel:+56993826127" className="hover:text-primary">+56 9 9382 6127</a></li>
                  <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /><span>Santiago, Chile</span></li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-bold">Qué ocurre después</h2>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  {[
                    'Revisamos el objetivo y el contexto informado.',
                    'Definimos si corresponde una suscripción, acompañamiento o Enterprise.',
                    'Acordamos alcance, responsables, precio y próximos pasos antes de iniciar.',
                  ].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />{item}</li>)}
                </ul>
              </div>
            </aside>

            <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              {success ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                  <h2 className="mt-5 text-2xl font-bold">Solicitud registrada</h2>
                  <p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">Gracias. Revisaremos la información antes de contactarte para que la conversación parta con contexto.</p>
                  <Button variant="outline" onClick={() => setSuccess(false)} className="mt-7">Enviar otra solicitud</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-bold">Cuéntanos sobre tu organización</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Los campos marcados con * son necesarios para registrar la solicitud.</p>
                  </div>

                  {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nombre *"><input name="nombre" value={formData.nombre} onChange={handleChange} required maxLength={120} className={inputClass} placeholder="Tu nombre" /></Field>
                    <Field label="Correo *"><input name="email" type="email" value={formData.email} onChange={handleChange} required maxLength={180} className={inputClass} placeholder="tu@empresa.cl" /></Field>
                    <Field label="Empresa *"><input name="empresa" value={formData.empresa} onChange={handleChange} required maxLength={180} className={inputClass} placeholder="Nombre de la empresa" /></Field>
                    <Field label="Industria *">
                      <select name="industria" value={formData.industria} onChange={handleChange} required className={inputClass}>
                        <option value="">Selecciona</option>
                        <option value="servicios">Servicios profesionales</option>
                        <option value="tecnologia">Tecnología</option>
                        <option value="financiero">Financiero y seguros</option>
                        <option value="salud">Salud</option>
                        <option value="retail">Retail y comercio</option>
                        <option value="transporte">Transporte y logística</option>
                        <option value="construccion">Construcción</option>
                        <option value="mineria">Minería</option>
                        <option value="agro">Agro</option>
                        <option value="otro">Otra</option>
                      </select>
                    </Field>
                    <Field label="Tamaño *">
                      <select name="empleados" value={formData.empleados} onChange={handleChange} required className={inputClass}>
                        <option value="">Selecciona</option>
                        <option value="1-9">1–9 personas</option>
                        <option value="10-49">10–49 personas</option>
                        <option value="50-199">50–199 personas</option>
                        <option value="200-999">200–999 personas</option>
                        <option value="1000+">1.000 o más</option>
                      </select>
                    </Field>
                    <Field label="Teléfono"><input name="telefono" type="tel" value={formData.telefono} onChange={handleChange} maxLength={40} className={inputClass} placeholder="+56 9..." /></Field>
                  </div>

                  <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                    <label htmlFor="website">Sitio web</label>
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

                  <Field label="Resultado o desafío">
                    <textarea name="mensaje" value={formData.mensaje} onChange={handleChange} maxLength={3000} rows={6} className={`${inputClass} resize-none`} placeholder="Describe qué necesitas ordenar, ejecutar, integrar o demostrar." />
                  </Field>

                  <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Registrando solicitud…' : <>Enviar solicitud <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
                  <p className="text-center text-xs leading-5 text-muted-foreground">Al enviar aceptas que utilicemos estos datos para responder tu solicitud, según nuestra <Link href="/privacy" className="font-semibold text-primary hover:underline">Política de Privacidad</Link>.</p>
                </form>
              )}
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <ContactContent />
    </Suspense>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-semibold">{label}</span>{children}</label>
}
