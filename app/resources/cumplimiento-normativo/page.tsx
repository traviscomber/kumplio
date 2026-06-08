import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, Calendar } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog: Cumplimiento Normativo Chile | Ley 21.719 | KUMPLIO',
  description: 'Artículos y guías sobre cumplimiento normativo en Chile, Ley 21.719, protección de datos y regulaciones empresariales. Recursos para tu cumplimiento legal.',
  keywords: [
    'Blog cumplimiento',
    'Ley 21.719 artículos',
    'Regulaciones Chile',
    'Guías normativas',
    'Cumplimiento empresarial',
  ],
  alternates: {
    canonical: 'https://kumplio.cl/resources/cumplimiento-normativo',
  },
}

const articles = [
  {
    slug: 'ley-21719-guia-practica',
    title: 'Ley 21.719: Guía Práctica para Empresas Chilenas',
    excerpt: 'Todo lo que necesitas saber sobre la Ley 21.719 de protección de datos. Obligaciones, plazos y cómo preparar tu empresa para cumplimiento.',
    date: '2024-01-15',
    readTime: '12 min',
    category: 'Regulación',
  },
  {
    slug: 'matriz-cumplimiento-documentos',
    title: '5 Pasos para Crear una Matriz de Cumplimiento Efectiva',
    excerpt: 'Aprende cómo estructurar tus obligaciones normativas en una matriz ejecutiva. Incluye plantilla descargable.',
    date: '2024-01-12',
    readTime: '8 min',
    category: 'Estrategia',
  },
  {
    slug: 'riesgos-cumplimiento-normativo',
    title: 'Riesgos de No Cumplir con Ley 21.719 en Chile',
    excerpt: 'Análisis de multas, sanciones y consecuencias legales por incumplimiento de regulaciones de datos.',
    date: '2024-01-10',
    readTime: '10 min',
    category: 'Riesgos',
  },
  {
    slug: 'seguridad-datos-documentos',
    title: 'Cómo Automatizar el Análisis de Cumplimiento de Documentos',
    excerpt: 'Reduce tiempo de auditoría de 40 horas a 2 horas. Inteligencia documental para compliance automatizado.',
    date: '2024-01-08',
    readTime: '7 min',
    category: 'Tecnología',
  },
  {
    slug: 'obligaciones-proteccion-datos',
    title: 'Tus Obligaciones en Protección de Datos: Checklist Completo',
    excerpt: 'Lista exhaustiva de 15 obligaciones por Ley 21.719. Verifica si tu empresa cumple todas.',
    date: '2024-01-05',
    readTime: '15 min',
    category: 'Compliance',
  },
  {
    slug: 'inteligencia-documental-compliance',
    title: 'Inteligencia Documental: El Futuro del Cumplimiento Normativo',
    excerpt: 'Cómo la IA y análisis automático de documentos revolucionan la gestión de cumplimiento.',
    date: '2024-01-02',
    readTime: '9 min',
    category: 'Innovación',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">K</span>
            </div>
            <span className="font-bold text-base">KUMPLIO</span>
          </Link>
          <div className="hidden md:flex gap-3">
            <Button variant="ghost" asChild className="text-sm">
              <Link href="/">Volver</Link>
            </Button>
            <Button asChild className="text-sm">
              <Link href="/sign-up">Comenzar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Centro de Recursos de Cumplimiento
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Guías, artículos y estrategias para cumplir con Ley 21.719 y regulaciones normativas en Chile.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-primary/5 border border-primary/20 rounded-lg overflow-hidden hover:border-primary/50 transition">
            <Link href={`/resources/${articles[0].slug}`} className="block">
              <div className="p-8">
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {articles[0].category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(articles[0].date).toLocaleDateString('es-CL')}
                  </span>
                  <span className="text-sm text-muted-foreground">{articles[0].readTime}</span>
                </div>
                <h2 className="text-3xl font-bold mb-3 hover:text-primary transition">{articles[0].title}</h2>
                <p className="text-lg text-muted-foreground">{articles[0].excerpt}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Últimos Artículos</h2>
          
          <div className="space-y-6">
            {articles.slice(1).map((article) => (
              <Link 
                key={article.slug}
                href={`/resources/${article.slug}`}
                className="block border border-border/50 rounded-lg p-6 hover:border-primary/30 hover:bg-primary/5 transition group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                        {article.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.date).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition">
                      {article.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-3">{article.excerpt}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                    <span>{article.readTime}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <div className="max-w-2xl mx-auto bg-primary/5 border border-primary/20 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Mantente Actualizado</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Recibe guías sobre cumplimiento normativo en tu email. Solo lo que importa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground"
            />
            <Button>Suscribirse</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 mt-24">
        <div className="container mx-auto px-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>KUMPLIO © 2024 - Recursos de Cumplimiento Normativo en Chile</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
