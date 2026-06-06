'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TopNav } from '@/components/layout/top-nav'
import { SeverityBadge, StatusBadge } from '@/components/ui/badges'
import { Button } from '@/components/ui/button'
import { Plus, ChevronLeft, Zap, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function ProjectDetailPageClient() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<any>(null)
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([])
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    const loadProject = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = '/sign-in'
          return
        }

        const { data: proj } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()
        
        setProject(proj)

        const { data: vulns } = await supabase
          .from('vulnerabilities')
          .select('*')
          .eq('project_id', projectId)
          .order('discovered_at', { ascending: false })
        
        setVulnerabilities(vulns || [])

        const { data: history } = await supabase
          .from('scan_history')
          .select('*')
          .eq('project_id', projectId)
          .order('scan_date', { ascending: false })
          .limit(10)
        
        setScanHistory(history || [])
      } catch (error) {
        console.error('[v0] Project load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  const handleRunScan = async () => {
    setScanning(true)
    try {
      // Mock scan with sample data
      const mockFindings = [
        {
          title: 'API sin autenticación detectada',
          description: 'El endpoint /api/users no requiere autenticación',
          severity: 'critical',
          category: 'access-control',
        },
        {
          title: 'Datos no encriptados en tránsito',
          description: 'Algunos datos sensibles se transmiten sin HTTPS',
          severity: 'high',
          category: 'data-protection',
        },
        {
          title: 'Dependencia desactualizada',
          description: 'lodash <4.17.21 tiene vulnerabilidad de Prototype Pollution',
          severity: 'high',
          category: 'dependency',
        },
      ]

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          code: 'mock',
          dependencies: { lodash: '4.17.20' },
          config: {},
        }),
      })

      if (response.ok) {
        // Reload data
        const proj = await getProject(projectId)
        setProject(proj)
        const vulns = await getVulnerabilities(projectId)
        setVulnerabilities(vulns)
      }
    } catch (error) {
      console.error('[v0] Scan error:', error)
    } finally {
      setScanning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center py-12">Cargando proyecto...</div>
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center py-12">Proyecto no encontrado</div>
        </main>
      </div>
    )
  }

  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length
  const severityBreakdown = {
    critical: criticalCount,
    high: highCount,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/projects" className="flex items-center gap-2 text-primary hover:underline mb-8">
          <ChevronLeft className="w-4 h-4" />
          Volver a proyectos
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="text-muted-foreground mt-2">{project.description}</p>
          </div>
          <Button onClick={handleRunScan} disabled={scanning}>
            <Zap className="w-4 h-4 mr-2" />
            {scanning ? 'Escaneando...' : 'Ejecutar escaneo'}
          </Button>
        </div>

        {/* Compliance Score */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Puntuación de cumplimiento</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Basada en vulnerabilidades detectadas y requisitos de Ley 21.719
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">{project.compliance_score}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {project.last_scan_date
                  ? `Última actualización: ${new Date(project.last_scan_date).toLocaleDateString('es-CL')}`
                  : 'Sin escaneos'}
              </p>
            </div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase">Crítico</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{severityBreakdown.critical}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase">Alto</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{severityBreakdown.high}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase">Medio</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{severityBreakdown.medium}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase">Bajo</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{severityBreakdown.low}</p>
          </div>
        </div>

        {/* Vulnerabilities List */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Vulnerabilidades detectadas ({vulnerabilities.length})
          </h2>

          {vulnerabilities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se detectaron vulnerabilidades</p>
              <p className="text-sm text-muted-foreground mt-2">Ejecuta un escaneo para analizar tu proyecto</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vulnerabilities.map((vuln) => (
                <div key={vuln.id} className="border border-border rounded-lg p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{vuln.title}</h3>
                        <SeverityBadge severity={vuln.severity} />
                        <StatusBadge status={vuln.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{vuln.description}</p>
                      {vuln.remediation && (
                        <div className="bg-blue-500/5 border border-blue-200/20 rounded p-2">
                          <p className="text-xs text-foreground">
                            <span className="font-medium">Remediación:</span> {vuln.remediation}
                          </p>
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
