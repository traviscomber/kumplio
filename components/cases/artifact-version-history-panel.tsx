'use client'

import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Columns2,
  FileClock,
  GitBranch,
  Hash,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'

export type ArtifactVersionItem = {
  id: string
  lineageId: string
  parentArtifactId: string | null
  title: string
  artifactType: string
  version: number
  status: string
  content: unknown
  sourceCount: number
  contentHash: string
  createdAt: string
  createdByName: string | null
  approvedAt: string | null
  approvedByName: string | null
  lockedAt: string | null
  supersededAt: string | null
  reviewDecision: string | null
  reviewComment: string | null
}

type Props = {
  artifacts: ArtifactVersionItem[]
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  pending_review: 'En revisión',
  changes_requested: 'Cambios solicitados',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  superseded: 'Reemplazado',
}

const statusClasses: Record<string, string> = {
  approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  pending_review: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  changes_requested: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  superseded: 'border-border bg-muted text-muted-foreground',
  draft: 'border-border bg-muted text-muted-foreground',
}

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export function ArtifactVersionHistoryPanel({ artifacts }: Props) {
  const lineages = useMemo(() => {
    const grouped = new Map<string, ArtifactVersionItem[]>()
    for (const artifact of artifacts) {
      const current = grouped.get(artifact.lineageId) || []
      current.push(artifact)
      grouped.set(artifact.lineageId, current)
    }
    return [...grouped.entries()]
      .map(([lineageId, versions]) => ({
        lineageId,
        versions: versions.sort((left, right) => right.version - left.version),
      }))
      .sort((left, right) => new Date(right.versions[0].createdAt).getTime() - new Date(left.versions[0].createdAt).getTime())
  }, [artifacts])

  const [selectedLineageId, setSelectedLineageId] = useState(lineages[0]?.lineageId || '')
  const selectedLineage = lineages.find((item) => item.lineageId === selectedLineageId) || lineages[0]
  const defaultLeft = selectedLineage?.versions[1]?.id || selectedLineage?.versions[0]?.id || ''
  const defaultRight = selectedLineage?.versions[0]?.id || ''
  const [leftVersionId, setLeftVersionId] = useState(defaultLeft)
  const [rightVersionId, setRightVersionId] = useState(defaultRight)

  function selectLineage(lineageId: string) {
    setSelectedLineageId(lineageId)
    const lineage = lineages.find((item) => item.lineageId === lineageId)
    setLeftVersionId(lineage?.versions[1]?.id || lineage?.versions[0]?.id || '')
    setRightVersionId(lineage?.versions[0]?.id || '')
  }

  if (!artifacts.length) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <GitBranch className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">Aún no existen artefactos versionados.</p>
        <p className="mt-1 text-sm text-muted-foreground">Las ejecuciones agentic del expediente crearán el primer linaje.</p>
      </section>
    )
  }

  const leftVersion = selectedLineage?.versions.find((item) => item.id === leftVersionId) || selectedLineage?.versions[0]
  const rightVersion = selectedLineage?.versions.find((item) => item.id === rightVersionId) || selectedLineage?.versions[0]

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><GitBranch className="h-5 w-5" /></div>
        <div>
          <h2 className="text-xl font-bold">Versiones de artefactos</h2>
          <p className="text-sm text-muted-foreground">Linaje, hash, revisión y comparación sin sobrescribir resultados anteriores.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {lineages.map((lineage) => {
            const latest = lineage.versions[0]
            const approved = lineage.versions.find((item) => item.status === 'approved')
            return (
              <button
                key={lineage.lineageId}
                type="button"
                onClick={() => selectLineage(lineage.lineageId)}
                className={`w-full rounded-xl border p-4 text-left transition ${selectedLineage?.lineageId === lineage.lineageId ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{latest.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{latest.artifactType} · {lineage.versions.length} versión(es)</p>
                  </div>
                  {approved ? <LockKeyhole className="h-4 w-4 shrink-0 text-emerald-600" /> : <FileClock className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span>Última: v{latest.version}</span>
                  <span className={`rounded-full border px-2 py-1 font-semibold ${statusClasses[latest.status] || statusClasses.draft}`}>{statusLabels[latest.status] || latest.status}</span>
                </div>
              </button>
            )
          })}
        </aside>

        {selectedLineage && leftVersion && rightVersion && (
          <div className="min-w-0 space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              {selectedLineage.versions.map((version) => (
                <article key={version.id} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">Versión {version.version}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString('es-CL')} · {version.createdByName || 'Autor no disponible'}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClasses[version.status] || statusClasses.draft}`}>{statusLabels[version.status] || version.status}</span>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Hash className="h-3.5 w-3.5" /><code>{version.contentHash.slice(0, 16)}…</code></div>
                    <div>{version.sourceCount} referencia(s) de fuente</div>
                    {version.parentArtifactId && <div>Derivada de una versión anterior</div>}
                    {version.lockedAt && <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300"><LockKeyhole className="h-3.5 w-3.5" />Bloqueada {new Date(version.lockedAt).toLocaleString('es-CL')}</div>}
                    {version.approvedAt && <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" />Aprobada por {version.approvedByName || 'revisor'} el {new Date(version.approvedAt).toLocaleString('es-CL')}</div>}
                    {version.supersededAt && <div>Reemplazada el {new Date(version.supersededAt).toLocaleString('es-CL')}</div>}
                  </div>

                  {version.reviewDecision && (
                    <div className="mt-3 rounded-lg bg-muted/60 p-3 text-xs">
                      <strong>Revisión:</strong> {statusLabels[version.reviewDecision] || version.reviewDecision}
                      {version.reviewComment ? ` · ${version.reviewComment}` : ''}
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background p-5">
              <div className="flex items-center gap-2"><Columns2 className="h-5 w-5 text-primary" /><h3 className="font-bold">Comparar versiones</h3></div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Versión base
                  <select value={leftVersion.id} onChange={(event) => setLeftVersionId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                    {selectedLineage.versions.map((version) => <option key={version.id} value={version.id}>v{version.version} · {statusLabels[version.status] || version.status}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Versión comparada
                  <select value={rightVersion.id} onChange={(event) => setRightVersionId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                    {selectedLineage.versions.map((version) => <option key={version.id} value={version.id}>v{version.version} · {statusLabels[version.status] || version.status}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between gap-3 text-xs"><strong>v{leftVersion.version}</strong><span>{leftVersion.contentHash.slice(0, 12)}…</span></div>
                  <pre className="mt-2 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">{pretty(leftVersion.content)}</pre>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 text-xs"><strong>v{rightVersion.version}</strong><span>{rightVersion.contentHash.slice(0, 12)}…</span></div>
                  <pre className="mt-2 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">{pretty(rightVersion.content)}</pre>
                </div>
              </div>

              {leftVersion.contentHash === rightVersion.contentHash && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Ambas versiones tienen el mismo contenido normalizado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
