'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2, FileText, TrendingUp, Target, Calendar, Loader, ArrowRight } from 'lucide-react'

export function InteractiveDiagnosis() {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showResults, setShowResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (['application/pdf', 'text/plain', 'application/msword'].includes(file.type)) {
        setUploadedFile(file)
        simulateDiagnosis()
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      setUploadedFile(files[0])
      simulateDiagnosis()
    }
  }

  const simulateDiagnosis = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2500))
    setIsLoading(false)
    setShowResults(true)
  }

  const results = [
    { icon: FileText, label: 'Reporte Ejecutivo', desc: 'Resumen de 34 obligaciones identificadas', delay: 0 },
    { icon: TrendingUp, label: 'Cuantificación de Riesgos', desc: 'Exposición exacta en UF y CLP según tu sector', delay: 100 },
    { icon: Target, label: 'Prioridades de Acción', desc: 'Top 5 obligaciones críticas para tu empresa', delay: 200 },
    { icon: Calendar, label: 'Roadmap Inicial', desc: 'Plan de 90 días para alcanzar cumplimiento', delay: 300 },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-12 items-start">
      {/* LEFT SIDE */}
      <div className="space-y-6">
        <div>
          <h2 className="text-4xl font-bold mb-2">Diagnóstico Gratis en 60 Segundos</h2>
          <p className="text-lg text-muted-foreground">Sube un documento (contrato, política, RAT) y descubre:</p>
        </div>

        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Todas tus obligaciones según Ley 21.719</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Brecha (gap) exacta de cumplimiento</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Exposición financiera en UF/CLP real</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span>Reporte ejecutivo (2 páginas) listo para imprimir</span>
          </li>
        </ul>

        {!showResults ? (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-105'
                  : 'border-border bg-muted/30 hover:border-primary/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
              />

              {isLoading ? (
                <div className="text-center space-y-4">
                  <Loader className="w-12 h-12 text-primary mx-auto animate-spin" />
                  <div>
                    <p className="font-semibold text-primary">Analizando documento...</p>
                    <p className="text-sm text-muted-foreground">Nuestros 7 agentes IA están trabajando</p>
                  </div>
                </div>
              ) : uploadedFile ? (
                <div className="text-center space-y-2">
                  <FileText className="w-8 h-8 text-primary mx-auto" />
                  <p className="font-semibold">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">Listo para analizar</p>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <Upload className={`w-12 h-12 mx-auto transition ${isDragging ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-semibold">Arrastra tu documento aquí</p>
                    <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PDF, DOC, TXT - Máx 10MB</p>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground italic">Sin tarjeta de crédito. Sin compromisos.</p>

            <Button size="lg" className="text-lg px-8 bg-primary text-black hover:bg-primary/80 font-semibold w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : uploadedFile ? (
                <>
                  Analizar Documento
                  <ArrowRight className="ml-3 w-5 h-5" />
                </>
              ) : (
                <>
                  Obtener Diagnóstico Gratis
                  <ArrowRight className="ml-3 w-5 h-5" />
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4 p-6 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Análisis completado
            </div>
            <p className="text-sm text-muted-foreground">Tu diagnóstico está listo. Revisa los resultados a continuación.</p>
            <Button size="sm" className="w-full bg-primary text-black hover:bg-primary/80" asChild>
              <a href="/sign-up">Ver Reporte Completo</a>
            </Button>
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className={`transition-all duration-500 ${showResults ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'}`}>
        <div className="bg-card border border-border rounded-lg p-8 space-y-6 sticky top-20">
          <h3 className="font-bold text-lg">
            {showResults ? '✓ Qué recibes al terminar:' : 'Qué recibes al terminar:'}
          </h3>
          <div className="space-y-4">
            {results.map((result, idx) => {
              const Icon = result.icon
              return (
                <div
                  key={idx}
                  className={`space-y-2 transition-all duration-500 ${
                    showResults
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-30 translate-x-4'
                  }`}
                  style={showResults ? { transitionDelay: `${result.delay}ms` } : {}}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg transition-all ${showResults ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`w-4 h-4 transition ${showResults ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <p className={`font-semibold text-sm transition ${showResults ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {result.label}
                    </p>
                  </div>
                  <p className={`text-xs transition ${showResults ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                    {result.desc}
                  </p>
                  {idx < results.length - 1 && <div className="border-t pt-4" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
