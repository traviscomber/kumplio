'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileUp, CheckCircle2, Zap, BookOpen, ArrowRight, AlertCircle, Upload, BarChart3, Lightbulb } from 'lucide-react'

interface OnboardingFlowProps {
  onComplete?: () => void
  organizationName?: string
}

export function OnboardingFlow({ onComplete, organizationName }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  const steps = [
    {
      number: 1,
      title: 'Sube un documento',
      description: 'PDF, Word, Excel, PowerPoint',
      icon: Upload,
      details: [
        'Cualquier archivo importante',
        'Máximo 10MB por documento',
        'Contratos, políticas, TDRs, etc.',
      ],
    },
    {
      number: 2,
      title: 'Vera analiza',
      description: 'Con inteligencia artificial',
      icon: BarChart3,
      details: [
        'Detecta riesgos de cumplimiento',
        'Mapea Ley 21.719 y normativas',
        'Identifica cláusulas problemáticas',
      ],
    },
    {
      number: 3,
      title: 'Recibe recomendaciones',
      description: 'Acciones concretas',
      icon: Lightbulb,
      details: [
        'Qué debe cambiar',
        'Por qué es importante',
        'Pasos específicos para cumplir',
      ],
    },
    {
      number: 4,
      title: 'Toma acción',
      description: 'Implementa cambios',
      icon: CheckCircle2,
      details: [
        'Crea proyectos para organizar',
        'Asigna tareas al equipo',
        'Monitorea cumplimiento',
      ],
    },
  ]

  const currentStepData = steps.find(s => s.number === currentStep)!
  const CurrentIcon = currentStepData.icon

  return (
    <div className="w-full">
      {/* Big Step Numbers 1 2 3 4 - Very Clear */}
      <div className="mb-12">
        <div className="flex gap-2 md:gap-4 justify-between">
          {steps.map((step) => {
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number

            return (
              <button
                key={step.number}
                onClick={() => setCurrentStep(step.number as 1 | 2 | 3 | 4)}
                className={`flex-1 group transition-all duration-200`}
              >
                <div
                  className={`mb-3 aspect-square rounded-2xl flex items-center justify-center font-bold text-3xl md:text-4xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" /> : step.number}
                </div>
                <p className={`text-xs md:text-sm font-semibold transition-colors ${
                  isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {step.title.split(' ')[0]}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Step Content - Big, Clear, Engaging */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-8 md:p-12 min-h-[400px] flex flex-col justify-between">
        
        {/* Content */}
        <div className="space-y-8">
          {/* Icon + Title */}
          <div className="space-y-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary/20 flex items-center justify-center">
              <CurrentIcon className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
            
            <div>
              <div className="text-6xl md:text-7xl font-black text-primary mb-2">Paso {currentStep}</div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                {currentStepData.title}
              </h2>
              <p className="text-lg text-muted-foreground mt-3">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white/50 dark:bg-black/20 rounded-xl p-6 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Incluye:</p>
            {currentStepData.details.map((detail, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <p className="text-foreground font-medium">{detail}</p>
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          {currentStep === 1 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm">
                <span className="font-semibold text-blue-900 dark:text-blue-200">💡 Consejo:</span>{' '}
                <span className="text-blue-800 dark:text-blue-300">Comienza con un contrato o política de privacidad para ver cómo KUMPLIO analiza</span>
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm">
                <span className="font-semibold text-green-900 dark:text-green-200">⚡ Tiempo:</span>{' '}
                <span className="text-green-800 dark:text-green-300">La mayoría de documentos se analizan en 30-60 segundos</span>
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm">
                <span className="font-semibold text-purple-900 dark:text-purple-200">📋 Cada recomendación incluye:</span>{' '}
                <span className="text-purple-800 dark:text-purple-300">Línea del documento, cambio sugerido, normativa aplicable, y por qué es importante</span>
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm">
                <span className="font-semibold text-amber-900 dark:text-amber-200">🎯 Siguiente:</span>{' '}
                <span className="text-amber-800 dark:text-amber-300">Ya estás listo para sube tu primer documento y comienza a analizar</span>
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-8 pt-8 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4)}
            disabled={currentStep === 1}
            className="flex-1"
          >
            Anterior
          </Button>

          {currentStep === 4 ? (
            <Button
              onClick={() => onComplete?.()}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              Ir a Documentos
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4)}
              className="flex-1 gap-2"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 flex gap-2 justify-center">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`h-1 rounded-full transition-all ${
              currentStep >= step.number ? 'bg-primary w-8' : 'bg-muted w-4'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
