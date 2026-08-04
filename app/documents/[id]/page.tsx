'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft, FileCheck2 } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { ExportMenu } from '@/components/export/export-menu'
import { createClient } from '@/lib/supabase/client'
import type { Document, Obligation, ObligationPriority } from '@/lib/types/documents'

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>()
  const documentId = params.id
  const [document, setDocument] = useState<Document | null>(null)
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          window.location.assign(`/sign-in?next=${encodeURIComponent(`/documents/${documentId}`)}`)
          return
        }

        const [documentResult, obligationResult] = await Promise.all([
          supabase
            .from('documents')
            .select('id, project_id, user_id, name, file_url, document_type, upload_date, status, created_at, projects(name)')
            .eq('id', documentId)
            .maybeSingle(),
          supabase
            .from('obligations')
            .select('id, project_id, document_id, obligation_text, responsible_party, due_date, priority, status, is1dora_confidence, created_at')
            .eq('document_id', documentId)
            .order('created_at', { ascending: false }),
        ])

        if (documentResult.error) throw documentResult.error
        if (obligationResult.error) throw obligationResult.error

        if (!cancelled) {
          setDocument(documentResult.data as Document | null)
          setObligations((obligationResult.data || []) as Obligation[])
          setError(null)
        }
      } catch (loadError) {
        console.error('[documents/detail]', loadError)
        if (!cancelled) setError('No fue posible cargar el documento.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (documentId) void loadDocument()
    return () => {
      cancelled = true
    }
  }, [documentId])

  if (loading) {
    return <DocumentShell><p className="text-muted-foreground">Cargando análisis...</p></DocumentShell>
  }

  if (error) {
    return <DocumentShell><p className="text-destructive">{error}</p></DocumentShell>
  }

  if (!document) {
    return <DocumentShell><p className="text-muted-foreground">Documento no encontrado.</p></DocumentShell>
  }

  const criticalCount = countPriority(obligations, 'critical')
  const highCount = countPriority(obligations, 'high')
  const uploadedAt = document.upload_date || document.created_at

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/documents" className="mb-8 flex w-fit items-center gap-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Volver a documentos
        </Link>

        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{document.name}</h1>
              <p className="mt-2 text-muted-foreground">
                {document.document_type && <span className="mr-4">Tipo: {document.document_type}</span>}
                {uploadedAt && `Cargado el ${new Date(uploadedAt).toLocaleDateString('es-CL')}`}
              </p>
            </div>
            <ExportMenu documentId={documentId} documentName={document.name} />
          </div>

          <section className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Estado del análisis</p>
                <p className="font-semibold">{statusLabel(document.status)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor(document.status)}`}>
                {statusLabel(document.status)}
              </span>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <Metric label="Obligaciones identificadas" value={obligations.length} />
            <Metric label="Prioridad crítica" value={criticalCount} valueClass="text-destructive" />
            <Metric label="Prioridad alta" value={highCount} valueClass="text-orange-500" />
          </section>

          {document.status === 'analyzing' && (
            <section className="rounded-lg border border-border bg-card py-12 text-center">
              <p className="text-muted-foreground">El documento se está analizando. Recarga la página en unos momentos.</p>
            </section>
          )}

          {document.status === 'error' && (
            <section className="rounded-lg border border-red-500/20 bg-red-500/10 py-12 text-center">
              <p className="text-destructive">El análisis no pudo completarse. Puedes eliminar el documento y volver a cargarlo.</p>
            </section>
          )}

          {document.status === 'analyzed' && obligations.length === 0 && (
            <section className="rounded-lg border border-dashed border-border bg-card py-12 text-center">
              <FileCheck2 className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-semibold">No se identificaron obligaciones.</p>
              <p className="mt-1 text-sm text-muted-foreground">Esto no demuestra cumplimiento ni ausencia de obligaciones; requiere revisión humana.</p>
            </section>
          )}

          {obligations.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">Obligaciones identificadas</h2>
                <p className="mt-1 text-sm text-muted-foreground">Resultados preliminares sujetos a revisión humana y a las fuentes originales.</p>
              </div>
              <div className="space-y-3">
                {obligations.map((obligation) => (
                  <article key={obligation.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <p className="font-medium leading-7">{obligation.obligation_text}</p>
                      <span className={`shrink-0 rounded px-3 py-1 text-xs font-medium ${priorityColor(obligation.priority)}`}>
                        {(obligation.priority || 'sin prioridad').toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {obligation.responsible_party && <span className="rounded bg-secondary px-2 py-1">Responsable: {obligation.responsible_party}</span>}
                      {obligation.due_date && <span className="rounded bg-secondary px-2 py-1">Vencimiento: {new Date(obligation.due_date).toLocaleDateString('es-CL')}</span>}
                      {typeof obligation.is1dora_confidence === 'number' && (
                        <span className="rounded bg-secondary px-2 py-1">Confianza técnica: {Math.round(obligation.is1dora_confidence * 100)}%</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

function DocumentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

function Metric({ label, value, valueClass = '' }: { label: string; value: number; valueClass?: string }) {
  return (
    <article className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 text-4xl font-bold ${valueClass}`}>{value}</p>
    </article>
  )
}

function countPriority(obligations: Obligation[], priority: ObligationPriority) {
  return obligations.filter((obligation) => obligation.priority === priority).length
}

function statusLabel(status: Document['status']) {
  return {
    pending: 'Pendiente',
    analyzing: 'Analizando',
    analyzed: 'Analizado',
    error: 'Error',
  }[status]
}

function statusColor(status: Document['status']) {
  return {
    pending: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    analyzing: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    analyzed: 'bg-green-500/10 text-green-700 dark:text-green-400',
    error: 'bg-red-500/10 text-red-700 dark:text-red-400',
  }[status]
}

function priorityColor(priority: Obligation['priority']) {
  return {
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400',
    high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    low: 'bg-green-500/10 text-green-700 dark:text-green-400',
  }[priority || 'low']
}
