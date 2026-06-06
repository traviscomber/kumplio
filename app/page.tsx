'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, ArrowRight, FileText, AlertCircle, Clock, Users, Zap } from 'lucide-react'

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
      <header className="border-b border-border/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">BS</span>
            </div>
            <span className="font-bold text-lg">BrightScope</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <a href="/sign-in">Iniciar sesión</a>
            </Button>
            <Button asChild>
              <a href="/sign-up">Registrarse</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-6xl md:text-7xl font-bold text-balance leading-tight">
            Inteligencia documental para licitaciones, contratos y cumplimiento
          </h1>
          <p className="text-xl text-muted-foreground text-balance">
            Sube documentos críticos y convierte bases, contratos y normativas en matrices claras de riesgos, obligaciones, plazos, responsables y acciones recomendadas.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <a href="/sign-up">
                Comenzar ahora
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#how-it-works">Ver cómo funciona</a>
            </Button>
          </div>
        </div>

        {/* Document Upload Preview */}
        <div className="mt-20 max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-12 text-center space-y-4">
            <Upload className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-lg font-semibold">Carga tu documento</h3>
            <p className="text-sm text-muted-foreground">
              Contratos, términos de referencia, normativas, o cualquier documento crítico
            </p>
            <div className="pt-4">
              <Button variant="secondary">Seleccionar archivo</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-6 py-24 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">El problema con los documentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <h3 className="text-lg font-semibold">Obligaciones ocultas</h3>
              <p className="text-muted-foreground">
                Plazos, requisitos y responsabilidades dispersas en cientos de páginas
              </p>
            </div>
            <div className="space-y-3">
              <Clock className="w-8 h-8 text-destructive" />
              <h3 className="text-lg font-semibold">Detección tardía de riesgos</h3>
              <p className="text-muted-foreground">
                Los problemas se descubren después de que es demasiado tarde
              </p>
            </div>
            <div className="space-y-3">
              <Users className="w-8 h-8 text-destructive" />
              <h3 className="text-lg font-semibold">Revisión manual</h3>
              <p className="text-muted-foreground">
                Equipos legales y operacionales gastando horas en análisis repetitivo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-6 py-24 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Cómo funciona</h2>
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground font-bold">
                  1
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold mb-2">Carga el documento</h3>
                <p className="text-muted-foreground">
                  Sube contratos, TDR, leyes, normativas o cualquier documento crítico
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground font-bold">
                  2
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold mb-2">IA estructura obligaciones</h3>
                <p className="text-muted-foreground">
                  Nuestro sistema identifica requisitos, plazos, riesgos y responsabilidades
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground font-bold">
                  3
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold mb-2">Genera matriz de cumplimiento</h3>
                <p className="text-muted-foreground">
                  Obtén una vista ejecutiva clara de obligaciones, evidencia y propietarios
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="container mx-auto px-6 py-24 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Tu panel de cumplimiento</h2>
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Puntuación de cumplimiento</p>
                <p className="text-3xl font-bold text-primary">87%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Riesgos identificados</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Obligaciones</p>
                <p className="text-3xl font-bold">34</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Plazos críticos</p>
                <p className="text-3xl font-bold text-destructive">3</p>
              </div>
            </div>

            {/* Sample Matrix Table */}
            <div className="border-t border-border pt-6">
              <h3 className="font-semibold mb-4">Matriz de cumplimiento</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold">Hallazgo</th>
                      <th className="text-left py-2 px-3 font-semibold">Riesgo</th>
                      <th className="text-left py-2 px-3 font-semibold">Obligación</th>
                      <th className="text-left py-2 px-3 font-semibold">Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-3">Plazo de respuesta</td>
                      <td className="py-3 px-3"><span className="bg-destructive/20 text-destructive px-2 py-1 rounded text-xs">Alto</span></td>
                      <td className="py-3 px-3">Responder dentro de 5 días hábiles</td>
                      <td className="py-3 px-3">Operaciones</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-3">Confidencialidad</td>
                      <td className="py-3 px-3"><span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs">Medio</span></td>
                      <td className="py-3 px-3">Datos solo para equipo autorizado</td>
                      <td className="py-3 px-3">Legal</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3">Auditoría trimestral</td>
                      <td className="py-3 px-3"><span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs">Bajo</span></td>
                      <td className="py-3 px-3">Audit cada 3 meses</td>
                      <td className="py-3 px-3">Cumplimiento</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="container mx-auto px-6 py-24 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Casos de uso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 space-y-3">
                <div className="text-2xl">{useCase.icon}</div>
                <h3 className="font-semibold">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Statement */}
      <section className="container mx-auto px-6 py-24 border-t border-border">
        <div className="max-w-3xl mx-auto bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-lg text-muted-foreground">
            <span className="font-semibold text-foreground">El sistema apoya a equipos legales, operacionales y comerciales.</span> No reemplaza la revisión legal especializada. Es un acelerador inteligente que convierte documentos complejos en matrices claras de acción.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-24 border-t border-border text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">Comienza hoy</h2>
          <p className="text-lg text-muted-foreground">
            Transforma tu proceso de análisis de documentos. Sin tarjeta de crédito requerida.
          </p>
          <Button size="lg" asChild>
            <a href="/sign-up">
              Crear cuenta gratis
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 text-center text-muted-foreground text-sm">
        <p>
          {`© ${new Date().getFullYear()} BrightScope. Inteligencia documental para empresas chilenas.`}
        </p>
      </footer>
    </div>
  )
}

const useCases = [
  {
    icon: '📋',
    title: 'Licitaciones Públicas',
    description: 'Estructura bases de licitación y extrae obligaciones clave en minutos',
  },
  {
    icon: '📑',
    title: 'Licitaciones Privadas',
    description: 'Analiza TDR y contratos para identificar riesgos operacionales',
  },
  {
    icon: '🤝',
    title: 'Contratos Comerciales',
    description: 'Transforma contratos en matrices de obligaciones y plazos',
  },
  {
    icon: '⚖️',
    title: 'Cumplimiento Laboral',
    description: 'Valida normas laborales y genera planes de acción',
  },
  {
    icon: '🔒',
    title: 'Seguridad Operacional',
    description: 'Estructura requisitos de seguridad y protocolos',
  },
  {
    icon: '✅',
    title: 'Preparación de Auditorías',
    description: 'Genera evidencia estructurada para auditorías',
  },
]
