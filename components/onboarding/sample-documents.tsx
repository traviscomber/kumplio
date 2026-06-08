'use client'

import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SampleDocuments() {
  const samples = [
    {
      name: 'Política de Privacidad',
      description: 'Ejemplo de política que cumple Ley 19.628',
      size: '2.4 MB',
      type: 'PDF',
    },
    {
      name: 'Contrato de Empleado',
      description: 'Modelo de contrato con cláusulas de consentimiento',
      size: '1.8 MB',
      type: 'DOCX',
    },
    {
      name: 'Matriz de Datos Personales',
      description: 'Plantilla de mapeo de datos según Ley 21.719',
      size: '892 KB',
      type: 'XLSX',
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Documentos de ejemplo</h3>
        <p className="text-sm text-muted-foreground">Descargar y probar KUMPLIO con documentos reales</p>
      </div>

      <div className="space-y-2">
        {samples.map((sample) => (
          <div key={sample.name} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground truncate">{sample.name}</h4>
                  <p className="text-sm text-muted-foreground">{sample.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sample.size} • {sample.type}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 gap-2"
                onClick={() => {
                  // TODO: Implement download
                  console.log(`[v0] Download ${sample.name}`)
                }}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Descargar</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>Consejo:</strong> Una vez descargues, úsalos para hacer upload y ver cómo KUMPLIO detecta riesgos de cumplimiento en documentos reales.
        </p>
      </div>
    </div>
  )
}
