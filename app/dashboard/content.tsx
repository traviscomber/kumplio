'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  ListChecks,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

type Project = {
  id: string
  name: string
  description?: string | null
  compliance_score?: number | null
  updated_at?: string | null
}

type DashboardStats = {
  obligations: number
  criticalRisks: number
  evidence: number
  openActions: number
}

const emptyStats: DashboardStats = {
  obligations: 0,
  criticalRisks: 0,
  evidence: 0,
  openActions: 0,
}

export function DashboardContent() {
  const [organization, setOrganization] = useState<{ id: string; name: string } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats>(emptyStats)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      const supabase = createClient()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = '/sign-in'
          return
        }

        const { data: documentList, error: documentError } = await supabase
          .from('documents')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (documentError) {
          setWarning('No fue posible verificar los documentos iniciales.')
        }

        if (!documentList?.length) {
          setShowOnboarding(true)
          return
        }

        const { data: membership, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (membershipError || !membership?.organization_id) {
          setWarning('Tu cuenta todavía no está vinculada a una organización.')
          return
        }

        const organizationId = membership.organization_id
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', organizationId)
          .maybeSingle()

        if (org) setOrganization(org)

        const { data: projectList, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, description, compliance_score, updated_at')
          .eq('organization_id', organizationId)
          .order('updated_at', { ascending: false })

        if (projectsError) {
          setWarning('No fue posible cargar todos los datos del workspace.')
          return
        }

        const currentProjects = (projectList || []) as Project[]
        setProjects(currentProjects)
        const projectIds = currentProjects.map((project) => project.id)

        if (!projectIds.length) return

        const [obligationsResult, risksResult, documentsResult, roadmapsResult] = await Promise.all([
          supabase.from('obligations').select('id', { count: 'exact', head: true }).in('project_id', projectIds),
          supabase
            .from('risks')
            .select('id', { count: 'exact', head: true })
            .in('project_id', projectIds)
            .in('priority', ['critical', 'high'])
            .neq('status', 'closed'),
          supabase.from('documents').select('id', { count: 'exact', head: true }).in('project_id', projectIds),
          supabase
            .from('roadmaps')
            .select('id', { count: 'exact', head: true })
            .in('project_id', projectIds)
            .neq('status', 'completed'),
        ])

        setStats({
          obligations: obligationsResult.count || 0,
          criticalRisks: risksResult.count || 0,
          evidence: documentsResult.count || 0,
          openActions: roadmapsResult.count || 0,
        })
      } catch (error) {
        console.error('[dashboard] Load error:', error)
        setWarning('Ocurrió un error al cargar el dashboard.')
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  if (loading) {
    return <div className="py-16 text-center text-muted-foreground">Cargando workspace…</div>
  }

  if (showOnboarding) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido a KUMPLIO</h1>
          <p className="mt-2 text-muted-foreground">
            Carga una fuente regulatoria, contrato o política para iniciar tu mapa de cumplimiento.
          </p>
        </div>
        <OnboardingFlow onComplete={() => (window.location.href = '/documents')} />
      </div>
    )
  }

  const cards = [
    {
      label: 'Obligaciones identificadas',
      value: stats.obligations,
      icon: ListChecks,
      href: '/obligations',
    },
    {
      label: 'Riesgos prioritarios',
      value: stats.criticalRisks,
      icon: AlertTriangle,
      href: '/risks',
    },
    {
      label: 'Evidencias disponibles',
      value: stats.evidence,
      icon: FileCheck2,
      href: '/documents',
    },
    {
      label: 'Acciones abiertas',
      value: stats.openActions,
      icon: CheckCircle2,
      href: '/roadmaps',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Workspace de cumplimiento</p>
          <h1 className="mt-1 text-3xl font-bold">{organization?.name || 'KUMPLIO'}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Sigue la trazabilidad desde la obligación hasta la evidencia, el riesgo y la acción correctiva.
          </p>
        </div>
        <Link
          href="/documents"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/85"
        >
          Agregar evidencia
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {warning && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
          {warning}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-3 text-3xl font-bold">{value}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Ámbitos de cumplimiento</h2>
            <p className="text-sm text-muted-foreground">
              Los proyectos actuales se mantienen como ámbitos mientras migramos al nuevo modelo de controles.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="font-medium">Aún no existen ámbitos configurados.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Carga un documento para generar las primeras obligaciones y riesgos.
              </p>
            </div>
          ) : (
            projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex flex-col gap-3 rounded-lg border border-border p-4 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.description || 'Ámbito regulatorio sin descripción.'}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-primary">
                    {project.compliance_score ?? 0}% registrado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.updated_at
                      ? `Actualizado ${new Date(project.updated_at).toLocaleDateString('es-CL')}`
                      : 'Sin fecha de actualización'}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
