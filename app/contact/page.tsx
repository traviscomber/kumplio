'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ContactPage() {
  const router = useRouter()
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

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Send to Pipedrive/HubSpot webhook or your own API
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        setFormData({ nombre: '', email: '', empresa: '', industria: '', empleados: '', telefono: '', mensaje: '' })
        setTimeout(() => setSuccess(false), 5000)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* LOGO */}
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <span className="font-bold text-lg">KUMPLIO</span>
          </a>

          {/* CENTER LINKS */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-sm hover:text-primary transition">Inicio</a>
            <a href="/pricing" className="text-sm hover:text-primary transition">Precios</a>
            <a href="/demo/transporte" className="text-sm hover:text-primary transition">Transporte</a>
            <a href="/demo/mineria" className="text-sm hover:text-primary transition">Minería</a>
            <a href="/webinars" className="text-sm hover:text-primary transition">Webinars</a>
          </div>

          {/* RIGHT BUTTONS */}
          <div className="flex items-center gap-4">
            <a href="/sign-in" className="text-sm hover:text-primary transition">Acceder</a>
            <Button size="sm" asChild>
              <a href="/sign-up">Empezar</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-4xl text-center space-y-4 mb-16">
          <h1 className="text-5xl md:text-6xl font-bold">Hablemos de tu Cumplimiento</h1>
          <p className="text-xl text-muted-foreground">
            Un especialista de KUMPLIO te contactará en 24 horas para diseñar una solución a tu medida.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-6 pb-24">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Left: Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">Contacto Directo</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Email</p>
                      <a href="mailto:hola@kumplio.com" className="text-sm text-muted-foreground hover:text-primary">
                        hola@kumplio.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Teléfono</p>
                      <a href="tel:+56912345678" className="text-sm text-muted-foreground hover:text-primary">
                        +56 9 1234 5678
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Ubicación</p>
                      <p className="text-sm text-muted-foreground">Santiago, Chile</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Respuesta Típica</p>
                <p className="text-sm">
                  Dentro de 24 horas recibirás un email de un especialista con un análisis inicial basado en tu industria.
                </p>
              </div>
            </div>

            {/* Right: Form */}
            <div className="md:col-span-2">
              <div className="bg-card border border-border rounded-lg p-8 space-y-6">
                {success && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-700">
                      ¡Gracias! Un especialista te contactará pronto.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Nombre</label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        required
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        required
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Empresa</label>
                      <input
                        type="text"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        placeholder="Nombre empresa"
                        required
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Industria</label>
                      <select
                        name="industria"
                        value={formData.industria}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                        required
                      >
                        <option value="">Selecciona industria</option>
                        <option value="transporte">Transporte</option>
                        <option value="mineria">Minería</option>
                        <option value="construccion">Construcción</option>
                        <option value="salud">Salud</option>
                        <option value="financiero">Financiero</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Empleados</label>
                      <select
                        name="empleados"
                        value={formData.empleados}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                        required
                      >
                        <option value="">Selecciona rango</option>
                        <option value="1-50">1-50</option>
                        <option value="50-200">50-200</option>
                        <option value="200-500">200-500</option>
                        <option value="500+">500+</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Teléfono (Opcional)</label>
                      <input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+56 9 1234 5678"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">¿Cuál es tu mayor dolor en cumplimiento?</label>
                    <textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      placeholder="Ej: Vencimientos, multas, riesgos regulatorios..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary outline-none min-h-24"
                    />
                  </div>

                  <Button type="submit" className="w-full group/btn" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar'}
                    {!loading && <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />}
                  </Button>
                </form>

                <p className="text-xs text-muted-foreground text-center">
                  Protegemos tu privacidad. Ver nuestra <a href="#" className="hover:text-primary">política de privacidad</a>.
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

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-semibold mb-3">Producto</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/" className="hover:text-foreground transition">Inicio</a></li>
                <li><a href="/pricing" className="hover:text-foreground transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Privacidad</a></li>
                <li><a href="#" className="hover:text-foreground transition">Términos</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3">Empresa</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition">Sobre n3uralia</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">© 2026 KUMPLIO by n3uralia.com</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
