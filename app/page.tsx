'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, CheckCircle, AlertTriangle, Clock, Shield } from 'lucide-react'
import Image from 'next/image'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">K</span>
            </div>
            <span className="font-bold text-base">KUMPLIO</span>
          </div>
          <div className="hidden md:flex gap-3">
            <Button variant="ghost" asChild className="text-sm">
              <a href="/sign-in">Iniciar sesión</a>
            </Button>
            <Button asChild className="text-sm">
              <a href="/sign-up">Comenzar</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-32 lg:py-48">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-sm font-medium text-primary">Inteligencia documental para empresas chilenas</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.2]">
              Transforma documentos complejos en matrices de acción
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground text-balance">
              KUMPLIO estructura automáticamente contratos, licitaciones y normativas, extrayendo obligaciones, riesgos, plazos y responsables en formato ejecutivo.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Button size="lg" asChild>
                <a href="/sign-up">
                  Acceso gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#how-it-works">Ver demostración</a>
              </Button>
            </div>

            <div className="pt-12 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Cumplimiento Ley 21.719</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="container mx-auto px-6 py-24 lg:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 lg:p-12 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Puntuación</p>
                <p className="text-3xl lg:text-4xl font-bold text-primary">87%</p>
                <p className="text-xs text-muted-foreground">Cumplimiento</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Riesgos</p>
                <p className="text-3xl lg:text-4xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Identificados</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Obligaciones</p>
                <p className="text-3xl lg:text-4xl font-bold">34</p>
                <p className="text-xs text-muted-foreground">Estructuradas</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Tiempo</p>
                <p className="text-3xl lg:text-4xl font-bold text-orange-500">2 min</p>
                <p className="text-xs text-muted-foreground">Análisis</p>
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Matriz de cumplimiento</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Hallazgo</th>
                      <th className="text-left py-3 px-4 font-semibold">Riesgo</th>
                      <th className="text-left py-3 px-4 font-semibold">Obligación</th>
                      <th className="text-left py-3 px-4 font-semibold">Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50 hover:bg-secondary transition">
                      <td className="py-3 px-4">Plazo de respuesta</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Crítico
                        </span>
                      </td>
                      <td className="py-3 px-4">Responder dentro de 5 días hábiles</td>
                      <td className="py-3 px-4 text-muted-foreground">Operaciones</td>
                    </tr>
                    <tr className="border-b border-border/50 hover:bg-secondary transition">
                      <td className="py-3 px-4">Confidencialidad</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Alto
                        </span>
                      </td>
                      <td className="py-3 px-4">Datos solo para equipo autorizado</td>
                      <td className="py-3 px-4 text-muted-foreground">Legal</td>
                    </tr>
                    <tr className="hover:bg-secondary transition">
                      <td className="py-3 px-4">Auditoría trimestral</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Bajo
                        </span>
                      </td>
                      <td className="py-3 px-4">Auditar cada 3 meses</td>
                      <td className="py-3 px-4 text-muted-foreground">Cumplimiento</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-6 py-24 lg:py-32 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">Tres pasos hacia la claridad</h2>
          <p className="text-lg text-muted-foreground text-center text-balance mb-16">Transforma cualquier documento en matriz de cumplimiento en minutos</p>

          <div className="space-y-12">
            {[
              {
                step: '1',
                title: 'Carga tu documento',
                description: 'Sube contratos, TDR, leyes o normativas. Soportamos PDF, Word y formatos estándar.',
              },
              {
                step: '2',
                title: 'IA analiza y estructura',
                description: 'Nuestro motor identifica obligaciones, plazos, riesgos, responsables y evidencia.',
              },
              {
                step: '3',
                title: 'Obtén matriz ejecutiva',
                description: 'Matriz clara, exportable, lista para decisiones y auditorías. Sin ambigüedades.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 lg:gap-12">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <div className="flex-grow pt-1">
                  <h3 className="text-xl lg:text-2xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-6 py-24 lg:py-32 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">Para cada situación crítica</h2>
          <p className="text-lg text-muted-foreground text-center text-balance mb-16">Empresas chilenas usan KUMPLIO para:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {[
              { icon: '📋', title: 'Licitaciones Públicas', desc: 'Estructura bases y extrae obligaciones en minutos' },
              { icon: '📑', title: 'Licitaciones Privadas', desc: 'Analiza TDR y contrata con seguridad legal' },
              { icon: '🤝', title: 'Contratos Comerciales', desc: 'Mapea obligaciones y valida cláusulas críticas' },
              { icon: '⚖️', title: 'Cumplimiento Laboral', desc: 'Estructura requisitos normativo y regulatorios' },
              { icon: '🔒', title: 'Seguridad Operacional', desc: 'Valida protocolos y requisitos de seguridad' },
              { icon: '✅', title: 'Preparación de Auditorías', desc: 'Genera evidencia estructurada y trazable' },
            ].map((useCase, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <p className="text-3xl mb-3">{useCase.icon}</p>
                <h3 className="font-semibold text-lg mb-2">{useCase.title}</h3>
                <p className="text-muted-foreground text-sm">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24 lg:py-32 border-t border-border">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">Comienza hoy, sin riesgo</h2>
            <p className="text-lg text-muted-foreground">Acceso gratis a todos los features. Sin tarjeta de crédito. Cancelable en cualquier momento.</p>
          </div>
          <Button size="lg" asChild>
            <a href="/sign-up">
              Crear cuenta gratis
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">Implementado por equipos legales en +50 empresas chilenas</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 text-center text-muted-foreground text-xs">
        <div className="container mx-auto px-6 space-y-4">
          <p>KUMPLIO • Inteligencia documental para empresas serias</p>
          <div className="flex justify-center gap-6 text-xs">
            <a href="#" className="hover:text-foreground transition">Privacidad</a>
            <a href="#" className="hover:text-foreground transition">Términos</a>
            <a href="#" className="hover:text-foreground transition">Soporte</a>
            <a href="#" className="hover:text-foreground transition">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
