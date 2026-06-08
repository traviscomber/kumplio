'use client'

import { Cloud, CheckCircle2, AlertCircle, Zap } from 'lucide-react'

export function UploadGuide() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Cómo funciona el upload</h3>
      </div>

      {/* 3-Step Process */}
      <div className="space-y-4">
        {[
          {
            step: 1,
            title: 'Sube tu documento',
            description: 'Arrastra o selecciona PDF, Word, Excel',
            icon: Cloud,
          },
          {
            step: 2,
            title: 'Vera analiza',
            description: 'IA detecta riesgos en segundos',
            icon: Zap,
          },
          {
            step: 3,
            title: 'Recibe recomendaciones',
            description: 'Acciones concretas de cumplimiento',
            icon: CheckCircle2,
          },
        ].map(({ step, title, description, icon: Icon }) => (
          <div key={step} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-semibold">{step}</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{title}</h4>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Supported Formats */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">Formatos soportados:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <span>✓ PDF</span>
          <span>✓ Word (.docx)</span>
          <span>✓ Excel (.xlsx)</span>
          <span>✓ Power Point (.pptx)</span>
        </div>
        <p className="text-xs text-muted-foreground pt-2">Máximo 10MB por archivo</p>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Pro tip:</p>
          <p>Sube contratos completos o documentos de política. Vera entiende contexto y referencias cruzadas.</p>
        </div>
      </div>
    </div>
  )
}
