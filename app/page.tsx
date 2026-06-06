'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Shield, BarChart3, Zap, Users, ArrowRight, CheckCircle } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">BS</span>
            </div>
            <span className="font-bold text-lg">BrightScope</span>
          </div>
          <div className="flex gap-4">
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
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            Cumplimiento Legal{' '}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              para Chile
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 text-balance">
            Plataforma de auditoría de seguridad y cumplimiento automático para la Ley 21.719 de protección de datos.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <a href="/sign-up">
                Comenzar gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Ver características</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-16">Características principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Escaneo automático"
            description="Análisis SAST, dependencias y configuración automático en tiempo real"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="Cumplimiento Ley 21.719"
            description="Validación específica de requisitos de protección de datos chilenos"
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Dashboard en tiempo real"
            description="Visualiza tu posición de seguridad con puntuaciones actualizadas"
          />
          <FeatureCard
            icon={<AlertTriangle className="w-8 h-8" />}
            title="Gestión de vulnerabilidades"
            description="Seguimiento y remediación de hallazgos de seguridad"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Colaboración en equipo"
            description="Gestión de permisos y colaboración entre miembros del equipo"
          />
          <FeatureCard
            icon={<CheckCircle className="w-8 h-8" />}
            title="Reportes automáticos"
            description="Genera reportes PDF de cumplimiento para auditorías"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl border border-primary/30 text-center">
        <h2 className="text-3xl font-bold mb-4">Comienza tu auditoría hoy</h2>
        <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
          Obtén una visión completa de tu posición de cumplimiento y seguridad. Sin tarjeta de crédito requerida.
        </p>
        <Button size="lg" asChild>
          <a href="/sign-up">Registrarse gratis</a>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 py-8 text-center text-slate-400">
        <p>
          {`© ${new Date().getFullYear()} BrightScope. Protegemos tu cumplimiento con Ley 21.719.`}
        </p>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 hover:border-primary/50 transition-colors">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  )
}

function AlertTriangle(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05l-8.47-14.14a2 2 0 0 0-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} />
      <line x1={12} y1={17} x2={12.01} y2={17} />
    </svg>
  )
}
