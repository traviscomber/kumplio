'use client'

import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'
import { TrustSignals } from '@/components/trust-signals'
import { ConversionCTA } from '@/components/conversion-cta'
import { SocialProof } from '@/components/social-proof'
import { CountdownTimer } from '@/components/countdown-timer'
import { InteractiveDiagnosis } from '@/components/interactive-diagnosis'
import { ProcessDiagram } from '@/components/process-diagram'
import { SystemArchitecture } from '@/components/system-architecture'
import { SpecialistsGrid } from '@/components/specialists-grid'
import { ComparisonRows } from '@/components/comparison-rows'
import { TechStackCarousel } from '@/components/tech-stack-carousel'
import { IaFirstArchitecture } from '@/components/ia-first-architecture'
import { ArrowRight, FileText, TrendingUp, Target, Calendar } from 'lucide-react'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          {/* LOGO - LARGER & MORE PROMINENT */}
          <a href="/" className="flex-shrink-0 hover:opacity-90 transition">
            <Image 
              src="/logo-kumplio.svg" 
              alt="KUMPLIO" 
              width={100} 
              height={100}
              className="w-24 h-24"
              priority
            />
          </a>

          {/* CENTER LINKS - HIDDEN ON MOBILE */}
          <div className="hidden md:flex items-center gap-12 flex-1 justify-center">
            <a href="/pricing" className="text-sm font-medium hover:text-primary transition">Precios</a>
            <a href="/demo/transporte" className="text-sm font-medium hover:text-primary transition">Transporte</a>
            <a href="/demo/mineria" className="text-sm font-medium hover:text-primary transition">Minería</a>
            <a href="/webinars" className="text-sm font-medium hover:text-primary transition">Webinars</a>
            <a href="/sales-kit" className="text-sm font-medium hover:text-primary transition">Recursos</a>
          </div>

          {/* RIGHT BUTTONS */}
          <div className="flex items-center gap-4">
            <a href="/sign-in" className="text-sm font-medium hover:text-primary transition">Acceder</a>
          </div>
        </div>
      </nav>

      {/* HERO - SPLIT LAYOUT WITH COUNTDOWN */}
      <section className="pt-40 pb-24 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-0 min-h-[600px]">
            {/* LEFT SIDE - TEXT CONTENT */}
            <div className="flex flex-col justify-center space-y-8 pr-8">
              {/* COUNTDOWN BANNER */}
              <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 w-fit">
                <p className="text-sm font-semibold text-primary">
                  Ley 21.719 — Diciembre 1, 2026
                </p>
              </div>

              <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
                ¿Tu Empresa Está Lista para la Ley 21.719?
                <br />
                <span className="text-primary">Multas de hasta $1.400M CLP</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                7 agentes IA especializados analizan tu cumplimiento en 60 segundos. Desde obligaciones hasta cuantificación de riesgos en dinero real.
                <br />
                <span className="font-semibold">Para retail, fintech, salud, tecnología — cualquier empresa que trate datos en Chile.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="text-lg px-8 bg-black text-white hover:bg-black/80 group/btn font-semibold shadow-lg" asChild>
                  <a href="/sign-up" className="flex items-center justify-center">
                    Diagnóstico Gratis
                    <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:scale-110 transition-all duration-300" />
                  </a>
                </Button>
                <Button size="lg" className="text-lg px-8 border-2 border-black text-primary-foreground bg-black/10 hover:bg-black hover:text-white group/btn font-semibold" variant="outline" asChild>
                  <a href="/demo/transporte" className="flex items-center justify-center">
                    Ver Demo de 2 Min
                  </a>
                </Button>
              </div>
            </div>

            {/* DIVIDER LINE */}
            <div className="hidden md:block absolute left-1/2 top-40 bottom-24 w-px bg-border/50 transform -translate-x-1/2"></div>

            {/* RIGHT SIDE - COUNTDOWN TIMER */}
            <div className="flex flex-col justify-center items-center pl-8 pt-8 md:pt-0">
              <CountdownTimer />
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK CAROUSEL */}
      <TechStackCarousel />

      {/* COMPARATIVA - CUMPLIMIENTO MANUAL VS KUMPLIO */}
      <section className="py-24 px-6 bg-card border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <ComparisonRows />
        </div>
      </section>

      {/* SOCIAL PROOF - COMPANY LOGOS */}
      <SocialProof />

      {/* TECHNOLOGY: IA FIRST ARCHITECTURE */}
      <section className="py-24 px-6 border-t border-border bg-surface-dark/30">
        <div className="container mx-auto max-w-6xl">
          <IaFirstArchitecture />
        </div>
      </section>

      {/* TRUST SIGNALS SECTION */}
      <TrustSignals />

      {/* FINAL CTA - CLEAN & SIMPLE */}
      <section className="py-20 px-6 border-t border-border">
        <div className="container mx-auto max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">¿Listo para Cumplir la Ley 21.719?</h2>
            <p className="text-xl text-muted-foreground">Diagnóstico gratis en 60 segundos. Sin tarjeta de crédito.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="text-base font-semibold px-8" asChild>
              <a href="/pricing" className="flex items-center justify-center">
                Ver Planes y Precios →
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center space-y-8">
          <h2 className="text-5xl font-bold">Un sistema integral de IA. Cumplimiento garantizado.</h2>
          <p className="text-lg opacity-90">Is1dora, R0drigo, Be4triz, Jav1er, Ver0nica, Andr3s y Cat4lina analizan, validan y optimizan tu cumplimiento 24/7. El cambio legal no espera. Tampoco deberías.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 bg-black text-white hover:bg-black/80 group/btn font-semibold shadow-lg" asChild>
              <a href="/sign-up" className="flex items-center justify-center">
                Empezar Ahora
                <ArrowRight className="ml-3 w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:scale-110 transition-all duration-300" />
              </a>
            </Button>
            <Button size="lg" className="text-lg px-8 border-2 border-black text-primary-foreground bg-black/10 hover:bg-black hover:text-primary-foreground group/btn font-semibold" variant="outline" asChild>
              <a href="/demo/transporte" className="flex items-center justify-center">
                Ver Sistema en Acción
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* LEAD MAGNET - FREE DIAGNOSIS (AT END) */}
      <section id="diagnostico-gratis" className="py-24 px-6 bg-primary/5 border-t border-primary/30 scroll-mt-24">
        <div className="container mx-auto max-w-7xl">
          <InteractiveDiagnosis />
        </div>
      </section>

      <Footer />
    </div>
  )
}
