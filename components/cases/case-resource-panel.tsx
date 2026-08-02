'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  FileCheck2,
  FileText,
  Link2,
  ListChecks,
  Loader2,
  Plus,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Unlink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export type CaseResourceType = 'document' | 'obligation' | 'control' | 'evidence' | 'finding' | 'risk' | 'action'

export type CaseResourceItem = {
  id: string
  type: CaseResourceType
  title: string
  detail: string | null
  status: string | null
  linkId?: string
  linkedAt?: string
}

type Props = {
  caseId: string
  projectName: string | null
  linkedResources: CaseResourceItem[]
  availableResources: CaseResourceItem[]
  reviewCount: number
  artifactCount: number
}

const resourceConfig: Record<CaseResourceType, {
  label: string
  singular: string
  description: string
  href: string
  icon: typeof FileText
}> = {
  document: {
    label: 'Fuentes',
    singular: 'fuente',
    description: 'Contratos, políticas, normativa y documentos de respaldo.',
    href: '/documents',
    icon: FileText,
  },
  obligation: {
    label: 'Obligaciones',
    singular: 'obligación',
    description: 'Requisitos identificados que deben evaluarse dentro del expediente.',
    href: '/obligations',
    icon: ListChecks,
  },
  control: {
    label: 'Controles',
    singular: 'control',
    description: 'Actividades verificables diseñadas para cubrir obligaciones y riesgos.',
    href: '/controls',
    icon: ShieldCheck,
  },
  evidence: {
    label: 'Evidencias',
    singular: 'evidencia',
    description: 'Registros con origen, vigencia e integridad que respaldan los controles.',
    href: '/evidence',
    icon: FileCheck2,
  },
  finding: {
    label: 'Hallazgos',
    singular: 'hallazgo',
    description: 'Brechas o desviaciones detectadas durante la evaluación.',
    href: '/findings',
    icon: SearchCheck,
  },
  risk: {
    label: 'Riesgos',
    singular: 'riesgo',
    description: 'Exposiciones asociadas a las obligaciones y hallazgos.',
    href: '/risks',
    icon: ShieldAlert,
  },
  action: {
    label: 'Acciones',
    singular: 'acción',
    description: 'Medidas de implementación, corrección o seguimiento.',
    href: '/roadmaps',
    icon: CheckCircle2,
  },
}

const resourceTypes = Object.keys(resourceConfig) as CaseResourceType[]

export function CaseResourcePanel({
  caseId,
  projectName,
  linkedResources,
  availableResources,
  reviewCount,
  artifactCount,
}: Props) {
  const router = useRouter()
  const initialType = resourceTypes.find((type) => availableResources.some((resource) => resource.type === type)) || 'document'
  const [resourceType, setResourceType] = useState<CaseResourceType>(initialType)
  const [resourceId, setResourceId] = useState('')
  const [workingKey, setWorkingKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const availableForType = useMemo(
    () => availableResources.filter((resource) => resource.type === resourceType),
    [availableResources, resourceType],
  )

  const linkedByType = useMemo(() => {
    const grouped = new Map<CaseResourceType, CaseResourceItem[]>()
    resourceTypes.forEach((type) => grouped.set(type, []))
    linkedResources.forEach((resource) => grouped.get(resource.type)?.push(resource))
    return grouped
  }, [linkedResources])

  const counts = Object.fromEntries(
    resourceTypes.map((type) => [type, linkedByType.get(type)?.length || 0]),
  ) as Record<CaseResourceType, number>

  const verificationChecks = [
    { label: 'Existe al menos una fuente vinculada', done: counts.document > 0 },
    { label: 'Existe al menos una obligación vinculada', done: counts.obligation > 0 },
    { label: 'Existe al menos un control vinculado', done: counts.control > 0 },
    { label: 'Existe evidencia vinculada al expediente', done: counts.evidence > 0 },
    { label: 'Existe análisis mediante hallazgo o riesgo', done: counts.finding + counts.risk > 0 },
    { label: 'Existe al menos una acción vinculada', done: counts.action > 0 },
    { label: 'Existe artefacto IA o revisión humana', done: artifactCount > 0 || reviewCount > 0 },
  ]
  const completedChecks = verificationChecks.filter((check) => check.done).length

  async function linkResource() {
    if (!resourceId) return
    const key = `link:${resourceType}:${resourceId}`
    setWorkingKey(key)
    setFeedback(null)

    try {
      const response = await fetch(`/api/cases/${caseId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceType, resourceId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible vincular el recurso.')

      setResourceId('')
      setFeedback({ type: 'success', message: 'Recurso vinculado al expediente.' })
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible vincular el recurso.' })
    } finally {
      setWorkingKey(null)
    }
  }

  async function unlinkResource(linkId: string) {
    const key = `unlink:${linkId}`
    setWorkingKey(key)
    setFeedback(null)

    try {
      const response = await fetch(`/api/cases/${caseId}/resources`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'No fue posible desvincular el recurso.')

      setFeedback({ type: 'success', message: 'Recurso desvinculado del expediente.' })
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible desvincular el recurso.' })
    } finally {
      setWorkingKey(null)
    }
  }

  if (!projectName) {
    return (
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <h2 className="font-semibold">Define un ámbito antes de integrar recursos</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El expediente necesita un proyecto asociado para validar que todos los recursos pertenezcan al mismo contexto.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><Link2 className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Contenido del expediente</h2>
              <p className="text-sm text-muted-foreground">Recursos vinculados desde el ámbito “{projectName}”.</p>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
            Los recursos no se copian ni se modifican. El expediente conserva vínculos explícitos y auditables hacia la información original.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background p-4 lg:min-w-80">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold">Progreso verificable</p>
            <span className="text-sm font-bold text-primary">{completedChecks} de {verificationChecks.length}</span>
          </div>
          <div className="mt-4 space-y-2">
            {verificationChecks.map((check) => (
              <div key={check.label} className="flex items-start gap-2 text-xs">
                {check.done
                  ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className={check.done ? 'text-foreground' : 'text-muted-foreground'}>{check.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Este indicador mide elementos registrados y revisables; no certifica cumplimiento legal.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-background p-4">
        <p className="text-sm font-semibold">Vincular un recurso existente</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr_auto]">
          <select
            value={resourceType}
            onChange={(event) => {
              setResourceType(event.target.value as CaseResourceType)
              setResourceId('')
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {resourceTypes.map((type) => (
              <option key={type} value={type}>{resourceConfig[type].label}</option>
            ))}
          </select>

          <select
            value={resourceId}
            onChange={(event) => setResourceId(event.target.value)}
            className="min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">{availableForType.length ? `Selecciona una ${resourceConfig[resourceType].singular}` : 'No hay recursos disponibles'}</option>
            {availableForType.map((resource) => (
              <option key={resource.id} value={resource.id}>{resource.title}</option>
            ))}
          </select>

          <Button onClick={linkResource} disabled={!resourceId || workingKey !== null} className="gap-2">
            {workingKey?.startsWith('link:') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Vincular
          </Button>
        </div>

        {!availableForType.length && (
          <p className="mt-3 text-xs text-muted-foreground">
            Aún no existen {resourceConfig[resourceType].label.toLowerCase()} sin vincular.{' '}
            <Link href={resourceConfig[resourceType].href} className="font-medium text-primary hover:underline">Abrir módulo</Link>
          </p>
        )}

        {feedback && (
          <div className={`mt-3 rounded-lg border p-3 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
            {feedback.message}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {resourceTypes.map((type) => {
          const config = resourceConfig[type]
          const Icon = config.icon
          const resources = linkedByType.get(type) || []

          return (
            <article key={type} className="rounded-xl border border-border bg-background p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-bold">{config.label}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{resources.length}</span>
              </div>

              <div className="mt-4 space-y-2">
                {resources.length ? resources.map((resource) => (
                  <div key={resource.linkId} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{resource.title}</p>
                        {resource.detail && <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{resource.detail}</p>}
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          {resource.status && <span className="rounded-full bg-muted px-2 py-1">{resource.status}</span>}
                          {resource.linkedAt && <span>Vinculado {new Date(resource.linkedAt).toLocaleDateString('es-CL')}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => resource.linkId && unlinkResource(resource.linkId)}
                        disabled={!resource.linkId || workingKey !== null}
                        className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                        aria-label={`Desvincular ${resource.title}`}
                      >
                        {workingKey === `unlink:${resource.linkId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-lg border border-dashed border-border p-5 text-center">
                    <p className="text-sm font-medium">Sin {config.label.toLowerCase()} vinculadas.</p>
                    <Link href={config.href} className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">Abrir módulo</Link>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
