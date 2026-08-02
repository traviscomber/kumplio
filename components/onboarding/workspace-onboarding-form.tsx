'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Factory,
  Loader2,
  MapPinned,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type Industry = 'general' | 'transport' | 'agriculture' | 'mining' | 'health' | 'finance' | 'construction' | 'other'
type OrganizationSize = 'micro' | 'small' | 'medium' | 'large' | 'enterprise'

type WorkspaceOnboardingFormProps = {
  initialEmail: string
  initialOrganizationName?: string | null
  initialFirstName?: string | null
  initialLastName?: string | null
}

const industries: Array<{ value: Industry; label: string; description: string }> = [
  { value: 'general', label: 'General', description: 'Protección de datos, contratos y cumplimiento transversal.' },
  { value: 'transport', label: 'Transporte', description: 'Flotas, conductores, documentación, rutas y carga.' },
  { value: 'agriculture', label: 'Agro', description: 'Predios, trazabilidad, insumos, lotes e inspecciones.' },
  { value: 'mining', label: 'Minería', description: 'Faenas, contratistas, controles críticos y permisos.' },
  { value: 'health', label: 'Salud', description: 'Datos sensibles, prestadores, pacientes y proveedores.' },
  { value: 'finance', label: 'Financiero', description: 'Datos financieros, proveedores y decisiones automatizadas.' },
  { value: 'construction', label: 'Construcción', description: 'Obras, contratistas, seguridad y documentación.' },
  { value: 'other', label: 'Otra industria', description: 'Configura un ámbito inicial adaptable a tu operación.' },
]

const sizes: Array<{ value: OrganizationSize; label: string; description: string }> = [
  { value: 'micro', label: 'Microempresa', description: '1–9 personas' },
  { value: 'small', label: 'Pequeña', description: '10–49 personas' },
  { value: 'medium', label: 'Mediana', description: '50–199 personas' },
  { value: 'large', label: 'Grande', description: '200–999 personas' },
  { value: 'enterprise', label: 'Enterprise', description: '1.000 o más personas' },
]

const suggestions: Record<Industry, { project: string; complianceCase: string }> = {
  general: {
    project: 'Ley 21.719 y protección de datos',
    complianceCase: 'Preparación para la Ley 21.719',
  },
  transport: {
    project: 'Cumplimiento de transporte y protección de datos',
    complianceCase: 'Diagnóstico inicial de flota, documentación y datos personales',
  },
  agriculture: {
    project: 'Cumplimiento agroalimentario y protección de datos',
    complianceCase: 'Diagnóstico inicial de trazabilidad, registros y datos personales',
  },
  mining: {
    project: 'Cumplimiento minero y protección de datos',
    complianceCase: 'Diagnóstico inicial de faena, contratistas y datos personales',
  },
  health: {
    project: 'Privacidad y cumplimiento en salud',
    complianceCase: 'Diagnóstico inicial de datos sensibles y procesos clínicos',
  },
  finance: {
    project: 'Privacidad y cumplimiento financiero',
    complianceCase: 'Diagnóstico inicial de datos financieros y decisiones automatizadas',
  },
  construction: {
    project: 'Cumplimiento de obras y protección de datos',
    complianceCase: 'Diagnóstico inicial de contratistas, seguridad y datos personales',
  },
  other: {
    project: 'Primer ámbito de cumplimiento',
    complianceCase: 'Diagnóstico inicial de cumplimiento',
  },
}

export function WorkspaceOnboardingForm({
  initialEmail,
  initialOrganizationName,
  initialFirstName,
  initialLastName,
}: WorkspaceOnboardingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [organizationName, setOrganizationName] = useState(initialOrganizationName || '')
  const [firstName, setFirstName] = useState(initialFirstName || '')
  const [lastName, setLastName] = useState(initialLastName || '')
  const [industry, setIndustry] = useState<Industry>('general')
  const [organizationSize, setOrganizationSize] = useState<OrganizationSize>('small')
  const [projectName, setProjectName] = useState(suggestions.general.project)
  const [firstCaseTitle, setFirstCaseTitle] = useState(suggestions.general.complianceCase)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedIndustry = useMemo(
    () => industries.find((item) => item.value === industry)!,
    [industry],
  )

  function chooseIndustry(value: Industry) {
    setIndustry(value)
    setProjectName(suggestions[value].project)
    setFirstCaseTitle(suggestions[value].complianceCase)
  }

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
          projectName,
          firstCaseTitle,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No fue posible crear el workspace')

      const caseId = data.workspace?.caseId as string | null | undefined
      router.push(caseId ? `/cases/${caseId}` : '/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const canContinueStepOne = organizationName.trim().length >= 2 && firstName.trim().length >= 1
  const canContinueStepTwo = Boolean(industry && organizationSize)
  const canSubmit = projectName.trim().length >= 3 && firstCaseTitle.trim().length >= 3

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-3 gap-3">
        {[
          [1, 'Empresa'],
          [2, 'Industria'],
          [3, 'Primer caso'],
        ].map(([number, label]) => {
          const value = number as 1 | 2 | 3
          const active = step === value
          const completed = step > value
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (value === 1 || (value === 2 && canContinueStepOne) || (value === 3 && canContinueStepOne && canContinueStepTwo)) setStep(value)
              }}
              className={`rounded-xl border p-3 text-left transition ${active ? 'border-primary bg-primary/10' : completed ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-border bg-card'}`}
            >
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${active ? 'bg-primary text-primary-foreground' : completed ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                {completed ? <CheckCircle2 className="h-4 w-4" /> : number}
              </span>
              <p className="mt-2 text-sm font-semibold">{label}</p>
            </button>
          )
        })}
      </div>

      {step === 1 && (
        <section className="space-y-5">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" /></div>
            <h2 className="mt-4 text-2xl font-bold">Configura tu organización</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Estos datos permiten crear el primer workspace y asignarte como propietario.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold">Nombre de la organización</span>
              <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} minLength={2} maxLength={160} required placeholder="Ej. Transportes Andes SpA" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Nombre</span>
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} maxLength={80} required className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Apellido</span>
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={80} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <div className="rounded-xl border border-border bg-muted/30 p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium"><UserRound className="h-4 w-4 text-primary" />Cuenta verificada</div>
              <p className="mt-2 text-sm text-muted-foreground">{initialEmail}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={() => setStep(2)} disabled={!canContinueStepOne}>Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Factory className="h-6 w-6" /></div>
            <h2 className="mt-4 text-2xl font-bold">Adapta Kumplio a tu industria</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">El núcleo es común, pero el primer caso y las futuras plantillas se adaptarán a tu operación.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {industries.map((item) => (
              <button key={item.value} type="button" onClick={() => chooseIndustry(item.value)} className={`rounded-xl border p-4 text-left transition ${industry === item.value ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'}`}>
                <p className="font-semibold">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
              </button>
            ))}
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Tamaño aproximado</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {sizes.map((item) => (
                <button key={item.value} type="button" onClick={() => setOrganizationSize(item.value)} className={`rounded-xl border p-3 text-left transition ${organizationSize === item.value ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{item.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Anterior</Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!canContinueStepTwo}>Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPinned className="h-6 w-6" /></div>
            <h2 className="mt-4 text-2xl font-bold">Crea tu primer ámbito y expediente</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Podrás modificarlos después. La configuración inicial te lleva directamente a un expediente operativo.</p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Configuración sugerida para {selectedIndustry.label}</p>
            <p className="mt-2 text-sm text-muted-foreground">Incluye Ley 21.719 como capa transversal y deja preparado el futuro pack sectorial.</p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold">Nombre del primer ámbito</span>
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} minLength={3} maxLength={160} required className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold">Primer expediente</span>
            <input value={firstCaseTitle} onChange={(event) => setFirstCaseTitle(event.target.value)} minLength={3} maxLength={160} required className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </label>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Creación segura y atómica</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">La organización, tu membresía de propietario, el ámbito y el caso se crean juntos. Si algo falla, no quedan registros parciales.</p>
              </div>
            </div>
          </div>

          {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={loading}>Anterior</Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {loading ? 'Creando workspace…' : 'Crear mi workspace'}
            </Button>
          </div>
        </section>
      )}
    </form>
  )
}
