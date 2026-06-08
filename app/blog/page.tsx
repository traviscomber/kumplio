import Link from 'next/link'
import { formatDate } from '@/lib/utils'

const blogPosts = [
  {
    id: 'ley-21719-guia-completa',
    title: '¿Qué es la Ley 21.719? Guía Completa para Empresas Chilenas',
    excerpt: 'Todo lo que necesitas saber sobre la Ley 21.719 de Consentimiento Informado. Requisitos, obligaciones, multas y cómo implementar cumplimiento.',
    date: '2024-06-08',
    author: 'KUMPLIO',
    category: 'Legal',
    readTime: 8,
  },
  {
    id: 'proteccion-datos-chile',
    title: 'Protección de Datos Personales: De la Ley 19.628 a la Nueva Normativa',
    excerpt: 'Análisis completo de la evolución legal sobre protección de datos en Chile. Cambios recientes, obligaciones del responsable y derechos ARCO.',
    date: '2024-06-05',
    author: 'KUMPLIO',
    category: 'Compliance',
    readTime: 10,
  },
  {
    id: 'consentimiento-informado-practico',
    title: 'Consentimiento Informado: Guía Práctica para Implementar en tu Empresa',
    excerpt: 'Pasos concretos para implementar procesos de consentimiento informado conforme a Ley 21.719. Templatesmodelos y buenas prácticas.',
    date: '2024-06-01',
    author: 'n3uralia Legal',
    category: 'Implementación',
    readTime: 12,
  },
  {
    id: 'multas-ley-21719',
    title: 'Multas por Incumplimiento Ley 21.719: Sanciones y Cómo Evitarlas',
    excerpt: 'Análisis detallado de las sanciones por incumplimiento de Ley 21.719. Montos, procedimientos de fiscalización y estrategias de defensa.',
    date: '2024-05-28',
    author: 'KUMPLIO',
    category: 'Legal',
    readTime: 7,
  },
  {
    id: 'inteligencia-artificial-compliance',
    title: 'IA para Compliance: Cómo la Inteligencia Artificial Acelera Auditorías',
    excerpt: 'Descubre cómo herramientas de IA pueden automatizar análisis de cumplimiento, reducir riesgos y mejorar eficiencia de auditorías normativas.',
    date: '2024-05-25',
    author: 'KUMPLIO',
    category: 'Tecnología',
    readTime: 9,
  },
  {
    id: 'matriz-cumplimiento-empresas',
    title: 'Matriz de Cumplimiento: Herramienta Esencial para Gestión de Riesgos',
    excerpt: 'Cómo construir una matriz de cumplimiento efectiva para tu empresa. Metodologías, best practices y plantillas descargables.',
    date: '2024-05-20',
    author: 'n3uralia',
    category: 'Implementación',
    readTime: 11,
  },
]

const categories = ['Todas', 'Legal', 'Compliance', 'Implementación', 'Tecnología']

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold text-foreground mb-4">Blog KUMPLIO</h1>
            <p className="text-xl text-muted-foreground">
              Artículos, guías y noticias sobre cumplimiento normativo, Ley 21.719 y compliance en Chile
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Categories Filter */}
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  cat === 'Todas'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link href={`/blog/${post.id}`} key={post.id}>
                <article className="h-full bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer">
                  {/* Category Badge */}
                  <div className="px-6 pt-6 pb-2">
                    <span className="inline-block text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-4 space-y-3">
                    <h2 className="text-lg font-bold text-foreground line-clamp-2 hover:text-primary transition">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{post.author}</span>
                      <span>•</span>
                      <time dateTime={post.date}>
                        {formatDate(new Date(post.date))}
                      </time>
                    </div>
                    <span>{post.readTime} min</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Empty State Message */}
          <div className="mt-12 p-8 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground mb-4">
              ¿No encontraste lo que buscas? Suscribete para recibir nuevos artículos
            </p>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition">
              Suscribirse al Newsletter
            </button>
          </div>
        </div>
      </section>

      {/* About Blog Section */}
      <section className="py-12 bg-muted border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Sobre Este Blog</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            El blog de KUMPLIO comparte conocimiento sobre cumplimiento normativo, Ley 21.719, protección de datos y compliance en Chile. 
            Nuestros artículos son escritos por expertos legales, consultores de compliance e ingenieros de KUMPLIO y n3uralia.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Actualizado regularmente con artículos sobre cambios legales, mejores prácticas de implementación, guías técnicas y análisis de casos de uso reales.
          </p>
        </div>
      </section>
    </main>
  )
}
