import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Blog Post | KUMPLIO',
  description: 'Artículo del blog sobre compliance y Ley 21.719',
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  // En una app real, traerías el contenido de una base de datos
  // basado en el slug. Por ahora, devolvemos una página de ejemplo.
  
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-8 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-4">
            <ArrowLeft className="w-4 h-4" />
            Volver al Blog
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Artículo del Blog
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="font-medium">KUMPLIO</span>
            <span>•</span>
            <time dateTime={new Date().toISOString().split('T')[0]}>
              {formatDate(new Date())}
            </time>
            <span>•</span>
            <span>5 min de lectura</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Este es un artículo del blog sobre compliance y Ley 21.719. 
            En una aplicación real, el contenido se traería de una base de datos basado en el slug.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            Slug actual: <code className="bg-muted px-2 py-1 rounded">{params.slug}</code>
          </p>

          {/* CTA */}
          <div className="mt-12 p-6 bg-muted rounded-lg border border-border">
            <h3 className="text-lg font-bold text-foreground mb-2">¿Necesitas Ayuda?</h3>
            <p className="text-muted-foreground mb-4">
              Contacta a nuestros expertos para implementar cumplimiento en tu empresa
            </p>
            <div className="flex gap-4">
              <a href="/contact" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
                Contactar
              </a>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
