'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, AlertCircle, TrendingDown, Target } from 'lucide-react'
import Link from 'next/link'

export default function TransporteDemoPage() {
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
            <Link href="/demo/transporte" className="text-sm font-semibold text-primary">Transporte</Link>
            <Link href="/demo/mineria" className="text-sm hover:text-primary transition">Minería</Link>
            <Link href="/webinars" className="text-sm hover:text-primary transition">Webinars</Link>
          </div>

          {/* RIGHT BUTTONS */}
          <div className="flex items-center gap-4">
          </div>
        </div>
      </nav>

      {/* HERO - TRANSPORTE */}
      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-3xl text-center space-y-8">
          <div>
            <p className="text-sm font-semibold text-primary uppercase mb-3">Solución para Transporte</p>
            <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-tight mb-6">
              Cero Multas.<br />
              Operaciones 24/7.<br />
              <span className="text-primary">Auditorías Listas.</span>
            </h1>
          </div>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Los vehículos detenidos por documentos vencidos te cuestan dinero. Los cambios legales son complicados. 
            KUMPLIO automatiza todo: alertas, verificación, reportes listos para reguladores.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/sign-up">
                Prueba Gratis para Transporte
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" className="text-lg px-8 bg-muted text-foreground hover:bg-muted/80" asChild>
              <Link href="/">Volver</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-24 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12">El Problema En Transporte</h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Vehículos detenidos por documentos vencidos</p>
                  <p className="text-sm text-muted-foreground mt-1">RT vencida, SOAP caducado, permiso de circulación expirado</p>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-muted/10 border border-muted/20">
                <p className="text-3xl font-black text-primary mb-1">$500K</p>
                <p className="text-sm text-muted-foreground">Costo de operación detenida por 1 día</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">15 multas al año por incumplimientos</p>
                  <p className="text-sm text-muted-foreground mt-1">Licencia vencida, documentos no actualizados, carga mal asegurada</p>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-muted/10 border border-muted/20">
                <p className="text-3xl font-black text-primary mb-1">$200K</p>
                <p className="text-sm text-muted-foreground">En infracciones anuales</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Mandantes exigentes piden carpetas actualizadas</p>
                  <p className="text-sm text-muted-foreground mt-1">Auditorías continuas, evidencia documentada, trazabilidad completa</p>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-muted/10 border border-muted/20">
                <p className="text-3xl font-black text-primary mb-1">15 hrs</p>
                <p className="text-sm text-muted-foreground">Tiempo manual por semana</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUCIÓN - 7 AGENTES */}
      <section className="py-24 px-6 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12">Cómo KUMPLIO Resuelve Cada Problema</h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div>
                <h3 className="font-semibold mb-2">Isidora identifica todas tus obligaciones</h3>
                <p className="text-sm text-muted-foreground">47 obligaciones en transporte: RT, SOAP, permisos, seguros, licencias conductores, documentación carga</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-2xl font-black text-primary">47</p>
                  <p className="text-xs text-muted-foreground">Obligaciones mapeadas</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div>
                <h3 className="font-semibold mb-2">Rodrigo monitorea cambios legales 24/7</h3>
                <p className="text-sm text-muted-foreground">Cambios en Ley 21.520, nuevas resoluciones SEREMI, modificaciones de requisitos</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-2xl font-black text-primary">24/7</p>
                  <p className="text-xs text-muted-foreground">Alertas en tiempo real</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div>
                <h3 className="font-semibold mb-2">Javier cuantifica el riesgo en dinero</h3>
                <p className="text-sm text-muted-foreground">Si tu flota tiene RT vencida: $200 UF por vehículo. Operación detenida: $500K/día</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-2xl font-black text-primary">$1.2M</p>
                  <p className="text-xs text-muted-foreground">Exposición clara</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div>
                <h3 className="font-semibold mb-2">Beatriz genera plan ejecutable</h3>
                <p className="text-sm text-muted-foreground">Mes 1: Renovar RT flota. Mes 2: Auditoría SOAP. Mes 3: Certificados conductores</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-2xl font-black text-primary">90 Días</p>
                  <p className="text-xs text-muted-foreground">Plan con milestones</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div>
                <h3 className="font-semibold mb-2">Verónica verifica qué se está cumpliendo</h3>
                <p className="text-sm text-muted-foreground">Auditoría real: "52% de tu flota tiene documentos vencidos. Acción urgente."</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-2xl font-black text-primary">100%</p>
                  <p className="text-xs text-muted-foreground">Visibilidad real</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6 rounded-lg border border-border">
              <div>
                <h3 className="font-semibold mb-2">Catalina genera reportes para mandantes</h3>
                <p className="text-sm text-muted-foreground">1 click: PDF con evidencia de cumplimiento, carpetas documentales, auditorías lisas</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-2xl font-black text-primary">1 Click</p>
                  <p className="text-xs text-muted-foreground">Listo para reguladores</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTADO - LABBE */}
      <section className="py-24 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-12">Caso Real: Labbe Logística</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-8 rounded-lg border border-border bg-background">
              <p className="text-sm text-muted-foreground mb-2">Multas/Año</p>
              <div className="mb-4">
                <p className="text-4xl font-black text-muted-foreground">15</p>
                <p className="text-xs text-muted-foreground font-semibold">→</p>
                <p className="text-4xl font-black text-primary">0</p>
              </div>
              <p className="text-xs text-muted-foreground">Cero infracciones, auditorías limpias</p>
            </div>

            <div className="p-8 rounded-lg border border-border bg-background">
              <p className="text-sm text-muted-foreground mb-2">Dinero Ahorrado</p>
              <div className="mb-4">
                <p className="text-4xl font-black text-primary">$200K</p>
              </div>
              <p className="text-xs text-muted-foreground">ROI: 5 meses. Después, profit puro.</p>
            </div>

            <div className="p-8 rounded-lg border border-border bg-background">
              <p className="text-sm text-muted-foreground mb-2">Tiempo Ahorrado</p>
              <div className="mb-4">
                <p className="text-4xl font-black text-primary">15 → 0.5</p>
                <p className="text-xs text-muted-foreground">hrs/semana</p>
              </div>
              <p className="text-xs text-muted-foreground">Automatización total</p>
            </div>
          </div>

          <div className="p-8 rounded-lg border border-border bg-background">
            <p className="font-semibold mb-4">Qué pasó en 90 días:</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Mes 1:</strong> Isidora identificó 47 obligaciones. Rodrigo alertó sobre cambios Ley 21.520.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Mes 2:</strong> Javier cuantificó: $1.2M en riesgo. Beatriz generó plan de acción. Ejecutaron.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Mes 3:</strong> Verónica auditó: 100% de obligaciones cumplidas. Catalina generó carpetas para mandantes.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-2xl text-center space-y-8">
          <h2 className="text-5xl font-bold">Empieza con Tu Flota Ahora</h2>
          <p className="text-lg text-muted-foreground">
            Los 7 agentes de KUMPLIO están listos para transporte. Cero multas. Operaciones 24/7. Auditorías listas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 bg-black text-white hover:bg-black/80 group/btn font-semibold shadow-lg" asChild>
              <Link href="/sign-up" className="flex items-center justify-center">
                Prueba Gratis
                <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:scale-110 transition-all duration-300" />
              </Link>
            </Button>
            <Button size="lg" className="text-lg px-8 border-2 border-black text-primary-foreground bg-black/10 hover:bg-black hover:text-primary-foreground group/btn font-semibold" variant="outline" asChild>
              <Link href="/">Volver a Inicio</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
