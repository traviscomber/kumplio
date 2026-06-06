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
              Agentes de IA que transforman compliance en certeza
            </h1>

          <p className="text-lg md:text-xl text-muted-foreground text-balance mb-8">
            KUMPLIO es un sistema de 6 agentes especializados que analiza documentos, evalúa riesgos, genera recomendaciones y audita compliance con Ley 21.719. Orquestación inteligente que convierte regulaciones complejas en acciones claras.
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

      {/* Agent Team Section */}
      <section className="container mx-auto px-6 py-24 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">El equipo de agentes de KUMPLIO</h2>
            <p className="text-lg text-muted-foreground">7 agentes especializados orquestados con Legal Expert para compliance total. Desarrollado por n3uralia.com</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-xl">📄</div>
              <div>
                <h3 className="font-semibold text-lg">Sofia - Analista de Documentos</h3>
                <p className="text-sm text-muted-foreground mt-2">Extrae obligaciones legales, stakeholders, fechas críticas. Entiende contexto regulatorio chileno con razonamiento explícito.</p>
                <p className="text-xs text-primary mt-3 font-medium">Chain-of-Thought • Confidence Scoring • Cross-references</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-xl">🔍</div>
              <div>
                <h3 className="font-semibold text-lg">Elena - Monitor Regulatorio</h3>
                <p className="text-sm text-muted-foreground mt-2">Rastrea cambios en Ley 21.719, identifica plazos regulatorios, alerta de cambios críticos.</p>
                <p className="text-xs text-primary mt-3 font-medium">Real-time Monitoring • Regulatory Tracking • Alerts</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center text-xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-lg">Bruno - Evaluador de Riesgos</h3>
                <p className="text-sm text-muted-foreground mt-2">Cuantifica riesgos (0-100), calcula penales en UF, modela escenarios best/likely/worst.</p>
                <p className="text-xs text-primary mt-3 font-medium">Multi-scenario Analysis • Penalty Calculation • Confidence Scoring</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-xl">💡</div>
              <div>
                <h3 className="font-semibold text-lg">Marco - Asesor de Cumplimiento</h3>
                <p className="text-sm text-muted-foreground mt-2">Genera roadmaps priorizados, estima viabilidad, predice éxito basado en contexto organizacional.</p>
                <p className="text-xs text-primary mt-3 font-medium">3-Phase Roadmaps • Feasibility Scoring • Success Prediction</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl">✅</div>
              <div>
                <h3 className="font-semibold text-lg">Laura - Auditor de Cumplimiento</h3>
                <p className="text-sm text-muted-foreground mt-2">Audita estado actual, verifica implementación, identifica gaps vs. requisitos.</p>
                <p className="text-xs text-primary mt-3 font-medium">Gap Analysis • Compliance Verification • Audit Trails</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center text-xl">🎓</div>
              <div>
                <h3 className="font-semibold text-lg">Kai - Aprendizaje Continuo</h3>
                <p className="text-sm text-muted-foreground mt-2">Analiza patrones, identifica causas raíz de gaps, mejora recomendaciones con aprendizaje continuo del sistema.</p>
                <p className="text-xs text-primary mt-3 font-medium">Continuous Learning • Pattern Analysis • System Optimization</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xl">⚖️</div>
              <div>
                <h3 className="font-semibold text-lg">Legal Expert - Experto Jurídico</h3>
                <p className="text-sm text-muted-foreground mt-2">Especialista en Ley 21.719 con base de datos SERNAC real. Valida todas las decisiones de otros agentes. Calcula penales reales: 50-200 UF.</p>
                <p className="text-xs text-primary mt-3 font-medium">SERNAC Precedents • Article Mapping • Penalty Calculation • Legal Validation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="container mx-auto px-6 py-24 lg:py-32 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 lg:p-12 space-y-8">
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold">Pipeline de análisis en tiempo real</h3>
              <p className="text-muted-foreground mt-2">De documento a decisión en 6 pasos de agentes especializados</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Accuracy</p>
                <p className="text-3xl lg:text-4xl font-bold text-green-500">95%+</p>
                <p className="text-xs text-muted-foreground">Validado en Ley 21.719</p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Agentes</p>
                <p className="text-3xl lg:text-4xl font-bold text-blue-500">6</p>
                <p className="text-xs text-muted-foreground">Orquestados</p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Speed</p>
                <p className="text-3xl lg:text-4xl font-bold text-purple-500">20-60s</p>
                <p className="text-xs text-muted-foreground">Full Analysis</p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Confidence</p>
                <p className="text-3xl lg:text-4xl font-bold text-amber-500">0-100</p>
                <p className="text-xs text-muted-foreground">Per Finding</p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Workflows</p>
                <p className="text-3xl lg:text-4xl font-bold text-pink-500">3+</p>
                <p className="text-xs text-muted-foreground">Pre-configured</p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Reasoning</p>
                <p className="text-3xl lg:text-4xl font-bold text-indigo-500">100%</p>
                <p className="text-xs text-muted-foreground">Explainable</p>
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Salida de análisis</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-secondary rounded">
                  <span className="text-green-500 font-bold">✓</span>
                  <div className="text-sm">
                    <p className="font-medium">Extracción de Obligaciones</p>
                    <p className="text-xs text-muted-foreground">34 obligaciones con stakeholders y plazos críticos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary rounded">
                  <span className="text-amber-500 font-bold">⚠</span>
                  <div className="text-sm">
                    <p className="font-medium">Evaluación de Riesgos</p>
                    <p className="text-xs text-muted-foreground">12 riesgos cuantificados (50-200 UF en penales)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary rounded">
                  <span className="text-blue-500 font-bold">→</span>
                  <div className="text-sm">
                    <p className="font-medium">Roadmap de Cumplimiento</p>
                    <p className="text-xs text-muted-foreground">3 fases con prioridades, viabilidad y timeline</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-secondary rounded">
                  <span className="text-purple-500 font-bold">✔</span>
                  <div className="text-sm">
                    <p className="font-medium">Auditoría de Cumplimiento</p>
                    <p className="text-xs text-muted-foreground">Gap analysis con acciones correctivas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Agent Pipeline */}
      <section id="how-it-works" className="container mx-auto px-6 py-24 lg:py-32 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">Pipeline de agentes inteligentes</h2>
          <p className="text-lg text-muted-foreground text-center text-balance mb-16">Desde documento a decisión en 6 pasos coordinados</p>

          <div className="space-y-8">
            {[
              {
                agent: 'Sofia',
                step: '1',
                title: 'Análisis de Documentos',
                description: 'Sofia extrae automáticamente obligaciones, stakeholders, fechas críticas. Usa Chain-of-Thought para mostrar reasoning explícito.',
                output: '→ 34 obligaciones estructuradas con confianza 92%'
              },
              {
                agent: 'Elena',
                step: '2',
                title: 'Monitoreo Regulatorio',
                description: 'Elena verifica cambios recientes en Ley 21.719 y regulaciones relevantes. Alerta de deadlines que afecten tu compliance.',
                output: '→ 8 cambios regulatorios relevantes identificados'
              },
              {
                agent: 'Bruno',
                step: '3',
                title: 'Evaluación de Riesgos',
                description: 'Bruno cuantifica cada riesgo (0-100), calcula penales en UF con multi-pass verification, modela escenarios best/likely/worst.',
                output: '→ 12 riesgos con exposición 50-200 UF'
              },
              {
                agent: 'Marco',
                step: '4',
                title: 'Recomendaciones Prioritarias',
                description: 'Marco genera roadmap de 3 fases con viabilidad, recursos y timeline. Predice éxito basado en tu contexto.',
                output: '→ 18 recomendaciones priorizadas con 88% éxito esperado'
              },
              {
                agent: 'Laura',
                step: '5',
                title: 'Auditoría de Cumplimiento',
                description: 'Laura audita tu estado actual, verifica implementación, identifica gaps. Genera reporte de hallazgos.',
                output: '→ Gap analysis con 6 acciones correctivas'
              },
              {
                agent: 'Kai',
                step: '6',
                title: 'Aprendizaje Continuo',
                description: 'Kai analiza patrones, identifica causas raíz, mejora recomendaciones futuras. El sistema se vuelve más inteligente.',
                output: '→ Insights para futuras implementaciones'
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 lg:gap-12">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <div className="flex-grow pt-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-xl lg:text-2xl font-semibold">{item.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">{item.agent}</span>
                  </div>
                  <p className="text-muted-foreground text-base mb-3">{item.description}</p>
                  <p className="text-sm font-medium text-primary">{item.output}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="container mx-auto px-6 py-24 lg:py-32 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">Capacidades de KUMPLIO</h2>
          <p className="text-lg text-muted-foreground text-center text-balance mb-16">Orquestación inteligente con 6 agentes especializados</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {[
              { icon: '🧠', title: 'Chain-of-Thought Reasoning', desc: 'Cada decisión muestra su razonamiento explícito y validación multi-pass' },
              { icon: '📊', title: 'Confidence Scoring', desc: 'Scores 0-100 en cada finding, indicando nivel de certeza del análisis' },
              { icon: '⚖️', title: 'Cálculo de Penales', desc: 'Cuantificación precisa de riesgos en UF bajo Ley 21.719 chilena' },
              { icon: '🎯', title: 'Roadmap Priorizado', desc: '3 fases de implementación con viabilidad y timeline realista' },
              { icon: '🔄', title: 'Workflows Orquestados', desc: 'Ejecución coordinada de agentes con estado y monitoreo real-time' },
              { icon: '📈', title: 'Aprendizaje Continuo', desc: 'Sistema mejora automáticamente basado en patrones e outcomes' },
              { icon: '🛡️', title: 'Auditoría Completa', desc: 'Gap analysis, verificación de cumplimiento, trail de auditoría' },
              { icon: '🔐', title: 'RLS + Seguridad', desc: 'Datos encriptados, Row-Level Security, cumplimiento Ley 21.719' },
            ].map((capability, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <p className="text-3xl mb-3">{capability.icon}</p>
                <h3 className="font-semibold text-lg mb-2">{capability.title}</h3>
                <p className="text-muted-foreground text-sm">{capability.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24 lg:py-32 border-t border-border">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold">Sistema de compliance enterprise-grade</h2>
            <p className="text-lg text-muted-foreground">6 agentes especializados, orquestación inteligente, razonamiento transparente. Para empresas que necesitan cumplimiento sin ambigüedades.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <a href="/sign-up">
                Acceso gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/features/ley-21719">Ver guía Ley 21.719</a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Usado por equipos de compliance en +50 empresas chilenas • 95%+ accuracy • 0 hallucinations</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div>
                <h3 className="font-semibold mb-3 text-foreground">KUMPLIO</h3>
                <p className="text-xs text-muted-foreground">Sistema de IA y LLM para cumplimiento automático de Ley 21.719 en Chile. Desarrollado por n3uralia.com</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Sobre n3uralia</h3>
                <ul className="space-y-2 text-xs">
                  <li><a href="https://www.n3uralia.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition">n3uralia.com</a></li>
                  <li><a href="https://www.n3uralia.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition">Inteligencia Legal</a></li>
                  <li><a href="https://www.n3uralia.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition">Compliance IA</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Producto</h3>
                <ul className="space-y-2 text-xs">
                  <li><a href="/features/ley-21719" className="text-muted-foreground hover:text-primary transition">Ley 21.719</a></li>
                  <li><a href="/sign-up" className="text-muted-foreground hover:text-primary transition">Comenzar gratis</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition">Documentación</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Legal</h3>
                <ul className="space-y-2 text-xs">
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition">Privacidad</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-primary transition">Términos de Servicio</a></li>
                  <li><a href="mailto:support@kumplio.cl" className="text-muted-foreground hover:text-primary transition">Soporte</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-8 text-center">
              <p className="text-xs text-muted-foreground mb-2">© 2026 KUMPLIO by <a href="https://www.n3uralia.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">n3uralia.com</a>. Todos los derechos reservados.</p>
              <p className="text-xs text-muted-foreground">Cumplimiento de Ley 21.719 con Agentes IA y LLM • Compliance para empresas chilenas</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
