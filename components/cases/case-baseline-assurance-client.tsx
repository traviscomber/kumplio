'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

type Mission = {
  id: string
  title: string
  status: string
  dueAt: string | null
  completedAt: string | null
  ownerId: string | null
  ownerName: string
}

type EvidenceRequest = {
  id: string
  title: string
  status: string
  dueAt: string | null
  reviewComment: string | null
  reviewedAt: string | null
}

type Control = {
  id: string
  name: string
  designEffectiveness: string
  operatingEffectiveness: string
  lastEvaluatedAt: string | null
}

type Evidence = {
  id: string
  name: string
  validationStatus: string
  integrityStatus: string
  integrityHash: string | null
  expiresAt: string | null
  unknowns: string[]
}

type Evaluation = {
  id: string
  type: string
  result: string
  summary: string
  evaluatedAt: string
}

type MissionResult = {
  id: string
  status: string
  summary: string
  reviewedAt: string | null
}

type Props = {
  caseId: string
  caseTitle: string
  mission: Mission
  request: EvidenceRequest
  control: Control | null
  evidence: Evidence | null
  evaluations: Evaluation[]
  missionResult: MissionResult | null
  canClose: boolean
  currentUserIsOwner: boolean
}

const defaultReview = 'Aceptada únicamente como línea base inicial de readiness: demuestra trazabilidad, responsable, hash y desconocidos explícitos; no acredita inventario completo ni cumplimiento legal.'
const defaultCompletion = 'Se cerró la misión de instalación de la línea base inicial. Permanecen abiertos el levantamiento corporativo, la validación jurídica y la prueba de completitud.'

export function CaseBaselineAssuranceClient({
  caseId,
  caseTitle,
  mission,
  request,
  control,
  evidence,
  evaluations,
  missionResult,
  canClose,
  currentUserIsOwner,
}: Props) {
  const router = useRouter()
  const [acceptInitialScope, setAcceptInitialScope] = useState(false)
  const [acceptPartialOperation, setAcceptPartialOperation] = useState(false)
  const [reviewComment, setReviewComment] = useState(defaultReview)
  const [completionNotes, setCompletionNotes] = useState(defaultCompletion)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const closed = mission.status === 'completed'
    && request.status === 'accepted'
    && Boolean(control && evidence && missionResult)
  const design = evaluations.find((item) => item.type === 'design')
  const operating = evaluations.find((item) => item.type === 'operating')
  const reviewState = request.status === 'accepted'
    ? 'Revisión humana registrada'
    : request.status === 'submitted'
      ? 'Pendiente de revisión'
      : 'Pendiente de entrega'
  const evidenceState = !evidence || evidence.validationStatus === 'rejected'
    ? 'Evidencia insuficiente'
    : ['accepted', 'verified'].includes(evidence.validationStatus)
      ? 'Evidencia revisada'
      : 'Pendiente de revisión'

  async function closeBaseline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    try {
      const response = await fetch(`/api/cases/${caseId}/baseline-assurance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: mission.id,
          requestId: request.id,
          reviewComment,
          completionNotes,
          acceptInitialScope,
          acceptPartialOperation,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'No fue posible cerrar la línea base.')
      setFeedback(payload.resumed ? 'El cierre existente fue recuperado sin crear duplicados.' : 'Línea base cerrada y registrada correctamente.')
      router.refresh()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No fue posible cerrar la línea base.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container mx-auto max-w-7xl px-4 pb-8 sm:px-6">
      <div className={`rounded-[28px] border p-6 shadow-sm sm:p-8 ${closed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-3 ${closed ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'}`}>
                {closed ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Aseguramiento del expediente</p>
                <h2 className="text-2xl font-black">{closed ? 'Línea base inicial cerrada.' : 'Cerrar una línea base honesta y verificable'}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {closed
                ? 'Kumplio conservó el alcance, la evidencia, el hash, la revisión humana y dos conclusiones separadas: diseño efectivo y operación parcial.'
                : 'Este cierre no inventa un inventario ni declara cumplimiento. Registra lo que hoy existe en Kumplio, identifica lo desconocido y deja una revisión futura programada.'}
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 px-5 py-4 text-sm">
            <p className="font-bold">{mission.title}</p>
            <p className="mt-1 text-muted-foreground">Responsable: {mission.ownerName}</p>
            <p className="mt-1 text-muted-foreground">Estado: {statusLabel(mission.status)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ResultCard
            label="Revisión humana"
            value={reviewState}
            detail={request.reviewComment || 'El estado proviene de la solicitud de evidencia persistida.'}
            tone={request.status === 'accepted' ? 'default' : 'warning'}
          />
          <ResultCard
            label="Evidencia"
            value={evidenceState}
            detail={evidence ? `Validación: ${statusLabel(evidence.validationStatus)}` : 'Todavía no existe evidencia vinculada suficiente para revisión.'}
            tone={evidenceState === 'Evidencia revisada' ? 'default' : 'warning'}
          />
        </div>

        {closed ? (
          <div className="mt-7 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ResultCard label="Solicitud" value="Aceptada" detail={request.reviewComment || 'Revisión humana registrada.'} />
              <ResultCard label="Diseño" value={effectivenessLabel(control?.designEffectiveness || design?.result)} detail="El control define alcance, responsable, vigencia y limitaciones." />
              <ResultCard label="Operación" value={effectivenessLabel(control?.operatingEffectiveness || operating?.result)} detail="Solo existe una ejecución; el universo corporativo sigue pendiente." tone="warning" />
              <ResultCard label="Integridad" value={evidence?.integrityStatus === 'verified' ? 'Verificada' : statusLabel(evidence?.integrityStatus || '')} detail={evidence?.integrityHash ? `${evidence.integrityHash.slice(0, 16)}…` : 'Sin hash'} />
            </div>

            {evidence?.unknowns.length ? (
              <div className="rounded-2xl border border-amber-500/30 bg-background/80 p-5">
                <div className="flex items-center gap-2 font-black"><AlertTriangle className="h-5 w-5 text-amber-600" /> Lo que sigue sin demostrarse</div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {evidence.unknowns.map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <ActionLink href={`/missions/${mission.id}`} label="Ver misión" />
              {control && <ActionLink href={`/controls/${control.id}`} label="Ver control" />}
              <ActionLink href="/evidence" label="Ver evidencia" />
              <ActionLink href="/insights" label="Ver confianza del alcance" />
            </div>
          </div>
        ) : (
          <div className="mt-7 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-4">
              <Boundary icon={FileCheck2} title="Evidencia real, no inventada" text="Se genera una fotografía estructurada desde el expediente, la organización y los registros que efectivamente existen." />
              <Boundary icon={Fingerprint} title="Integridad y vigencia" text="La evidencia recibe hash SHA-256, fecha de emisión, vencimiento y próxima revisión." />
              <Boundary icon={ShieldCheck} title="Dos conclusiones distintas" text="El diseño puede ser efectivo, mientras la operación permanece parcial hasta completar y probar el inventario." />
            </div>

            {canClose ? (
              <form onSubmit={closeBaseline} className="rounded-2xl border bg-background/85 p-5 sm:p-6">
                <h3 className="text-lg font-black">Confirmación de la persona responsable</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Caso: {caseTitle}. La acción creará o recuperará exactamente una obligación interna, un control, una evidencia, dos evaluaciones y un resultado de misión.
                </p>

                <label className="mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm">
                  <input type="checkbox" checked={acceptInitialScope} onChange={(event) => setAcceptInitialScope(event.target.checked)} className="mt-1 h-4 w-4" />
                  <span><strong>Acepto el alcance inicial.</strong> Esta evidencia no es un inventario completo ni certifica cumplimiento legal.</span>
                </label>
                <label className="mt-3 flex items-start gap-3 rounded-xl border p-4 text-sm">
                  <input type="checkbox" checked={acceptPartialOperation} onChange={(event) => setAcceptPartialOperation(event.target.checked)} className="mt-1 h-4 w-4" />
                  <span><strong>Acepto la operación parcial.</strong> El control debe revisarse nuevamente cuando existan procesos, sistemas, datos, terceros y documentos validados.</span>
                </label>

                <label className="mt-5 block text-sm font-bold">
                  Justificación de aceptación
                  <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} minLength={10} maxLength={2000} rows={4} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 font-normal leading-6" required />
                </label>
                <label className="mt-4 block text-sm font-bold">
                  Nota de cierre de la misión
                  <textarea value={completionNotes} onChange={(event) => setCompletionNotes(event.target.value)} minLength={10} maxLength={2000} rows={4} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 font-normal leading-6" required />
                </label>

                {feedback && <div className="mt-4 rounded-xl border bg-muted/50 p-4 text-sm">{feedback}</div>}

                <button
                  type="submit"
                  disabled={loading || !acceptInitialScope || !acceptPartialOperation}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Aceptar línea base y cerrar misión
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border bg-background/85 p-6">
                <h3 className="font-black">Requiere a la persona responsable</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {currentUserIsOwner
                    ? 'Tu rol no permite ejecutar este cierre.'
                    : `${mission.ownerName} debe confirmar el alcance y la operación parcial.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function Boundary({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-background/80 p-5">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  )
}

function ResultCard({ label, value, detail, tone = 'default' }: { label: string; value: string; detail: string; tone?: 'default' | 'warning' }) {
  return (
    <div className={`rounded-2xl border bg-background/80 p-5 ${tone === 'warning' ? 'border-amber-500/30' : ''}`}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm font-bold hover:border-primary/40 hover:text-primary">
      {label} <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    ready: 'Lista para iniciar', active: 'En curso', completed: 'Completada',
    open: 'Pendiente', submitted: 'Entregada', accepted: 'Aceptada', rejected: 'Rechazada',
    verified: 'Verificada', pending: 'Pendiente',
  }
  return labels[value] || value.replaceAll('_', ' ')
}

function effectivenessLabel(value?: string) {
  if (value === 'effective') return 'Efectivo'
  if (value === 'partial') return 'Parcial'
  if (value === 'ineffective') return 'Inefectivo'
  if (value === 'not_applicable') return 'No aplica'
  return 'Sin evaluar'
}
