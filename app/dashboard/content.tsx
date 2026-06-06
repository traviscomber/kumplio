'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, AlertTriangle, CheckCircle, Activity, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalProjects: number
  criticalVulns: number
  complianceScore: number
  recentScans: number
}

export function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    criticalVulns: 0,
    complianceScore: 0,
    recentScans: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          window.location.href = '/sign-in'
          return
        }

        setUser(authUser)

        // Get organization
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', authUser.id)
          .single()

        const orgId = memberData?.organization_id
        if (orgId) {
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single()
          
          setOrganization(org)

          // Get projects
          const { data: projectList } = await supabase
            .from('projects')
            .select('*')
            .eq('organization_id', orgId)
            .order('updated_at', { ascending: false })
          
          if (projectList) {
            setProjects(projectList)

            // Calculate stats
            let totalCritical = 0
            let totalScore = 0

            for (const project of projectList) {
              const { data: vulns } = await supabase
                .from('vulnerabilities')
                .select('severity')
                .eq('project_id', project.id)
                .eq('severity', 'critical')
              
              totalCritical += vulns?.length || 0
              totalScore += project.compliance_score || 0
            }

            setStats({
              totalProjects: projectList.length,
              criticalVulns: totalCritical,
              complianceScore: projectList.length > 0 ? Math.round(totalScore / projectList.length) : 0,
              recentScans: projectList.filter(p => p.last_scan_date).length,
            })
          }
        }
      } catch (error) {
        console.error('[v0] Dashboard load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {organization ? `${organization.name}` : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">Cumplimiento y seguridad en tiempo real</p>
        </div>
        <Link href="/projects/new" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/80 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo proyecto
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Proyectos activos</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.totalProjects}</p>
            </div>
            <Activity className="w-12 h-12 text-primary/20" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vulnerabilidades críticas</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.criticalVulns}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500/20" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Puntuación de cumplimiento</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.complianceScore}%</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500/20" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Escaneos recientes</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.recentScans}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500/20" />
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Proyectos recientes</h2>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No hay proyectos aún</p>
            <Link href="/projects/new" className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/80 transition-colors">
              Crear primer proyecto
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.description || 'Sin descripción'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{project.compliance_score}%</p>
                  <p className="text-xs text-muted-foreground">
                    {project.last_scan_date
                      ? `Última actualización: ${new Date(project.last_scan_date).toLocaleDateString('es-CL')}`
                      : 'Sin escaneos'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
