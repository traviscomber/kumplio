'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle2, FileText, TrendingUp, Target, Calendar, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function InteractiveDiagnosis() {
  const router = useRouter()
  const { user } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isInView, setIsInView] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

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

  // Carry the selected file to the real analysis flow.
  // We do NOT fake any analysis here — the real processing happens at /documents.
  const goToRealAnalysis = (file: File) => {
    try {
      sessionStorage.setItem('pendingDocName', file.name)
    } catch {
      // ignore storage errors
    }
    if (user) {
      router.push('/documents?upload=1')
    } else {
      router.push('/sign-in?next=/documents')
    }
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
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      setUploadedFile(files[0])
    }
  }

  // Description of what the real analysis (at /documents) produces.
  // These are feature descriptions, NOT results from the uploaded file.
  const results = [
    { icon: FileText, label: 'Reporte Ejecutivo', desc: 'Resumen de las obligaciones identificadas en tu documento', delay: 0 },
    { icon: TrendingUp, label: 'Cuantificación de Riesgos', desc: 'Exposición estimada en UF y CLP según tu sector', delay: 100 },
    { icon: Target, label: 'Prioridades de Acción', desc: 'Obligaciones críticas ordenadas por prioridad', delay: 200 },
    { icon: Calendar, label: 'Roadmap Inicial', desc: 'Plan de acción para avanzar hacia el cumplimiento', delay: 300 },
  ]

  const displayedResults = results

  return (
    <div
      ref={containerRef}
      className={`grid md:grid-cols-2 gap-12 items-start transition-all duration-1000 ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* LEFT SIDE */}
      <div className={`space-y-6 transition-all duration-1000 delay-100 ${
        isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}>
        <div>
          <h2 className="text-4xl font-bold mb-2">Diagnóstico Gratis en 60 Segundos</h2>
          <p className="text-lg text-muted-foreground">Sube un documento (contrato, política, RAT) y descubre:</p>
        </div>

        <ul className="space-y-3">
          {[
            'Todas tus obligaciones según Ley 21.719',
            'Brecha (gap) exacta de cumplimiento',
            'Exposición financiera en UF/CLP real',
            'Reporte ejecutivo (2 páginas) listo para imprimir'
          ].map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-3 transition-all duration-700 ${
                isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
              }`}
              style={isInView ? { transitionDelay: `${200 + idx * 100}ms` } : {}}
            >
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

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

          {uploadedFile ? (
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

        <Button
          size="lg"
          className="text-lg px-8 bg-primary text-black hover:bg-primary/80 font-semibold w-full"
          onClick={() => {
            if (uploadedFile) {
              goToRealAnalysis(uploadedFile)
            } else if (user) {
              router.push('/documents?upload=1')
            } else {
              router.push('/sign-in?next=/documents')
            }
          }}
        >
          {uploadedFile ? (
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

        <p className="text-xs text-muted-foreground text-center">
          {user
            ? 'El análisis real de tu documento se realiza en la sección Documentos.'
            : 'Crea tu cuenta gratis para subir y analizar tu documento de forma segura.'}
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className={`transition-all duration-1000 delay-200 ${
        isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}>
        <div className="bg-card border border-border rounded-lg p-8 space-y-6 sticky top-20">
          <h3 className="font-bold text-lg">Qué recibes al terminar:</h3>
          <div className="space-y-4">
            {displayedResults.map((result, idx) => {
              const Icon = result.icon
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">
                      {result.label}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {result.desc}
                  </p>
                  {idx < displayedResults.length - 1 && <div className="border-t pt-4" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
