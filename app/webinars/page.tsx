'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Calendar, Clock, Users, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Footer } from '@/components/footer'

export const dynamic = 'force-dynamic'

const webinars = [
  {
    id: 1,
    title: 'Compliance en Transporte: De 15 Multas a 0',
    date: 'Martes, 18 Junio',
    time: '14:00 - 15:00',
    language: 'Español',
    instructor: 'Paula Díaz (Labbe Logística)',
    description: 'Caso real: cómo Labbe eliminó 15 multas/año usando KUMPLIO. Incluye demo en vivo del sistema.',
    learnings: [
      '47 obligaciones legales en transporte mapeadas',
      'Cómo monitorear cambios regulatorios 24/7',
      'Plan de acción ejecutable en 90 días',
    ],
    targetAudience: 'Empresas de transporte (10-300 vehículos)',
    image: '🚚',
  },
  {
    id: 2,
    title: 'Compliance en Minería: Riesgos a Dinero',
    date: 'Jueves, 20 Junio',
    time: '15:00 - 16:00',
    language: 'Español',
    instructor: 'Carlos Rodríguez (Goldcorp Chile)',
    description: 'Caso real: cómo Goldcorp bajó su riesgo de 45/100 a 8/100 y evitó $1.2M en multas.',
    learnings: [
      '180+ obligaciones mineras: seguridad, ambiental, DDHH',
      'Cuantificar riesgo en dinero real',
      'Integración con sistemas existentes',
    ],
    targetAudience: 'Empresas minería (medianas y grandes)',
    image: '⛏️',
  },
  {
    id: 3,
    title: 'Gestión de Regulaciones: Ley 21.719',
    date: 'Martes, 25 Junio',
    time: '14:00 - 15:00',
    language: 'Español',
    instructor: 'Jorge Martínez (Experto Legal)',
    description: 'Deep dive en Ley 21.719: qué significa, plazos, sanciones, y cómo automatizar cumplimiento.',
    learnings: [
      'Desglose de Ley 21.719 (artículos clave)',
      'Plazos críticos y sanciones reales',
      'Auditoría independiente (Por qué importa)',
    ],
    targetAudience: 'Directores de Cumplimiento, CFOs, Abogados',
    image: 'legal',
  },
]

export default function WebinarsPage() {
  const [selectedWebinar, setSelectedWebinar] = useState<number | null>(null)
  const [registeredWebinars, setRegisteredWebinars] = useState<number[]>([])

  const handleRegister = (webinarId: number) => {
    if (!registeredWebinars.includes(webinarId)) {
      setRegisteredWebinars([...registeredWebinars, webinarId])
      setTimeout(() => {
        alert(`¡Registrado! Recibirás un email de confirmación con el link del webinar.`)
      }, 300)
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
            <a href="/webinars" className="text-sm font-semibold text-primary">Webinars</a>
          </div>

          {/* RIGHT BUTTONS */}
          <div className="flex items-center gap-4">
            <a href="/sign-in" className="text-sm hover:text-primary transition">Acceder</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <Badge className="w-fit mx-auto">Webinars Gratuitos & En Vivo</Badge>
          <h1 className="text-5xl md:text-6xl font-bold">Aprende de Expertos Reales</h1>
          <p className="text-xl text-muted-foreground">
            Casos reales de empresas que implementaron KUMPLIO. Sesiones en vivo, preguntas directas, y acceso a especialistas.
          </p>
          <p className="text-sm text-muted-foreground font-semibold">
            Duración: 1 hora | Horarios Chile | Grabación disponible si no puedes asistir
          </p>
        </div>
      </section>

      {/* Webinars Grid */}
      <section className="px-6 py-24 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-12">Próximos Webinars</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {webinars.map((webinar) => (
              <div
                key={webinar.id}
                className="bg-card border border-border rounded-lg p-6 space-y-6 hover:border-primary/50 transition"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="text-5xl">{webinar.image}</div>
                  <h3 className="text-xl font-bold">{webinar.title}</h3>
                  <p className="text-sm text-muted-foreground">{webinar.description}</p>
                </div>

                {/* Date/Time */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{webinar.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{webinar.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{webinar.instructor}</span>
                  </div>
                </div>

                {/* Learnings */}
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Aprenderás:</p>
                  <ul className="space-y-2">
                    {webinar.learnings.map((learning, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{learning}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Audience */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Para: {webinar.targetAudience}</p>
                </div>

                {/* CTA */}
                <Button
                  className="w-full"
                  onClick={() => handleRegister(webinar.id)}
                  disabled={registeredWebinars.includes(webinar.id)}
                >
                  {registeredWebinars.includes(webinar.id) ? '¡Registrado!' : 'Registrarse Gratis'}
                  {!registeredWebinars.includes(webinar.id) && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="px-6 py-24 border-t border-border bg-card">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-12">¿Qué Esperar?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Caso Real',
                description: 'Ejecutivo de empresa que implementó KUMPLIO cuenta su historia: antes, problemas, solución, resultados.',
              },
              {
                title: 'Demo en Vivo',
                description: 'Recorrido por el sistema. Ves cómo funcionan los 7 agentes IA en tiempo real.',
              },
              {
                title: 'Preguntas Directas',
                description: 'Sesión Q&A de 15 minutos. Haces tus preguntas sin filtro. Respuestas honestas.',
              },
              {
                title: 'Acceso Exclusivo',
                description: 'Reciben el deck de presentación, case study PDF, y acceso a demo privada (si aplica).',
              },
            ].map((item, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-24 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-12">Lo Que Dicen Asistentes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Ricardo López',
                company: 'Labbe Logística',
                quote: 'No esperaba que fuera tan práctico. Vimos el sistema en vivo y empezamos implementación la misma semana.',
              },
              {
                name: 'Marcos Gutiérrez',
                company: 'Goldcorp Chile',
                quote: 'La sesión Q&A fue invaluable. Aclaró nuestras dudas legales mejor que cualquier consultor.',
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 space-y-3">
                <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-12">Preguntas Frecuentes</h2>
          <div className="space-y-6">
            {[
              {
                q: '¿Cuánto cuesta?',
                a: 'Completamente gratis. Sin registro de tarjeta, sin trampas.',
              },
              {
                q: '¿Recibiré spam después?',
                a: 'Solo si quieres. Opción para unirte a newsletter (opcional). Respetamos tu inbox.',
              },
              {
                q: '¿Qué si no puedo asistir en vivo?',
                a: 'Grabación disponible 24 horas después. Acceso por email.',
              },
              {
                q: '¿Necesito saber de legal para entender?',
                a: 'No. Explicamos todo desde cero. Dirigido a directivos y operacionales.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="font-semibold">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-6 py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center space-y-6">
          <h2 className="text-4xl font-bold">Elige tu Webinar y Registrate</h2>
          <p className="text-lg opacity-90">Sesiones en vivo, casos reales, expertos que responden tus preguntas.</p>
          <Button size="lg" className="bg-primary-foreground text-primary hover:bg-white/90 group/btn font-semibold" asChild>
            <a href="#" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center justify-center">
              Volver a Webinars
              <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:scale-110 transition-all duration-300" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
