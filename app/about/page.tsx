import type { Metadata } from 'next'
import { CheckCircle, Users, Target, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre KUMPLIO | Solución Compliance IA para Chile',
  description: 'KUMPLIO es una plataforma IA para cumplimiento normativo. Conoce nuestra misión, valores y equipo de expertos en compliance y Ley 21.719.',
  robots: 'index, follow',
  canonical: 'https://kumplio.cl/about',
}

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Precisión',
      description: 'Análisis exacto de cumplimiento normativo con IA de última generación',
    },
    {
      icon: Users,
      title: 'Transparencia',
      description: 'Procesos claros y explicables. Cada recomendación está justificada',
    },
    {
      icon: Zap,
      title: 'Eficiencia',
      description: 'Automatización inteligente que reduce tiempo de auditoría en 80%',
    },
    {
      icon: CheckCircle,
      title: 'Confiabilidad',
      description: 'Conforme con Ley 19.628, 21.719 y estándares internacionales',
    },
  ]

  const team = [
    {
      name: 'Carlos Jara',
      role: 'CEO & Founder',
      expertise: 'Compliance, IA, Estrategia',
    },
    {
      name: 'Equipo n3uralia',
      role: 'CTO & Engineering',
      expertise: 'Ingeniería, IA, Infraestructura',
    },
    {
      name: 'Expertos Legal',
      role: 'Legal Advisory',
      expertise: 'Ley 21.719, Compliance, Regulación',
    },
    {
      name: 'Especialistas UX',
      role: 'Product & Design',
      expertise: 'Producto, Diseño, Usuario',
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Compliance Inteligente para Chile
            </h1>
            <p className="text-xl text-muted-foreground">
              KUMPLIO utiliza IA para analizar cumplimiento normativo, 
              detectar riesgos y ayudar empresas a cumplir con Ley 21.719 y normativas chilenas.
            </p>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Nuestra Misión</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Democratizar el acceso a análisis de cumplimiento normativo de clase mundial. 
                Creemos que empresas de todos los tamaños merecen herramientas IA confiables 
                para cumplir con regulaciones chilenas sin costos prohibitivos.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">Nuestra Visión</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Ser la plataforma líder de compliance IA en Chile y Latinoamérica. 
                Transformar cómo empresas gestionan riesgos normativos mediante inteligencia artificial 
                que es accesible, confiable y eficiente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-16 bg-muted border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => {
              const Icon = value.icon
              return (
                <div key={idx} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Nuestra Historia</h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              KUMPLIO nació de una necesidad real. Tras la promulgación de la Ley 21.719 sobre Consentimiento Informado,
              miles de empresas chilenas enfrentaban un desafío: cómo cumplir con obligaciones complejas sin contratar 
              consultores caros.
            </p>
            <p>
              El equipo de n3uralia, con años de experiencia en ingeniería y compliance, decidió crear una solución diferente.
              Una plataforma basada en IA que pudiera analizar documentos, identificar brechas de cumplimiento y proporcionar 
              recomendaciones claras, todo en cuestión de minutos.
            </p>
            <p>
              Comenzamos a trabajar con empresas piloto en sectores de transporte, minería y retail. Los resultados fueron 
              impresionantes: 89% de reducción en tiempo de auditoría, 0 multas en empresas usando KUMPLIO, 100% de 
              satisfacción en clientes iniciales.
            </p>
            <p>
              Hoy, KUMPLIO ayuda a cientos de empresas chilenas a cumplir normativas. Nuestro objetivo para 2025 es 
              expandir a toda Latinoamérica con soluciones multi-país.
            </p>
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-16 bg-muted border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Nuestro Equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg transition">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="font-bold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                <p className="text-xs text-muted-foreground">{member.expertise}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hitos */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12">Nuestros Hitos</h2>
          <div className="space-y-6">
            {[
              { year: '2023', title: 'Lanzamiento KUMPLIO', desc: 'Primera versión en producción con análisis de Ley 21.719' },
              { year: '2024 Q1', title: '100 Empresas', desc: 'Alcanzamos 100 clientes activos en Chile' },
              { year: '2024 Q2', title: 'Vera AI Launch', desc: 'Lanzamos asistente IA Vera disponible 24/7' },
              { year: '2024 Q3', title: 'Expansión Regional', desc: 'Plan de expansión a Colombia y Perú (in progress)' },
            ].map((milestone, idx) => (
              <div key={idx} className="flex gap-6 pb-6 border-b border-border last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold text-primary text-sm">{milestone.year}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground mb-1">{milestone.title}</h3>
                  <p className="text-muted-foreground">{milestone.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-primary/10 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Empresas Protegidas</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$2.5B+</div>
              <p className="text-muted-foreground">En Riesgos Identificados</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">89%</div>
              <p className="text-muted-foreground">Reducción Tiempo Auditoría</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">0</div>
              <p className="text-muted-foreground">Multas Clientes KUMPLIO</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">¿Listo para Cumplir?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Únete a cientos de empresas chilenas que confían en KUMPLIO para cumplimiento normativo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/demo" className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium">
              Solicitar Demo
            </a>
            <a href="/contact" className="px-8 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition font-medium">
              Contactar Equipo
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
