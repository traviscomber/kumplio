'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopNav } from '@/components/layout/top-nav'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { Obligation, ComplianceMatrix } from '@/lib/types/documents'

export default function DocumentDetailPage() {
  const params = useParams()
  const docId = params.id as string
  const [document, setDocument] = useState<any>(null)
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [matrix, setMatrix] = useState<ComplianceMatrix[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = '/sign-in'
          return
        }

        const { data: doc } = await supabase
          .from('documents')
          .select('*')
          .eq('id', docId)
          .single()

        setDocument(doc)

        const { data: obls } = await supabase
          .from('obligations')
          .select('*')
          .eq('document_id', docId)
          .order('created_at', { ascending: false })

        setObligations(obls || [])

        const { data: mtrx } = await supabase
          .from('compliance_matrix')
          .select('*')
          .eq('document_id', docId)
          .order('created_at', { ascending: false })

        setMatrix(mtrx || [])
      } catch (err) {
        console.error('[v0] Error loading document:', err)
        setError('Error al cargar el documento')
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [docId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto px-6 py-8">
          <p className="text-muted-foreground">Cargando análisis...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto px-6 py-8">
          <p className="text-muted-foreground">Documento no encontrado</p>
        </div>
      </div>
    )
  }

  const criticalObligs = obligations.filter((o) => o.severity === 'critical')
  const highObligs = obligations.filter((o) => o.severity === 'high')
  const complianceScore = obligations.length > 0
    ? Math.round(((obligations.length - criticalObligs.length) / obligations.length) * 100)
    : 100

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/documents" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 w-fit">
          <ChevronLeft className="w-4 h-4" />
          Volver a documentos
        </Link>

        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{document.filename}</h1>
              <p className="text-muted-foreground">
                {document.industry && <span className="mr-4">Industria: {document.industry}</span>}
                Cargado el {new Date(document.created_at).toLocaleDateString('es-CL')}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Status indicator */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-semibold capitalize">{document.status}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
                {getStatusLabel(document.status)}
              </div>
            </div>
          </div>

          {/* Compliance Score Card */}
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Puntuación de cumplimiento</p>
                <p className="text-4xl font-bold text-primary">{complianceScore}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total de obligaciones</p>
                <p className="text-4xl font-bold">{obligations.length}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Críticas</p>
                <p className="text-4xl font-bold text-destructive">{criticalObligs.length}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Altas</p>
                <p className="text-4xl font-bold text-orange-500">{highObligs.length}</p>
              </div>
            </div>
          </div>

          {/* Obligations Section */}
          {obligations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Obligaciones identificadas</h2>
              <div className="space-y-3">
                {obligations.map(obl => (
                  <div key={obl.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{obl.obligation_text}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${getSeverityColor(obl.severity)}`}>
                        {obl.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-x-2">
                      <span className="inline-block px-2 py-0.5 bg-secondary rounded text-xs">
                        {obl.type}
                      </span>
                      {obl.owner && (
                        <span className="inline-block px-2 py-0.5 bg-secondary rounded text-xs">
                          Responsable: {obl.owner}
                        </span>
                      )}
                      {obl.deadline && (
                        <span className="inline-block px-2 py-0.5 bg-secondary rounded text-xs">
                          Vencimiento: {obl.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Matrix */}
          {matrix.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Matriz de cumplimiento</h2>
              <div className="bg-card border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-3 px-4 font-semibold">Obligación</th>
                      <th className="text-left py-3 px-4 font-semibold">Riesgo</th>
                      <th className="text-left py-3 px-4 font-semibold">Responsable</th>
                      <th className="text-left py-3 px-4 font-semibold">Vencimiento</th>
                      <th className="text-left py-3 px-4 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map(row => (
                      <tr key={row.id} className="border-b border-border hover:bg-secondary/30">
                        <td className="py-3 px-4 max-w-xs truncate">{row.obligation}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs ${getRiskColor(row.risk_level)}`}>
                            {row.risk_level}
                          </span>
                        </td>
                        <td className="py-3 px-4">{row.responsible || '—'}</td>
                        <td className="py-3 px-4">{row.due_date || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-secondary">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {document.status === 'processing' && (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">El análisis se está procesando. Por favor, recarga la página en unos momentos.</p>
            </div>
          )}

          {document.status === 'error' && (
            <div className="text-center py-12 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-destructive">Error en el procesamiento: {document.error_message}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    uploading: 'Cargando',
    processing: 'Procesando',
    completed: 'Completado',
    error: 'Error',
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    uploading: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    processing: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
    error: 'bg-red-500/10 text-red-700 dark:text-red-400',
  }
  return colors[status] || colors.uploading
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400',
    high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    low: 'bg-green-500/10 text-green-700 dark:text-green-400',
  }
  return colors[severity] || colors.low
}

function getRiskColor(risk: string): string {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400',
    high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    low: 'bg-green-500/10 text-green-700 dark:text-green-400',
  }
  return colors[risk] || colors.low
}
