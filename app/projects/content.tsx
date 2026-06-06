'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, AlertTriangle, CheckCircle, MoreVertical } from 'lucide-react'
import Link from 'next/link'

export function ProjectsContent() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = '/sign-in'
          return
        }

        // Get organization
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single()

        const orgId = memberData?.organization_id
        if (orgId) {
          const { data: projectList } = await supabase
            .from('projects')
            .select('*')
            .eq('organization_id', orgId)
            .order('updated_at', { ascending: false })
          
          if (projectList) {
            setProjects(projectList)
          }
        }
      } catch (error) {
        console.error('[v0] Projects load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  if (loading) {
    return <div className="text-center py-12">Cargando proyectos...</div>
  }

  const getSeverityCounts = (project: any) => {
    // This would normally come from database
    return { critical: 0, high: 0, medium: 0 }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proyectos</h1>
          <p className="text-muted-foreground mt-1">Gestiona todos tus proyectos de auditoría</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo proyecto
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-muted-foreground mb-4">No hay proyectos aún</p>
            <Button asChild variant="outline">
              <Link href="/projects/new">Crear primer proyecto</Link>
            </Button>
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {project.description || 'Sin descripción'}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">Vulnerabilidades</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Cumplimiento: {project.compliance_score}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {project.status === 'active' ? 'Activo' : 'Archivado'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {project.last_scan_date
                      ? `Última actualización: ${new Date(project.last_scan_date).toLocaleDateString('es-CL')}`
                      : 'Sin escaneos'}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
