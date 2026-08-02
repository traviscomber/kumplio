'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  History,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type EvidenceOption = {
  id: string
  name: string
  validationStatus: string
  integrityStatus: string
  sufficiencyStatus: string
  expiresAt: string | null
}

type CaseOption = {
  id: string
  title: string
}

export type ControlEvaluationItem = {
  id: string
  evaluationType: 'design' | 'operating'
  result: 'effective' | 'partial' | 'ineffective' | 'not_applicable'
  summary: string | null
  sampleSize: number | null
  periodStart: string | null
  periodEnd: string | null
  evaluatedAt: string
  evaluatorName: string | null
  caseId: string | null
  caseTitle: string | null
  evidenceNames: string[]
}

type Props = {
  controlId: string
  designEffectiveness: string
  operatingEffectiveness: string
  evidence: EvidenceOption[]
  cases: CaseOption[]
  evaluations: ControlEvaluationItem[]
}

const resultLabels: Record<string, string> = {
  effective: 'Efectivo',
  partial: 'Parcial',
  ineffective: 'Inefectivo',
  not_applicable: 'No aplica',
  not_evaluated: 'No evaluado',
}

const resultClasses: Record<string, string> = {
  effective: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  partial: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ineffective: 'border-destructive/30 bg-destructive/10 text-destructive',
  not_applicable: 'border-border bg-muted text-muted-foreground',
  not_evaluated: 'border-border bg-muted text-muted-foreground',
}

function dateLabel(value: string | null) {
  return value ? new Date(`${value}T12:00:00.000Z`).toLocaleDateString('es-CL') : null
}

export function ControlAssurancePanel({
  controlId,
  designEffectiveness,
  operatingEffectiveness,
  evidence,
  cases,
  evaluations,
}: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(!evaluations.length)
  const [evaluationType, setEvaluationType] = useState<'design' | 'operating'>('design')
  const [result, setResult] = useState<'effective' | 'partial' | 'ineffective' | 'not_applicable'>('effective')
  const [summary, setSummary] = useState('')
  const [sampleSize, setSampleSize] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [caseId, setCaseId] = useState('')
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  const latestByType = useMemo(() => ({
    design: evaluations.find((item) => item.evaluationType === 'design') || null,
    operating: evaluations.find((item) => item.evaluationType === 'operating') || null,
  }), [evaluations])

  function toggleEvidence(evidenceId: string) {
    setSelectedEvidence((current) => current.includes(evidenceId)
      ? current.filter((id) => id !== evidenceId)
      : [...current, evidenceId])
  }

  async function submitEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch(`/api/controls/${controlId}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationType,
          result,
          summary,
          sampleSize: sampleSize ? Number(sampleSize) : null,
          periodStart: periodStart || null,
          periodEnd: periodEnd || null,
          caseId: caseId || null,
          evidenceIds: selectedEvidence,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible registrar la evaluación.')

      setSummary('')
      setSampleSize('')
      setPeriodStart('')
      setPeriodEnd('')
      setCaseId('')
      setSelectedEvidence([])
      setFeedback({ type: 'success', message: 'Evaluación registrada de forma inmutable.' })
      setShowForm(false)
      router.refresh()
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No fue posible registrar la evaluación.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        {([
          ['design', 'Efectividad de diseño', designEffectiveness, latestByType.design],
          ['operating', 'Efectividad operacional', operatingEffectiveness, latestByType.operating],
        ] as const).map(([type, label, currentResult, latest]) => (
          <article key={type} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-bold">{resultLabels[currentResult] || currentResult}</p>
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${resultClasses[currentResult] || resultClasses.not_evaluated}`}>
                {latest ? 'Evaluado' : 'Pendiente'}
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              {latest
                ? `Última evaluación: ${new Date(latest.evaluatedAt).toLocaleDateString('es-CL')}.`
                : 'Aún no existe una conclusión registrada para esta dimensión.'}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><ClipboardCheck className="h-5 w-5" /></div>
              <div>
                <h2 className="text-xl font-bold">Registrar evaluación</h2>
                <p className="text-sm text-muted-foreground">La conclusión y sus evidencias quedan inmutables.</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setShowForm((value) => !value)} variant={showForm ? 'outline' : 'default'}>
            {showForm ? 'Cerrar formulario' : 'Nueva evaluación'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={submitEvaluation} className="mt-6 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Tipo de evaluación
                <select value={evaluationType} onChange={(event) => setEvaluationType(event.target.value as typeof evaluationType)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                  <option value="design">Diseño</option>
                  <option value="operating">Operación</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium">
                Conclusión
                <select value={result} onChange={(event) => setResult(event.target.value as typeof result)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                  <option value="effective">Efectivo</option>
                  <option value="partial">Parcial</option>
                  <option value="ineffective">Inefectivo</option>
                  <option value="not_applicable">No aplica</option>
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium md:col-span-2">
                Conclusión fundamentada
                <textarea value={summary} onChange={(event) => setSummary(event.target.value)} minLength={10} maxLength={4000} rows={5} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Explica qué se revisó, qué se observó y por qué la conclusión es sostenible." required />
              </label>

              <label className="space-y-2 text-sm font-medium">
                Inicio del período
                <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
              </label>

              <label className="space-y-2 text-sm font-medium">
                Fin del período
                <input type="date" min={periodStart || undefined} value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
              </label>

              <label className="space-y-2 text-sm font-medium">
                Tamaño de muestra
                <input type="number" min={1} max={1000000} value={sampleSize} onChange={(event) => setSampleSize(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" placeholder="Opcional" />
              </label>

              <label className="space-y-2 text-sm font-medium">
                Expediente relacionado
                <select value={caseId} onChange={(event) => setCaseId(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2">
                  <option value="">Sin expediente asociado</option>
                  {cases.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Evidencia utilizada</p>
                  <p className="mt-1 text-xs text-muted-foreground">Solo se muestran evidencias previamente vinculadas al control.</p>
                </div>
                <Link href="/evidence" className="text-xs font-semibold text-primary hover:underline">Gestionar evidencias</Link>
              </div>

              {!evidence.length ? (
                <div className="mt-3 rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                  Vincula evidencia al control antes de registrar una evaluación sustentada.
                </div>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {evidence.map((item) => {
                    const selected = selectedEvidence.includes(item.id)
                    const expired = item.expiresAt ? new Date(item.expiresAt).getTime() < Date.now() : false
                    return (
                      <label key={item.id} className={`cursor-pointer rounded-xl border p-4 transition ${selected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/40'}`}>
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={selected} onChange={() => toggleEvidence(item.id)} className="mt-1" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{item.name}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                              <span>{item.validationStatus}</span>
                              <span>Integridad: {item.integrityStatus}</span>
                              <span>Suficiencia: {item.sufficiencyStatus}</span>
                              {expired && <span className="font-semibold text-destructive">Vencida</span>}
                            </div>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {feedback && (
              <div className={`rounded-lg border p-3 text-sm ${feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
                {feedback.message}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Registrar evaluación
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary"><History className="h-5 w-5" /></div>
          <div>
            <h2 className="text-xl font-bold">Historial inmutable</h2>
            <p className="text-sm text-muted-foreground">Cada evaluación conserva revisor, período, muestra, expediente y evidencias.</p>
          </div>
        </div>

        {!evaluations.length ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">Aún no hay evaluaciones.</p>
            <p className="mt-1 text-sm text-muted-foreground">Registra una evaluación de diseño u operación para comenzar el historial.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {evaluations.map((item) => (
              <article key={item.id} className="rounded-xl border border-border bg-background p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">{item.evaluationType === 'design' ? 'Diseño' : 'Operación'}</span>
                      <span className={`rounded-full border px-2.5 py-1 font-semibold ${resultClasses[item.result]}`}>{resultLabels[item.result]}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6">{item.summary || 'Sin resumen registrado.'}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">{new Date(item.evaluatedAt).toLocaleString('es-CL')}</p>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                  <div><strong className="text-foreground">Revisor:</strong> {item.evaluatorName || 'No disponible'}</div>
                  <div><strong className="text-foreground">Período:</strong> {dateLabel(item.periodStart) || '—'} a {dateLabel(item.periodEnd) || '—'}</div>
                  <div><strong className="text-foreground">Muestra:</strong> {item.sampleSize ?? 'No informada'}</div>
                  <div><strong className="text-foreground">Expediente:</strong> {item.caseId ? <Link href={`/cases/${item.caseId}`} className="text-primary hover:underline">{item.caseTitle || 'Abrir caso'}</Link> : 'Sin caso'}</div>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-xs font-semibold"><FileCheck2 className="h-4 w-4 text-primary" /> Evidencia utilizada ({item.evidenceNames.length})</div>
                  {item.evidenceNames.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.evidenceNames.map((name) => <span key={name} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{name}</span>)}
                    </div>
                  ) : <p className="mt-2 text-xs text-muted-foreground">La evaluación no registró evidencia vinculada.</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
