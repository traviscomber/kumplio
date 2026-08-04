'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, FileText } from 'lucide-react'
import { TopNav } from '@/components/layout/top-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RegulatoryFramework, RegulatoryRequirement } from '@/lib/services/regulatory'

type RegulatoryStats = {
  totalFrameworks: number
  totalRequirements: number
  bySeverity: Record<string, number>
  byCategory: Record<string, number>
}

async function requestRegulatory<T>(query: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/regulatory?${query}`, {
    signal,
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'No fue posible consultar la base regulatoria.')
  }

  return payload as T
}

export default function RegulatoryDatabasePageClient() {
  const [industries, setIndustries] = useState<string[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [frameworks, setFrameworks] = useState<RegulatoryFramework[]>([])
  const [requirements, setRequirements] = useState<RegulatoryRequirement[]>([])
  const [stats, setStats] = useState<RegulatoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadIndustries() {
      setLoading(true)
      setError('')

      try {
        const payload = await requestRegulatory<{ industries: string[] }>('type=industries', controller.signal)
        setIndustries(payload.industries)
        setSelectedIndustry((current) => current || payload.industries[0] || '')
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar las industrias.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadIndustries()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!selectedIndustry) {
      setFrameworks([])
      setRequirements([])
      setStats(null)
      return
    }

    const controller = new AbortController()

    async function loadIndustryData() {
      setLoading(true)
      setError('')

      try {
        const encodedIndustry = encodeURIComponent(selectedIndustry)
        const [frameworkPayload, requirementPayload, statsPayload] = await Promise.all([
          requestRegulatory<{ frameworks: RegulatoryFramework[] }>(
            `type=frameworks&industry=${encodedIndustry}`,
            controller.signal,
          ),
          requestRegulatory<{ requirements: RegulatoryRequirement[] }>(
            'type=requirements',
            controller.signal,
          ),
          requestRegulatory<{ stats: RegulatoryStats }>(
            `type=stats&industry=${encodedIndustry}`,
            controller.signal,
          ),
        ])

        const frameworkIds = new Set(frameworkPayload.frameworks.map((framework) => framework.id))
        setFrameworks(frameworkPayload.frameworks)
        setRequirements(
          requirementPayload.requirements.filter((requirement) => frameworkIds.has(requirement.framework_id)),
        )
        setStats(statsPayload.stats)
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar la información regulatoria.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadIndustryData()
    return () => controller.abort()
  }, [selectedIndustry])

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Base de Datos Regulatoria</h1>
            <p className="text-muted-foreground">Explora regulaciones, leyes y estándares de cumplimiento por industria.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-6">
            <label className="mb-3 block text-sm font-medium">Seleccionar industria</label>
            {industries.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <button
                    key={industry}
                    type="button"
                    onClick={() => setSelectedIndustry(industry)}
                    className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                      selectedIndustry === industry
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {loading ? 'Cargando industrias…' : 'No hay industrias disponibles.'}
              </p>
            )}
          </div>

          {loading && selectedIndustry && (
            <p className="text-sm text-muted-foreground">Actualizando información regulatoria…</p>
          )}

          {stats && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Marcos regulatorios" value={stats.totalFrameworks} Icon={BookOpen} />
              <StatCard title="Requisitos" value={stats.totalRequirements} Icon={FileText} />
              <StatCard title="Críticos" value={stats.bySeverity.critical || 0} Icon={AlertTriangle} valueClass="text-red-600" />
              <StatCard title="Altos" value={stats.bySeverity.high || 0} Icon={AlertTriangle} valueClass="text-orange-600" />
            </div>
          )}

          <Tabs defaultValue="frameworks" className="w-full">
            <TabsList>
              <TabsTrigger value="frameworks">Marcos Regulatorios</TabsTrigger>
              <TabsTrigger value="requirements">Requisitos</TabsTrigger>
            </TabsList>

            <TabsContent value="frameworks" className="space-y-4">
              {frameworks.map((framework) => (
                <Card key={framework.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle>{framework.title}</CardTitle>
                        <CardDescription>{framework.description}</CardDescription>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{framework.type}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Año de promulgación: {framework.year_enacted}</p>
                  </CardContent>
                </Card>
              ))}
              {!loading && frameworks.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No hay marcos regulatorios para esta industria.
                </p>
              )}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              {requirements.map((requirement) => (
                <Card key={requirement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base">{requirement.title}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">Código: {requirement.requirement_code}</p>
                      </div>
                      <span className={`whitespace-nowrap rounded px-3 py-1 text-xs font-medium ${severityClass(requirement.severity)}`}>
                        {requirement.severity.toUpperCase()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{requirement.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {requirement.category && <Detail label="Categoría" value={requirement.category} />}
                      {requirement.frequency && <Detail label="Frecuencia" value={requirement.frequency} />}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!loading && requirements.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No hay requisitos regulatorios para esta industria.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  title,
  value,
  Icon,
  valueClass = '',
}: {
  title: string
  value: number
  Icon: typeof BookOpen
  valueClass?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent><p className={`text-2xl font-bold ${valueClass}`}>{value}</p></CardContent>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>
}

function severityClass(severity: RegulatoryRequirement['severity']) {
  return {
    critical: 'bg-red-500/10 text-red-700 dark:text-red-400',
    high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    low: 'bg-green-500/10 text-green-700 dark:text-green-400',
  }[severity]
}
