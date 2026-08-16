'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@vercel/analytics'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Industry = 'general' | 'transport' | 'agriculture' | 'mining' | 'health' | 'finance' | 'construction' | 'other'
type OrganizationSize = 'micro' | 'small' | 'medium' | 'large' | 'enterprise'

type Props = {
  initialEmail: string
  initialOrganizationName?: string | null
  initialFirstName?: string | null
  initialLastName?: string | null
  nextPath?: string | null
}

const FUNNEL_STARTED_AT_KEY = 'kumplio:funnel-started-at'

const industries: Array<{ value: Industry; label: string }> = [
  { value: 'general', label: 'Servicios generales' },
  { value: 'transport', label: 'Transporte' },
  { value: 'agriculture', label: 'Agro' },
  { value: 'mining', label: 'Minería' },
  { value: 'health', label: 'Salud' },
  { value: 'finance', label: 'Financiero' },
  { value: 'construction', label: 'Construcción' },
  { value: 'other', label: 'Otra industria' },
]

const sizes: Array<{ value: OrganizationSize; label: string }> = [
  { value: 'micro', label: '1–9 personas' },
  { value: 'small', label: '10–49 personas' },
  { value: 'medium', label: '50–199 personas' },
  { value: 'large', label: '200–999 personas' },
  { value: 'enterprise', label: '1.000 o más' },
]

const suggestions: Record<Industry, { project: string; complianceCase: string }> = {
  general: { project: 'Ley 21.719 y protección de datos', complianceCase: 'Preparación para la Ley 21.719' },
  transport: { project: 'Cumplimiento de transporte y protección de datos', complianceCase: 'Diagnóstico inicial de flota, documentación y datos personales' },
  agriculture: { project: 'Cumplimiento agroalimentario y protección de datos', complianceCase: 'Diagnóstico inicial de trazabilidad, registros y datos personales' },
  mining: { project: 'Cumplimiento minero y protección de datos', complianceCase: 'Diagnóstico inicial de faena, contratistas y datos personales' },
  health: { project: 'Privacidad y cumplimiento en salud', complianceCase: 'Diagnóstico inicial de datos sensibles y procesos clínicos' },
  finance: { project: 'Privacidad y cumplimiento financiero', complianceCase: 'Diagnóstico inicial de datos financieros y decisiones automatizadas' },
  construction: { project: 'Cumplimiento de obras y protección de datos', complianceCase: 'Diagnóstico inicial de contratistas, seguridad y datos personales' },
  other: { project: 'Primer ámbito de cumplimiento', complianceCase: 'Diagnóstico inicial de cumplimiento' },
}

function funnelElapsedSeconds() {
  try {
    const startedAt = Number(window.sessionStorage.getItem(FUNNEL_STARTED_AT_KEY))
    if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > Date.now()) return null
    return Math.max(0, Math.round((Date.now() - startedAt) / 1000))
  } catch {
    return null
  }
}

export function WorkspaceOnboardingForm({
  initialEmail,
  initialOrganizationName,
  initialFirstName,
  initialLastName,
  nextPath,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [organizationName, setOrganizationName] = useState(initialOrganizationName || '')
  const [firstName, setFirstName] = useState(initialFirstName || '')
  const [lastName, setLastName] = useState(initialLastName || '')
  const [industry, setIndustry] = useState<Industry>('general')
  const [organizationSize, setOrganizationSize] = useState<OrganizationSize>('small')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const suggestion = useMemo(() => suggestions[industry], [industry])
  const totalSteps = 4
  const continuesCase = nextPath === '/cases/new'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/onboarding/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName,
          industry,
          organizationSize,
          firstName,
          lastName,
          projectName: suggestion.project,
          firstCaseTitle: suggestion.complianceCase,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible crear el workspace')

      const elapsedSeconds = funnelElapsedSeconds()
      track('Funnel Workspace Initialized', {
        continuation: continuesCase ? 'guided_case' : 'default',
        ...(elapsedSeconds === null ? {} : { elapsed_seconds: elapsedSeconds }),
      })

      const caseId = data.workspace?.caseId as string | null | undefined
      const destination = nextPath || (caseId ? `/cases/${caseId}` : '/dashboard')
      router.replace(destination)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible terminar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const canContinue = [
    firstName.trim().length > 0,
    organizationName.trim().length >= 2,
    Boolean(industry),
    Boolean(organizationSize),
  ][step]

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-primary">Paso {step + 1} de {totalSteps}</p>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
        </div>
      </div>

      {step === 0 && (
        <Question title="¿Cómo te llamas?" description="Lo usaré para dirigirme a ti durante la configuración.">
          <div className="grid gap-4 sm:grid-cols-2">
            <input autoFocus value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nombre" className="rounded-xl border bg-background px-4 py-4 text-base outline-none focus:ring-2 focus:ring-primary" />
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Apellido (opcional)" className="rounded-xl border bg-background px-4 py-4 text-base outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Cuenta verificada: {initialEmail}</p>
        </Question>
      )}

      {step === 1 && (
        <Question title="¿Cómo se llama tu organización?" description="Crearé un espacio privado para su trabajo de cumplimiento.">
          <input autoFocus value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Ej. Empresa Andes SpA" className="w-full rounded-xl border bg-background px-4 py-4 text-base outline-none focus:ring-2 focus:ring-primary" />
        </Question>
      )}

      {step === 2 && (
        <Question title="¿A qué se dedica principalmente?" description="Con esto prepararé el primer ámbito de cumplimiento sin pedirte configuraciones técnicas.">
          <div className="grid gap-3 sm:grid-cols-2">
            {industries.map((item) => (
              <button key={item.value} type="button" onClick={() => setIndustry(item.value)} className={`rounded-xl border p-4 text-left text-sm font-semibold transition ${industry === item.value ? 'border-primary bg-primary/10' : 'hover:border-primary/40'}`}>
                {item.label}
              </button>
            ))}
          </div>
        </Question>
      )}

      {step === 3 && (
        <Question title="¿Cuántas personas trabajan aproximadamente?" description="Solo necesito una estimación para ajustar el diagnóstico inicial.">
          <div className="grid gap-3 sm:grid-cols-2">
            {sizes.map((item) => (
              <button key={item.value} type="button" onClick={() => setOrganizationSize(item.value)} className={`rounded-xl border p-4 text-left text-sm font-semibold transition ${organizationSize === item.value ? 'border-primary bg-primary/10' : 'hover:border-primary/40'}`}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">Ya tengo lo necesario para comenzar.</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {continuesCase
                    ? 'Crearé tu espacio y volverás a la situación que ya escribiste, sin pedirte que la redactes de nuevo.'
                    : `Prepararé ${suggestion.complianceCase.toLowerCase()} y conservaré toda decisión con trazabilidad.`}
                </p>
              </div>
            </div>
          </div>
        </Question>
      )}

      {error && <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || loading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>

        {step < totalSteps - 1 ? (
          <Button type="button" onClick={() => setStep((current) => Math.min(totalSteps - 1, current + 1))} disabled={!canContinue}>
            Continuar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={loading || !canContinue}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {loading
              ? 'Preparando tu organización…'
              : continuesCase
                ? 'Crear mi espacio y continuar'
                : 'Preparar mi diagnóstico'}
          </Button>
        )}
      </div>
    </form>
  )
}

function Question({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-3 mb-7 text-base leading-7 text-muted-foreground">{description}</p>
      {children}
    </section>
  )
}
