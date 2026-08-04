'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertTriangle, ChevronLeft, ShieldCheck } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { SeverityBadge, StatusBadge } from '@/components/ui/badges'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type ProjectRecord = {
  id: string
  name: string
  description: string | null
  compliance_score: number | null
  last_scan_date: string | null
}

type VulnerabilityRecord = {
  id: string
  title: string
  description: string | null
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  status: string
  remediation: string | null
}

export default function ProjectDetailPageClient() {
  const params = useParams<{ id: string }>()
  const projectId = params.id
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      setLoading(true)
      setError('')

      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          window.location.assign('/sign-in')
          return
        }

        const [projectResult, vulnerabilityResult] = await Promise.all([
          supabase
            .from('projects')
            .select('id, name, description, compliance_score, last_scan_date')
            .eq('id', projectId)
            .maybeSingle(),
          supabase
            .from('vulnerabilities')
            .select('id, title, description, severity, status, remediation')
            .eq('project_id', projectId)
            .order('discovered_at', { ascending: false }),
        ])

        if (projectResult.error) throw projectResult.error
        if (vulnerabilityResult.error) throw vulnerabilityResult.error

        if (!cancelled) {
          setProject(projectResult.data as ProjectRecord | null)
          setVulnerabilities((vulnerabilityResult.data || []) as VulnerabilityRecord[])
        }
      } catch (loadError) {
        console.error('[project/detail]', loadError)
        if (!cancelled) setError('No fue posible cargar el proyecto.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (projectId) void loadProject()
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (loading) {
    return <ProjectShell><div className="py-12 text-center">Cargando proyecto...</div></ProjectShell>
  }

  if (error) {
    return <ProjectShell><div className="py-12 text-center text-destructive">{error}</div></ProjectShell>
  }

  if (!project) {
    return <ProjectShell><div className="py-12 text-center">Proyecto no encontrado</div></ProjectShell>
  }

  const severityBreakdown = {
    critical: vulnerabilities.filter((item) => item.severity === 'critical').length,
    high: vulnerabilities.filter((item) => item.severity === 'high').length,
    medium: vulnerabilities.filter((item) => item.severity === 'medium').length,
    low: vulnerabilities.filter((item) => item.severity === 'low').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/projects" className="mb-8 flex items-center gap-2 text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Volver a proyectos
        </Link>

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            {project.description && <p className="mt-2 text-muted-foreground">{project.description}</p>}
          </div>
          <Button disabled variant="outline" title="Conecta una fuente real antes de ejecutar un escaneo">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Escaneo requiere una fuente
          </Button>
        </div>

        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Puntuación de cumplimiento</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Solo considera hallazgos provenientes de fuentes reales conectadas al proyecto.
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{project.compliance_score ?? 0}%</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {project.last_scan_date
                  ? `Última actualización: ${new Date(project.last_scan_date).toLocaleDateString('es-CL')}`
                  : 'Sin escaneos verificados'}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['Crítico', severityBreakdown.critical, 'text-red-600'],
            ['Alto', severityBreakdown.high, 'text-orange-600'],
            ['Medio', severityBreakdown.medium, 'text-yellow-600'],
            ['Bajo', severityBreakdown.low, 'text-blue-600'],
          ].map(([label, count, className]) => (
            <div key={String(label)} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">{label}</p>
              <p className={`mt-1 text-2xl font-bold ${className}`}>{count}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
            <AlertTriangle className="h-5 w-5" />
            Vulnerabilidades detectadas ({vulnerabilities.length})
          </h2>

          {vulnerabilities.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No hay vulnerabilidades verificadas.</p>
              <p className="mt-2 text-sm text-muted-foreground">Conecta una fuente real para habilitar el análisis.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vulnerabilities.map((vulnerability) => (
                <div key={vulnerability.id} className="rounded-lg border border-border p-4 transition-colors hover:bg-accent">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold text-foreground">{vulnerability.title}</h3>
                        <SeverityBadge severity={vulnerability.severity} />
                        <StatusBadge status={vulnerability.status} />
                      </div>
                      {vulnerability.description && <p className="mb-3 text-sm text-muted-foreground">{vulnerability.description}</p>}
                      {vulnerability.remediation && (
                        <div className="rounded border border-blue-200/20 bg-blue-500/5 p-2">
                          <p className="text-xs text-foreground"><span className="font-medium">Remediación:</span> {vulnerability.remediation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function ProjectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
