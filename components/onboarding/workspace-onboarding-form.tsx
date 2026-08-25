'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildInitialDiagnosis, type DocumentAvailability, type OnboardingUrgency, type UserContextType } from '@/lib/product/onboarding/contextual-diagnosis'
import { buildActivationHandoff } from '@/lib/product/onboarding/activation-handoff'
import { GUIDED_ONBOARDING_DRAFT_KEY, parseGuidedOnboardingDraft } from '@/lib/product/onboarding/guided-entry'

type Props = { initialEmail: string; initialOrganizationName?: string | null; initialFirstName?: string | null; initialLastName?: string | null }
const contexts = [
  { value: 'persona', label: 'Persona', description: 'Ordena tu documentación, requisitos y próximos pasos.' },
  { value: 'profesional', label: 'Profesional', description: 'Gestiona tu trabajo y casos relacionados con clientes.' },
  { value: 'empresa', label: 'Empresa', description: 'Coordina organización, trabajadores, evidencia y casos.' },
] as const
const intents = ['Prepararme para la Ley 21.719', 'Ordenar documentación laboral', 'Revisar vencimientos', 'Incorporar trabajadores', 'Preparar documentación para una faena', 'Revisar conductores y vehículos', 'Responder a una solicitud o incidente', 'No sé por dónde empezar']
const industries = ['general', 'transport', 'agriculture', 'mining', 'health', 'finance', 'construction', 'other'] as const

export function WorkspaceOnboardingForm({ initialEmail, initialOrganizationName, initialFirstName, initialLastName }: Props) {
  const [step, setStep] = useState(0)
  const [userType, setUserType] = useState<UserContextType>('persona')
  const [problem, setProblem] = useState('')
  const [intent, setIntent] = useState('')
  const [firstName, setFirstName] = useState(initialFirstName || '')
  const [lastName, setLastName] = useState(initialLastName || '')
  const [organizationName, setOrganizationName] = useState(initialOrganizationName || '')
  const [professionalActivity, setProfessionalActivity] = useState('')
  const [industry, setIndustry] = useState<(typeof industries)[number]>('general')
  const [organizationSize, setOrganizationSize] = useState<'micro' | 'small' | 'medium' | 'large' | 'enterprise'>('micro')
  const [workerCount, setWorkerCount] = useState('')
  const [activeClients, setActiveClients] = useState('')
  const [region, setRegion] = useState('')
  const [urgency, setUrgency] = useState<OnboardingUrgency>('medium')
  const [documentsAvailable, setDocumentsAvailable] = useState<DocumentAvailability>('some')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activationHandoff, setActivationHandoff] = useState<ReturnType<typeof buildActivationHandoff> | null>(null)

  useEffect(() => {
    const draft = parseGuidedOnboardingDraft(window.sessionStorage.getItem(GUIDED_ONBOARDING_DRAFT_KEY))
    if (!draft) return
    setUserType(draft.userType)
    setProblem(draft.problem)
  }, [])

  const diagnosis = useMemo(() => problem.trim() ? buildInitialDiagnosis({ userType, problem, intent, urgency, documentsAvailable, targetDate, region, industry, organizationName, organizationSize, professionalActivity }) : null, [userType, problem, intent, urgency, documentsAvailable, targetDate, region, industry, organizationName, organizationSize, professionalActivity])
  const canContinue = step === 0 ? Boolean(userType) : step === 1 ? problem.trim().length >= 3 : step === 2 ? firstName.trim().length > 0 && (userType !== 'empresa' || organizationName.trim().length >= 2) && (userType !== 'profesional' || professionalActivity.trim().length >= 2) : Boolean(diagnosis)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!diagnosis || loading) return
    setError(''); setLoading(true)
    try {
      const shared = { userType, problem, intent, urgency, documentsAvailable, region, targetDate: targetDate || null, firstName, lastName }
      const contextual = userType === 'empresa'
        ? { organizationName, industry, organizationSize, workerCount: workerCount ? Number(workerCount) : null }
        : userType === 'profesional' ? { professionalActivity, industry, activeClients: activeClients ? Number(activeClients) : null } : {}
      const response = await fetch('/api/onboarding/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...shared, ...contextual }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible preparar tu espacio')
      const caseId = data.workspace?.caseId as string | undefined
      window.sessionStorage.removeItem(GUIDED_ONBOARDING_DRAFT_KEY)
      setActivationHandoff(buildActivationHandoff(diagnosis, caseId))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No fue posible terminar la configuración') }
    finally { setLoading(false) }
  }

  if (activationHandoff) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-primary/25 bg-primary/5 p-6 sm:p-8">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-primary">Diagnóstico inicial preparado</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Tu primer paso ya está claro</h2>
        <h3 className="mt-5 text-xl font-bold">{activationHandoff.title}</h3>
        <p className="mt-3 leading-7 text-muted-foreground">{activationHandoff.explanation}</p>
        <div className="mt-6 rounded-xl border bg-background/80 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Siguiente acción recomendada</p>
          <p className="mt-1 font-semibold">{activationHandoff.primaryLabel}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href={activationHandoff.primaryHref}>Ir a mi siguiente acción</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={activationHandoff.secondaryHref}>Ver mi inicio</Link>
          </Button>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">Este resultado organiza el trabajo inicial; no acredita cumplimiento ni evidencia verificada.</p>
      </section>
    )
  }

  return <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
    <Progress step={step} />
    {step === 0 && <Question title="¿Quién eres?" description="Kumplio adapta las preguntas y el trabajo visible, sin separarte en otro producto.">
      <div className="grid gap-3 md:grid-cols-3">{contexts.map(item => <Choice key={item.value} selected={userType === item.value} onClick={() => setUserType(item.value)}><strong>{item.label}</strong><span>{item.description}</span></Choice>)}</div>
    </Question>}
    {step === 1 && <Question title="¿Qué necesitas proteger, ordenar o resolver?" description="Cuéntalo con tus palabras. Esto define el primer caso, no una conclusión de cumplimiento.">
      <textarea autoFocus value={problem} onChange={e => setProblem(e.target.value)} rows={4} placeholder="Ej. Necesito ordenar contratos y vencimientos antes de una fiscalización" className="w-full rounded-xl border bg-background px-4 py-4 outline-none focus:ring-2 focus:ring-primary" />
      <div className="mt-4 flex flex-wrap gap-2">{intents.map(item => <button key={item} type="button" onClick={() => { setIntent(item); if (!problem) setProblem(item) }} className="rounded-full border px-3 py-2 text-left text-xs font-semibold hover:border-primary">{item}</button>)}</div>
    </Question>}
    {step === 2 && <Question title="Danos solo el contexto necesario" description={`Cuenta verificada: ${initialEmail}`}>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre"><input value={firstName} onChange={e => setFirstName(e.target.value)} /></Field><Field label="Apellido (opcional)"><input value={lastName} onChange={e => setLastName(e.target.value)} /></Field></div>
      {userType === 'empresa' && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Organización"><input value={organizationName} onChange={e => setOrganizationName(e.target.value)} /></Field><SelectField label="Tamaño" value={organizationSize} onChange={setOrganizationSize} options={['micro','small','medium','large','enterprise']} /><Field label="Trabajadores aproximados"><input type="number" min="0" value={workerCount} onChange={e => setWorkerCount(e.target.value)} /></Field></div>}
      {userType === 'profesional' && <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Actividad profesional"><input value={professionalActivity} onChange={e => setProfessionalActivity(e.target.value)} /></Field><Field label="Clientes activos aproximados"><input type="number" min="0" value={activeClients} onChange={e => setActiveClients(e.target.value)} /></Field></div>}
      {userType !== 'persona' && <div className="mt-4"><SelectField label="Industria principal" value={industry} onChange={setIndustry} options={[...industries]} /></div>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Región (opcional)"><input value={region} onChange={e => setRegion(e.target.value)} /></Field><Field label="Fecha objetivo (opcional)"><input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} /></Field><SelectField label="Urgencia" value={urgency} onChange={setUrgency} options={['low','medium','high','critical']} /><SelectField label="Documentos disponibles" value={documentsAvailable} onChange={setDocumentsAvailable} options={['none','some','most']} /></div>
    </Question>}
    {step === 3 && diagnosis && <Question title="Resultado inicial" description="Esto aún no acredita cumplimiento. Organiza el trabajo que debe confirmarse con evidencia.">
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5"><ShieldCheck className="h-5 w-5 text-primary" /><h3 className="mt-3 text-xl font-bold">{diagnosis.caseTitle}</h3><p className="mt-2 text-sm text-muted-foreground">{diagnosis.summary}</p><p className="mt-5 text-xs font-bold uppercase tracking-wider text-primary">Siguiente acción</p><p className="mt-1 font-semibold">{diagnosis.nextAction.title}</p></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><PreviewList title="Brechas por confirmar" items={diagnosis.gaps.map(x => x.title)} empty="No detectamos brechas iniciales con estos datos." /><PreviewList title="Primeras acciones" items={diagnosis.actions.map(x => x.title)} /></div>
    </Question>}
    {error && <p role="alert" className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
    <div className="mt-8 flex justify-between gap-3"><Button type="button" variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0 || loading}><ArrowLeft className="mr-2 h-4 w-4" />Anterior</Button>{step < 3 ? <Button type="button" onClick={() => setStep(s => Math.min(3, s + 1))} disabled={!canContinue || loading}>Continuar<ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="submit" disabled={loading || !canContinue}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}{loading ? 'Preparando…' : 'Crear mi primer diagnóstico'}</Button>}</div>
  </form>
}

function Progress({ step }: { step: number }) { return <div className="mb-8 flex items-center justify-between"><p className="text-sm font-semibold text-primary">Paso {step + 1} de 4</p><div className="h-2 w-40 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${(step + 1) * 25}%` }} /></div></div> }
function Question({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section><h2 className="text-3xl font-extrabold tracking-tight">{title}</h2><p className="mb-7 mt-3 leading-7 text-muted-foreground">{description}</p>{children}</section> }
function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex flex-col gap-2 rounded-2xl border p-5 text-left ${selected ? 'border-primary bg-primary/10' : 'hover:border-primary/40'}`}>{children}</button> }
function Field({ label, children }: { label: string; children: React.ReactElement }) { return <label className="grid gap-2 text-sm font-semibold"><span>{label}</span><span className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:bg-background [&>input]:px-4 [&>input]:py-3">{children}</span></label> }
function SelectField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: T[] }) { return <label className="grid gap-2 text-sm font-semibold"><span>{label}</span><select value={value} onChange={e => onChange(e.target.value as T)} className="rounded-xl border bg-background px-4 py-3">{options.map(x => <option key={x} value={x}>{x}</option>)}</select></label> }
function PreviewList({ title, items, empty }: { title: string; items: string[]; empty?: string }) { return <div className="rounded-2xl border p-5"><h3 className="font-bold">{title}</h3>{items.length ? <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{items.map(x => <li key={x}>• {x}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">{empty}</p>}</div> }
