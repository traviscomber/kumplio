import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, BookOpen, Download, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Centro de Recursos | Guías de Cumplimiento | KUMPLIO',
  description: 'Acceso a guías, plantillas, documentos descargables y recursos sobre Ley 21.719 y cumplimiento normativo en Chile. Materiales gratuitos para tu empresa.',
  keywords: [
    'Recursos cumplimiento',
    'Guías Ley 21.719',
    'Plantillas compliance',
    'Documentos descargables',
    'Matriz cumplimiento',
    'Recursos gratuitos',
  ],
  alternates: {
    canonical: 'https://kumplio.cl/resources',
  },
}

const resources = [
  {
    id: 'cumplimiento-normativo',
    title: 'Centro de Cumplimiento Normativo',
    description: 'Artículos, guías y análisis sobre Ley 21.719 y regulaciones de datos en Chile.',
    icon: BookOpen,
    href: '/resources/cumplimiento-normativo',
    category: 'Guías',
    featured: true,
  },
  {
    id: 'matriz-compliance',
    title: 'Matriz de Cumplimiento',
    description: 'Plantilla descargable para identificar obligaciones normativas de tu empresa.',
    icon: Download,
    href: '/resources/matriz-compliance',
    category: 'Plantillas',
  },
  {
    id: 'politica-consentimiento',
    title: 'Política de Consentimiento Informado',
    description: 'Template legal para implementar consentimiento informado conforme a Ley 21.719.',
    icon: FileText,
    href: '/resources/politica-consentimiento',
    category: 'Plantillas',
  },
  {
    id: 'checklist-compliance',
    title: 'Checklist de Cumplimiento',
    description: '15 puntos esenciales para verificar cumplimiento normativo en tu organización.',
    icon: CheckCircle2,
    href: '/resources/checklist-compliance',
    category: 'Herramientas',
  },
  {
    id: 'guia-arco-plus',
    title: 'Guía ARCO+: Derechos de Datos',
    description: 'Explicación completa de derechos ARCO+ y obligaciones del responsable.',
    icon: BookOpen,
    href: '/resources/guia-arco-plus',
    category: 'Guías',
  },
  {
    id: 'analisis-riesgos',
    title: 'Análisis de Riesgos de Datos',
    description: 'Framework para identificar y evaluar riesgos de cumplimiento normativo.',
    icon: Download,
    href: '/resources/analisis-riesgos',
    category: 'Herramientas',
  },
]

const categories = ['Todos', 'Guías', 'Plantillas', 'Herramientas']

export default function ResourcesPage() {
  const featured = resources.filter(r => r.featured)
  const others = resources.filter(r => !r.featured)

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
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Centro de Recursos
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Acceso a guías, plantillas y herramientas para cumplir con Ley 21.719. Todos los recursos que necesitas para proteger datos y mantener cumplimiento normativo en tu empresa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/sign-up">Acceder a Todos los Recursos</Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="#recursos">Explorar Gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      {featured.length > 0 && (
        <section className="py-16 border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-12">Recurso Destacado</h2>
            {featured.map((resource) => {
              const Icon = resource.icon
              return (
                <Link
                  key={resource.id}
                  href={resource.href}
                  className="group block bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 hover:border-primary/50 hover:bg-primary/10 transition"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                        {resource.category}
                      </span>
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition">
                        {resource.title}
                      </h3>
                      <p className="text-lg text-muted-foreground mb-4">
                        {resource.description}
                      </p>
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <span>Explorar</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* All Resources */}
      <section className="py-16" id="recursos">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12">Todos los Recursos</h2>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {others.map((resource) => {
              const Icon = resource.icon
              return (
                <Link
                  key={resource.id}
                  href={resource.href}
                  className="group flex flex-col rounded-lg border border-border/50 p-6 hover:border-primary/30 hover:bg-primary/5 transition"
                >
                  <div className="mb-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  
                  <span className="inline-flex w-fit items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary mb-3">
                    {resource.category}
                  </span>
                  
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition">
                    {resource.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <span>Ver recurso</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5 border-t border-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-balance">
            ¿Necesitas ayuda personalizada?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Nuestro equipo de expertos está disponible para asesorarte sobre cumplimiento normativo específico de tu industria.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">Contactar Equipo Especializado</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
