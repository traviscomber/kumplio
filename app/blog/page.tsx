'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar, User, Clock, ArrowRight, Search } from 'lucide-react'
import { Footer } from '@/components/footer'

const blogPosts = [
  {
    id: 'ley-21719-guia-completa',
    title: '¿Qué es la Ley 21.719? Guía Completa para Empresas Chilenas',
    excerpt: 'Todo lo que necesitas saber sobre la Ley 21.719 de Consentimiento Informado. Requisitos, obligaciones, multas y cómo implementar cumplimiento.',
    date: '2024-06-08',
    author: 'KUMPLIO',
    category: 'Legal',
    readTime: 8,
    featured: true,
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
    excerpt: 'Pasos concretos para implementar procesos de consentimiento informado conforme a Ley 21.719. Templates, modelos y buenas prácticas.',
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
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'Todas' || post.category === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredPost = blogPosts.find((post) => post.featured)
  const otherPosts = filteredPosts.filter((post) => post.id !== featuredPost?.id)

  return (
    <main className="min-h-screen bg-background">
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
          <div className="max-w-3xl mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Blog KUMPLIO
            </h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Artículos, guías y análisis sobre cumplimiento normativo, Ley 21.719 y compliance en Chile
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Busca en el blog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="py-8 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {filteredPosts.length === 0 && (
            <p className="mt-4 text-muted-foreground">
              No se encontraron artículos que coincidan con tu búsqueda.
            </p>
          )}
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && selectedCategory === 'Todas' && !searchQuery && (
        <section className="py-16 border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href={`/blog/${featuredPost.id}`}
              className="group block bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-8 hover:border-primary/50 transition"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      Artículo Destacado
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
                      {featuredPost.category}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition text-balance">
                    {featuredPost.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 text-pretty">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {featuredPost.author}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(new Date(featuredPost.date))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime} min de lectura
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center">
                  <ArrowRight className="w-8 h-8 text-primary group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Blog Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPosts.map((post) => (
                <Link href={`/blog/${post.id}`} key={post.id}>
                  <article className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 hover:shadow-lg transition group">
                    {/* Content */}
                    <div className="px-6 pt-6 pb-4 flex-1 flex flex-col">
                      <span className="inline-flex w-fit text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-full mb-4">
                        {post.category}
                      </span>
                      <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition mb-3">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{post.author}</span>
                        <span>•</span>
                        <time dateTime={post.date}>
                          {formatDate(new Date(post.date))}
                        </time>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime} min
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6">No hay artículos que coincidan con tu búsqueda.</p>
              <Button asChild>
                <Link href="/blog">Ver todos los artículos</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-primary/5 border-t border-primary/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-balance">Mantente Actualizado</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Recibe nuevos artículos sobre compliance y Ley 21.719 directamente en tu email.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground"
            />
            <Button>Suscribirse</Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
