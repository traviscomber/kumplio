'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileUp, CheckCircle2, Zap, BookOpen, ArrowRight, AlertCircle } from 'lucide-react'

interface OnboardingFlowProps {
  onComplete?: () => void
  organizationName?: string
}

export function OnboardingFlow({ onComplete, organizationName }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'upload' | 'analyze' | 'next'>('welcome')

  const steps = [
    {
      id: 'welcome',
      title: '¡Bienvenido a KUMPLIO!',
      description: 'Tu asistente de compliance con IA',
      icon: Zap,
    },
    {
      id: 'upload',
      title: 'Sube tu primer documento',
      description: 'PDFs, contratos, políticas',
      icon: FileUp,
    },
    {
      id: 'analyze',
      title: 'Análisis automático',
      description: 'Vera analiza en minutos',
      icon: CheckCircle2,
    },
    {
      id: 'next',
      title: 'Pasos siguientes',
      description: 'Qué hacer ahora',
      icon: BookOpen,
    },
  ]

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="space-y-6 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">¡Bienvenido a KUMPLIO!</h2>
              <p className="text-muted-foreground text-lg">
                {organizationName && `${organizationName}, `}en 3 pasos analizaremos tu cumplimiento con IA
              </p>
            </div>
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-foreground">Sube documentos (PDFs, contratos, políticas)</span>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-foreground">Vera analiza automáticamente con IA</span>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                <span className="text-foreground">Recibe recomendaciones de cumplimiento</span>
              </div>
            </div>
          </div>
        )

      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <FileUp className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Sube tu primer documento</h2>
              <p className="text-muted-foreground">Comienza con un PDF, contrato o política</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Primeros pasos:</p>
                <p>Los documentos de ejemplo disponibles en tu página de documentos te mostrarán cómo KUMPLIO realiza el análisis.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition cursor-pointer">
                <FileUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Subir PDF</p>
                <p className="text-xs text-muted-foreground">Máx 10MB</p>
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition cursor-pointer">
                <FileUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Subir Documento</p>
                <p className="text-xs text-muted-foreground">Word, Excel</p>
              </div>
            </div>
          </div>
        )

      case 'analyze':
        return (
          <div className="space-y-6 text-center">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Vera analiza automáticamente</h2>
              <p className="text-muted-foreground">Tu documento se procesa en segundos</p>
            </div>

            <div className="space-y-3 bg-muted/50 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-foreground">Detectando riesgos de cumplimiento</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-foreground">Analizando Ley 21.719 y normativas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-foreground">Generando recomendaciones</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">⏱️ Tiempo típico: 30-60 segundos</p>
          </div>
        )

      case 'next':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Pasos siguientes</h2>
            </div>

            <div className="space-y-3">
              <Card className="p-4 hover:bg-muted/50 transition cursor-pointer">
                <h3 className="font-semibold text-foreground mb-1">Ver análisis completo</h3>
                <p className="text-sm text-muted-foreground">Revisa los riesgos detectados y recomendaciones</p>
              </Card>

              <Card className="p-4 hover:bg-muted/50 transition cursor-pointer">
                <h3 className="font-semibold text-foreground mb-1">Crear proyecto</h3>
                <p className="text-sm text-muted-foreground">Organiza documentos por proyecto o cliente</p>
              </Card>

              <Card className="p-4 hover:bg-muted/50 transition cursor-pointer">
                <h3 className="font-semibold text-foreground mb-1">Explorar más features</h3>
                <p className="text-sm text-muted-foreground">Dashboard, reportes, auditoría, y más</p>
              </Card>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                ✓ Has completado la introducción a KUMPLIO. Estás listo para empezar a analizar documentos.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isLastStep = currentStep === 'next'

  return (
    <div className="min-h-[500px] bg-gradient-to-b from-primary/5 to-background rounded-lg border border-border p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex justify-between mb-12">
          {steps.map((step, idx) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = steps.findIndex(s => s.id === currentStep) > idx

            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                    isActive || isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-xs text-center font-medium text-foreground hidden sm:block max-w-[80px]">
                  {step.title.split(' ')[0]}
                </p>
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-center">
          {currentStep !== 'welcome' && (
            <Button
              variant="outline"
              onClick={() => {
                const stepIds: Array<'welcome' | 'upload' | 'analyze' | 'next'> = [
                  'welcome',
                  'upload',
                  'analyze',
                  'next',
                ]
                const currentIdx = stepIds.indexOf(currentStep)
                if (currentIdx > 0) {
                  setCurrentStep(stepIds[currentIdx - 1])
                }
              }}
            >
              Anterior
            </Button>
          )}

          {isLastStep ? (
            <Button
              onClick={() => onComplete?.()}
              className="gap-2"
            >
              Ir al Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                const stepIds: Array<'welcome' | 'upload' | 'analyze' | 'next'> = [
                  'welcome',
                  'upload',
                  'analyze',
                  'next',
                ]
                const currentIdx = stepIds.indexOf(currentStep)
                if (currentIdx < stepIds.length - 1) {
                  setCurrentStep(stepIds[currentIdx + 1])
                }
              }}
              className="gap-2"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
