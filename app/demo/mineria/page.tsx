'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function MineriaDemoPage() {
  return (
    <div className="bg-background text-foreground">
      {/* HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <span className="font-bold text-lg">KUMPLIO</span>
          </Link>

          {/* CENTER LINKS */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm hover:text-primary transition">Inicio</Link>
            <Link href="/pricing" className="text-sm hover:text-primary transition">Precios</Link>
            <Link href="/demo/transporte" className="text-sm hover:text-primary transition">Transporte</Link>
            <Link href="/demo/mineria" className="text-sm font-semibold text-primary">Minería</Link>
            <Link href="/webinars" className="text-sm hover:text-primary transition">Webinars</Link>
          </div>

          {/* RIGHT BUTTONS */}
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm hover:text-primary transition">Acceder</Link>
            <Button size="sm" asChild>
              <Link href="/sign-up">Empezar</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO - MINERÍA */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-3xl text-center space-y-8">
          <div>
            <p className="text-sm font-semibold text-primary uppercase mb-3">Solución para Minería</p>
            <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-tight mb-6">
              Riesgos Identificados.<br />
              Regulaciones Monitoreadas.<br />
              <span className="text-primary">Sanciones Evitadas.</span>
            </h1>
          </div>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            180+ obligaciones regulatorias. Cambios constantes en SONAMI, ambiental, seguridad, derechos humanos.
            KUMPLIO monitorea todo y te avisa antes de que sea demasiado tarde.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/sign-up">
                Prueba Gratis para Minería
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/">Volver</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-24 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12">El Problema En Minería</h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">180+ obligaciones regulatorias complejas</p>
                  <p className="text-sm text-muted-foreground mt-1">SONAMI, DS 40, SERNAGEOMIN, RCA, protocolo DDHH, tributarias</p>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-muted/10 border border-muted/20">
                <p className="text-3xl font-black text-muted-foreground mb-1">45/100</p>
                <p className="text-sm text-muted-foreground">Riesgo regulatorio típico</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Cambios regulatorios frecuentes y no comunicados</p>
                  <p className="text-sm text-muted-foreground mt-1">Nuevas resoluciones SEREMI, cambios SONAMI, actualizaciones RCA</p>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-muted/10 border border-muted/20">
                <p className="text-3xl font-black text-muted-foreground mb-1">8/10</p>
                <p className="text-sm text-muted-foreground">Cambios descobertos</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Potencial multa por incumplimiento: $1.2M+</p>
                  <p className="text-sm text-muted-foreground mt-1">300-500 UF por violación. Cierres de operaciones. Daño reputacional.</p>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-muted/10 border border-muted/20">
                <p className="text-3xl font-black text-muted-foreground mb-1">$1.2M</p>
                <p className="text-sm text-muted-foreground">Exposición</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">5+ incumplimientos críticos detectados tarde</p>
                  <p className="text-sm text-muted-foreground mt-1">Seguridad ocupacional, protección ambiental, derechos humanos</p>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-muted/10 border border-muted/20">
                <p className="text-3xl font-black text-muted-foreground mb-1">5+</p>
                <p className="text-sm text-muted-foreground">Gaps críticos por detectar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OBLIGACIONES EN MINERÍA */}
      <section className="py-24 px-6 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12">180+ Obligaciones En Minería</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-lg border border-border bg-card">
              <p className="font-semibold mb-4">Seguridad Ocupacional</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• DS 40 (Reglamento Seguridad Minería)</li>
                <li>• Certificación profesionales seguridad</li>
                <li>• Planes de emergencia actualizados</li>
                <li>• Capacitación personal continua</li>
              </ul>
            </div>

            <div className="p-8 rounded-lg border border-border bg-card">
              <p className="font-semibold mb-4">Ambiental</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• RCA (Resolución de Calificación Ambiental)</li>
                <li>• Monitoreo emisiones y residuos</li>
                <li>• Licencia Ambiental vigente</li>
                <li>• Cumplimiento estándares agua y aire</li>
              </ul>
            </div>

            <div className="p-8 rounded-lg border border-border bg-card">
              <p className="font-semibold mb-4">Derechos Humanos</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Protocolo SONAMI DDHH</li>
                <li>• Consulta previa indígena</li>
                <li>• Condiciones laborales justas</li>
                <li>• Evaluación riesgos DDHH anual</li>
              </ul>
            </div>

            <div className="p-8 rounded-lg border border-border bg-card">
              <p className="font-semibold mb-4">Tributaria</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Renta y tributación minería</li>
                <li>• IVA y retenciones</li>
                <li>• Royalties cobre y otros</li>
                <li>• Declaraciones SERNAC</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section className="py-24 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12">Cómo KUMPLIO Resuelve La Minería</h2>

          <div className="space-y-4">
            <div className="p-6 rounded-lg border border-border bg-background">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Sofia mapea las 180+ obligaciones</h3>
                  <p className="text-sm text-muted-foreground">Todas las leyes, reglamentos, y protocolos estructurados. Sin olvidar ninguna.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-background">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Elena monitorea cambios regulatorios 24/7</h3>
                  <p className="text-sm text-muted-foreground">Resoluciones SEREMI, cambios SONAMI, actualizaciones SERNAGEOMIN. Alertas inmediatas.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-background">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Bruno cuantifica la exposición real</h3>
                  <p className="text-sm text-muted-foreground">$1.2M en riesgos, cierres operacionales, daño reputacional. Números claros.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-background">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Marco genera roadmap de implementación</h3>
                  <p className="text-sm text-muted-foreground">90 días, hitos claros, recursos definidos. Viabilidad realista.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-background">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Laura audita qué se está cumpliendo realmente</h3>
                  <p className="text-sm text-muted-foreground">Verificación independiente, gap analysis, acciones correctivas documentadas.</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-border bg-background">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Catarina compila reportes para reguladores</h3>
                  <p className="text-sm text-muted-foreground">1 click: Evidencia de cumplimiento, auditorías lisas, carpetas para SERNAGEOMIN.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTADO - GOLDCORP */}
      <section className="py-24 px-6 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12">Caso Real: Goldcorp Chile</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-8 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Riesgo Regulatorio</p>
              <div className="mb-4">
                <p className="text-4xl font-black text-muted-foreground">45/100</p>
                <p className="text-xs text-muted-foreground font-semibold">→</p>
                <p className="text-4xl font-black text-primary">8/100</p>
              </div>
              <p className="text-xs text-muted-foreground">De alto a controlado en 90 días</p>
            </div>

            <div className="p-8 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Multa Evitada</p>
              <div className="mb-4">
                <p className="text-4xl font-black text-primary">$1.2M</p>
              </div>
              <p className="text-xs text-muted-foreground">Potencial ahorro por control temprano</p>
            </div>

            <div className="p-8 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">Incumplimientos Encontrados</p>
              <div className="mb-4">
                <p className="text-4xl font-black text-primary">5+</p>
                <p className="text-xs text-muted-foreground">críticos</p>
              </div>
              <p className="text-xs text-muted-foreground">Todos resueltos en 90 días</p>
            </div>
          </div>

          <div className="p-8 rounded-lg border border-border bg-card">
            <p className="font-semibold mb-4">Timeline de Implementación:</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Semana 1:</strong> Sofia mapeó 180+ obligaciones. Elena alertó sobre cambios SONAMI recientes.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Semana 2:</strong> Bruno identificó 5 incumplimientos críticos. Exposición real: $1.2M.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Semana 3-8:</strong> Marco ejecutó plan. Implementaron sistemas, capacitación, documentación.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Semana 9-12:</strong> Laura auditó: 100% de gaps resueltos. Riesgo: 8/100. Listo para SERNAGEOMIN.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center space-y-8">
          <h2 className="text-5xl font-bold">Empieza a Controlar Tu Riesgo Regulatorio</h2>
          <p className="text-lg opacity-90">
            180+ obligaciones. 7 agentes. 1 plataforma. Riesgo: 8/100.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link href="/sign-up">Prueba Gratis para Minería</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/">Volver a Inicio</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
