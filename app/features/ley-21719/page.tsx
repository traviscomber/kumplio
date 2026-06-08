import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, CheckCircle, AlertTriangle, FileText } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cumplimiento Ley 21.719 Chile | KUMPLIO - Guía Completa & Solución IA',
  description: 'Guía completa sobre Ley 21.719 de protección de datos en Chile. Cómo cumplir con obligaciones, riesgos de incumplimiento, multas, sanciones y soluciones automatizadas con IA.',
  keywords: [
    'Ley 21.719',
    'Ley 21.719 chile',
    'Protección de datos Chile',
    'LGPD Chile',
    'Cumplimiento Ley 21.719',
    'Ley protección datos personales',
    'Regulaciones Chile datos',
    'Obligaciones Ley 21.719',
    'Cumplimiento normativo datos',
    'Privacidad datos personales',
    'Cumplimiento legal chile',
  ],
  alternates: {
    canonical: 'https://kumplio.cl/features/ley-21719',
    languages: {
      'es-CL': 'https://kumplio.cl/features/ley-21719',
    },
  },
  openGraph: {
    title: 'Ley 21.719 Chile - Cumplimiento Automático con IA | KUMPLIO',
    description: 'Guía completa sobre Ley 21.719 y cómo cumplir. Soluciones automatizadas con IA.',
    url: 'https://kumplio.cl/features/ley-21719',
    type: 'article',
    images: [
      {
        url: 'https://kumplio.cl/og-ley-21719.png',
        width: 1200,
        height: 630,
        alt: 'Cumplimiento Ley 21.719 Chile',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ley 21.719 Chile - Guía & Solución IA',
    description: 'Automatiza tu cumplimiento con KUMPLIO',
    images: ['https://kumplio.cl/og-ley-21719.png'],
  },
}

export default function Ley21719Page() {
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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Regulación Chilena</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Ley 21.719: Protección de Datos en Chile
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Guía completa sobre cumplimiento normativo, obligaciones legales y cómo KUMPLIO automatiza tu conformidad con la ley chilena de protección de datos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Comenzar análisis de cumplimiento
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              Descargar guía PDF
            </Button>
          </div>
        </div>
      </section>

      {/* What is Ley 21.719 */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">¿Qué es la Ley 21.719?</h2>
          
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              La <strong className="text-foreground">Ley 21.719</strong> es la normativa chilena que regula la protección de datos personales. Entró en vigencia el 1 de enero de 2023 y establece derechos y obligaciones para el tratamiento de información personal en Chile.
            </p>
            
            <p>
              Esta ley moderniza la regulación de datos en Chile (anteriormente Ley 19.628) y se alinea con estándares internacionales como GDPR y LGPD, protegiendo derechos fundamentales de las personas.
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 my-6">
              <h3 className="font-bold text-foreground mb-3">Puntos clave:</h3>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Aplica a toda persona jurídica que trate datos personales en Chile</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Requisitos de consentimiento informado y transparencia</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Derechos de acceso, rectificación y portabilidad</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Obligaciones de seguridad y privacidad por diseño</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Obligations */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Obligaciones Legales por Ley 21.719</h2>
          
          <div className="space-y-6">
            {[
              {
                title: 'Consentimiento Informado',
                description: 'Obtener consentimiento previo, libre e informado antes de recopilar datos personales, salvo excepciones legales.',
              },
              {
                title: 'Transparencia y Aviso de Privacidad',
                description: 'Informar claramente sobre el tratamiento de datos, finalidades, responsables y derechos de los titulares.',
              },
              {
                title: 'Derecho de Acceso',
                description: 'Permitir que los titulares accedan a sus datos personales y confirmar si son tratados.',
              },
              {
                title: 'Derecho de Rectificación y Eliminación',
                description: 'Corregir datos inexactos y eliminar datos cuando sea proceda legalmente.',
              },
              {
                title: 'Derecho de Portabilidad',
                description: 'Facilitar la transferencia de datos en formato legible y estructurado.',
              },
              {
                title: 'Medidas de Seguridad',
                description: 'Implementar controles técnicos y organizacionales para proteger datos personales.',
              },
              {
                title: 'Gestión de Incidentes',
                description: 'Reportar brechas de datos y comunica a titulares cuando exista riesgo significativo.',
              },
              {
                title: 'Autoridad de Control',
                description: 'Responder a consultas del IFOP (Instituto Federal de Protección de Datos).',
              },
            ].map((obligation, idx) => (
              <div key={idx} className="border border-border/50 rounded-lg p-6 hover:border-primary/30 transition">
                <div className="flex gap-4">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">{obligation.title}</h3>
                    <p className="text-muted-foreground">{obligation.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risks */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Riesgos de Incumplimiento</h2>
          
          <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-8 mb-8">
            <div className="flex gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-red-900 dark:text-red-400 mb-3">Sanciones por Incumplimiento</h3>
                <ul className="space-y-2 text-red-900 dark:text-red-300">
                  <li>• Multas hasta <strong>200 UF</strong> (~$7 millones CLP) por infracción grave</li>
                  <li>• Registro público de infractores</li>
                  <li>• Demandas civiles de titulares afectados</li>
                  <li>• Reparación de daños morales y patrimoniales</li>
                  <li>• Pérdida de credibilidad y confianza del mercado</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-lg text-muted-foreground">
            El incumplimiento de Ley 21.719 expone a las empresas a sanciones administrativas, conflictos legales y daño reputacional. La proactividad en cumplimiento normativo es estratégica.
          </p>
        </div>
      </section>

      {/* KUMPLIO Solution */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">KUMPLIO: Tu Solución de Cumplimiento</h2>
          
          <p className="text-xl text-muted-foreground mb-8">
            KUMPLIO automatiza tu conformidad con Ley 21.719 mediante análisis inteligente de documentos y gestión centralizada de obligaciones.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {[
              {
                icon: FileText,
                title: 'Análisis Automático',
                description: 'Lee tus políticas, contratos y documentos para identificar brechas de cumplimiento con Ley 21.719.',
              },
              {
                icon: CheckCircle,
                title: 'Matriz de Obligaciones',
                description: 'Visualiza todas tus obligaciones legales en un tablero ejecutivo con plazos y responsables.',
              },
              {
                icon: Shield,
                title: 'Gestión de Riesgos',
                description: 'Identifica riesgos normativos antes de que se conviertan en problemas legales.',
              },
              {
                icon: AlertTriangle,
                title: 'Alertas Proactivas',
                description: 'Recibe notificaciones sobre cambios normativos y próximos plazos cumplimiento.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="border border-border/50 rounded-lg p-6">
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>

          <Button size="lg" asChild className="w-full">
            <Link href="/sign-up">
              Comenzar análisis gratuito de cumplimiento Ley 21.719
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <div className="max-w-3xl mx-auto bg-primary/5 border border-primary/20 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para Cumplir con Ley 21.719?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Automatiza tu análisis de cumplimiento normativo en minutos con KUMPLIO. Sin tarjeta de crédito.
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">Comenzar Gratis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 mt-24">
        <div className="container mx-auto px-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>KUMPLIO © 2024 - Inteligencia Documental para Cumplimiento Normativo en Chile</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
