'use client'

import { useState } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DiagnosisDemo() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const demoSteps = [
    {
      title: 'Paso 1: Carga el documento',
      desc: 'Arrastra un contrato, política o RAT de tu empresa',
      status: 'Analizando...',
      color: 'bg-yellow-500/20 border-yellow-500/50'
    },
    {
      title: 'Paso 2: 7 agentes IA analizan',
      desc: 'Is1dora extrae obligaciones. R0drigo identifica riesgos. Jav1er cuantifica en dinero real.',
      status: '45% completado',
      color: 'bg-blue-500/20 border-blue-500/50'
    },
    {
      title: 'Paso 3: Reporte completo en 60 seg',
      desc: '34 obligaciones identificadas. Exposición exacta en UF/CLP. Roadmap de 90 días.',
      status: '100% completado ✓',
      color: 'bg-green-500/20 border-green-500/50'
    },
  ]

  return (
    <div className="space-y-12">
      {/* HEADER */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold">¿Cómo funciona en 60 segundos?</h2>
        <p className="text-lg text-muted-foreground">Mira una demostración en vivo de nuestros 7 agentes IA analizando un documento de cumplimiento</p>
      </div>

      {/* VIDEO DEMO */}
      <div className="relative bg-black rounded-xl overflow-hidden border border-border shadow-2xl">
        {/* Video placeholder with animated gradient */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center overflow-hidden">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-grid-pattern animate-pulse" />
          </div>

          {/* Demo content that animates */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center space-y-8 p-8">
            {/* Live demo flow */}
            {isPlaying && (
              <div className="w-full max-w-2xl space-y-6 animate-in fade-in duration-500">
                {demoSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-lg border transition-all transform ${step.color} ${
                      isPlaying ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                    }`}
                    style={{
                      transitionDelay: isPlaying ? `${idx * 600}ms` : '0ms',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="font-bold text-lg">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                      </div>
                      <div className="text-xs font-mono px-2 py-1 rounded bg-primary/20 text-primary whitespace-nowrap">
                        {step.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Play button when not playing */}
            {!isPlaying && (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto hover:bg-primary/30 transition cursor-pointer" onClick={() => setIsPlaying(true)}>
                  <Play className="w-10 h-10 text-primary fill-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Ver demostración</p>
                  <p className="text-sm text-muted-foreground">2 min 15 seg</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Reproducir
                  </>
                )}
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* STEPS BREAKDOWN */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            num: '1',
            title: 'Sube tu documento',
            desc: 'PDF, contrato, política o RAT de tu empresa',
            icon: '📄'
          },
          {
            num: '2',
            title: '7 agentes IA trabajan',
            desc: 'Analizan 34+ obligaciones en paralelo',
            icon: '🤖'
          },
          {
            num: '3',
            title: 'Obten resultados en 60s',
            desc: 'Reporte ejecutivo + roadmap de 90 días',
            icon: '✓'
          },
        ].map((step, idx) => (
          <div
            key={idx}
            className="p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition space-y-3 text-center"
          >
            <div className="text-4xl">{step.icon}</div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary">Paso {step.num}</p>
              <h3 className="font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button size="lg" className="text-lg px-8 bg-primary text-black hover:bg-primary/80 font-semibold" asChild>
          <a href="#diagnostico-gratis">
            Prueba tu diagnóstico gratis
            <ArrowRight className="ml-3 w-5 h-5" />
          </a>
        </Button>
        <p className="text-sm text-muted-foreground mt-4">Sin tarjeta de crédito. Sin compromisos.</p>
      </div>
    </div>
  )
}

import { ArrowRight } from 'lucide-react'
