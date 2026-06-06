'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopNav } from '@/components/layout/top-nav'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Download, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react'
import Link from 'next/link'

interface DocumentAnalysis {
  id: string
  name: string
  compliance_score: number
  obligations: any[]
  risks: any[]
}

export default function DocumentDetailPage() {
  const params = useParams()
  const docId = params.id as string
  const [document, setDocument] = useState<any>(null)
  const [obligations, setObligations] = useState<any[]>([])
  const [risks, setRisks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
          .order('priority', { ascending: true })

        setObligations(obls || [])

        const { data: rsk } = await supabase
          .from('compliance_risks')
          .select('*')
          .eq('document_id', docId)
          .order('risk_level', { ascending: true })

        setRisks(rsk || [])
      } catch (error) {
        console.error('[v0] Error loading document:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDocument()
  }, [docId])

  if (loading) {
    return <div className="min-h-screen bg-background"><TopNav /></div>
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

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-destructive/20 text-destructive'
      case 'high':
        return 'bg-red-500/20 text-red-500'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500'
      case 'low':
        return 'bg-blue-500/20 text-blue-500'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo',
    }
    return labels[priority] || priority
  }

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
              <h1 className="text-3xl font-bold mb-2">{document.name}</h1>
              <p className="text-muted-foreground">
                Cargado el {new Date(document.created_at).toLocaleDateString('es-CL')}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Compliance Score Card */}
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Puntuación de cumplimiento</p>
                <p className="text-4xl font-bold text-primary">
                  {obligations.length > 0 ? Math.round((obligations.filter(o => o.status === 'completed').length / obligations.length) * 100) : '—'}%
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Obligaciones</p>
                <p className="text-4xl font-bold">{obligations.length}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Riesgos identificados</p>
                <p className="text-4xl font-bold">{risks.length}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Riesgos críticos</p>
                <p className="text-4xl font-bold text-destructive">
                  {risks.filter(r => r.risk_level === 'critical').length}
                </p>
              </div>
            </div>
          </div>

          {/* Obligations Section */}
          {obligations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Obligaciones identificadas</h2>
              <div className="space-y-3">
                {obligations.map(obligation => (
                  <div key={obligation.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{obligation.title}</h3>
                        <p className="text-sm text-muted-foreground">{obligation.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${getRiskColor(obligation.priority)}`}>
                        {getPriorityLabel(obligation.priority)}
                      </span>
                    </div>
                    {obligation.deadline && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Plazo: </span>
                        <span className="font-medium">{new Date(obligation.deadline).toLocaleDateString('es-CL')}</span>
                      </p>
                    )}
                    {obligation.owner && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Responsable: </span>
                        <span className="font-medium">{obligation.owner}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks Section */}
          {risks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Riesgos de cumplimiento</h2>
              <div className="space-y-3">
                {risks.map(risk => (
                  <div key={risk.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-semibold flex-1">{risk.finding}</h3>
                      <span className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap ${getRiskColor(risk.risk_level)}`}>
                        {getPriorityLabel(risk.risk_level)}
                      </span>
                    </div>
                    {risk.description && (
                      <p className="text-sm text-muted-foreground">{risk.description}</p>
                    )}
                    {risk.mitigation_plan && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Plan de mitigación: </span>
                        <span>{risk.mitigation_plan}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {obligations.length === 0 && risks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">El análisis se está procesando. Por favor, recarga la página en unos momentos.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
