'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    empresa: '',
    industria: '',
    empleados: '',
    telefono: '',
    mensaje: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    
    // Validation
    if (!formData.nombre || !formData.email || !formData.empresa || !formData.industria || !formData.empleados) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Por favor ingresa un email válido.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          source: 'contact-page',
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({ nombre: '', email: '', empresa: '', industria: '', empleados: '', telefono: '', mensaje: '' })
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError('Error al enviar el formulario. Por favor intenta de nuevo.')
      }
    } catch (error) {
      console.error('[v0] Contact form error:', error)
      setError('Ocurrió un error. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">K</span>
            </div>
            <span className="font-bold hidden sm:inline">KUMPLIO</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild size="sm">
              <Link href="/">Volver</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Comenzar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/10 via-primary/5 to-background border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Hablemos de tu Cumplimiento
            </h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Un especialista de KUMPLIO te contactará en 24 horas para diseñar una solución a tu medida.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Left: Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-6">Contacto Directo</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-1">Email</p>
                      <a href="mailto:info@kumplio.cl" className="text-sm text-muted-foreground hover:text-primary transition">
                        info@kumplio.cl
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-1">Teléfono</p>
                      <a href="tel:+56993826127" className="text-sm text-muted-foreground hover:text-primary transition">
                        +56 9 9382-6127
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-1">Ubicación</p>
                      <p className="text-sm text-muted-foreground">Santiago, Chile</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Nuestro Compromiso</p>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Respuesta en máximo 24 horas</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Análisis personalizado por industria</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Sin compromisos ni costo inicial</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="md:col-span-2">
              <div className="bg-card border border-border/50 rounded-lg p-8 space-y-6">
                {success && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-700">¡Gracias por tu mensaje!</p>
                      <p className="text-sm text-green-600">Un especialista te contactará en 24 horas.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
                    <div className="flex-shrink-0">✕</div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Oops, algo salió mal</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Nombre *</label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Tu nombre completo"
                        required
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@empresa.cl"
                        required
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Empresa *</label>
                      <input
                        type="text"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        placeholder="Nombre de tu empresa"
                        required
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Industria *</label>
                      <select
                        name="industria"
                        value={formData.industria}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none transition"
                        required
                      >
                        <option value="">Selecciona tu industria</option>
                        <option value="transporte">Transporte y Logística</option>
                        <option value="mineria">Minería</option>
                        <option value="construccion">Construcción</option>
                        <option value="salud">Salud y Farmacéutica</option>
                        <option value="financiero">Financiero y Seguros</option>
                        <option value="retail">Retail y E-commerce</option>
                        <option value="tecnologia">Tecnología e Innovación</option>
                        <option value="otro">Otra</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Tamaño empresa *</label>
                      <select
                        name="empleados"
                        value={formData.empleados}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none transition"
                        required
                      >
                        <option value="">Selecciona rango de empleados</option>
                        <option value="1-50">1-50 empleados</option>
                        <option value="50-200">50-200 empleados</option>
                        <option value="200-500">200-500 empleados</option>
                        <option value="500-1000">500-1000 empleados</option>
                        <option value="1000+">1000+ empleados</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Teléfono</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+56 9 XXXX XXXX"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">¿Cuál es tu mayor desafío en cumplimiento?</label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      placeholder="Ej: Automatizar auditorías, gestionar plazos de Ley 21.719, implementar control de datos..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/50 outline-none transition min-h-24"
                    />
                  </div>

                  <Button type="submit" className="w-full group" disabled={loading || success}>
                    {loading ? 'Enviando...' : success ? 'Enviado!' : 'Enviar Mensaje'}
                    {!loading && !success && <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center">
                  Protegemos tu privacidad. Ver nuestra <Link href="/privacy" className="hover:text-primary transition">política de privacidad</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-6 py-24 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-12">Preguntas Frecuentes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                q: '¿Cuánto tarda la respuesta?',
                a: 'Entre 2-24 horas hábiles. Si es urgente, llama directamente.'
              },
              {
                q: '¿Sin compromisos?',
                a: 'Correcto. Primero hablamos de tu situación, luego decidimos juntos.'
              },
              {
                q: '¿Costo de la consulta inicial?',
                a: 'Gratis. La consulta es sin costo. Solo después hablamos de pricing.'
              },
              {
                q: '¿Qué datos necesitan?',
                a: 'Solo lo básico: Empresa, industria, empleados, y tu mayor dolor.'
              },
            ].map((faq, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-semibold">{faq.q}</h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
