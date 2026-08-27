'use client'

export const dynamic = 'force-dynamic'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { safeInternalPath } from '@/lib/navigation/safe-internal-path'
import { Button } from '@/components/ui/button'
import { PasswordRequirements } from '@/components/auth/password-requirements'
import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE, authErrorMessage, isStrongPassword } from '@/lib/auth/password-policy'
import { GUIDED_ONBOARDING_DRAFT_KEY, parseGuidedOnboardingDraft, type GuidedOnboardingDraft } from '@/lib/product/onboarding/guided-entry'

const plans = {
  esencial: {
    id: 'esencial',
    name: 'Esencial',
    price: '$79.990 al mes + IVA',
    description: 'Hasta 5 usuarios, casos guiados, evidencia, decisiones y trazabilidad.',
  },
  profesional: {
    id: 'profesional',
    name: 'Profesional',
    price: '$249.990 al mes + IVA',
    description: 'Hasta 20 usuarios, seguimiento continuo, automatizaciones y soporte prioritario.',
  },
} as const

type PlanKey = keyof typeof plans

export default function SignUp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [guidedDraft, setGuidedDraft] = useState<GuidedOnboardingDraft | null>(null)

  useEffect(() => {
    const storedDraft = window.sessionStorage.getItem(GUIDED_ONBOARDING_DRAFT_KEY)
      || window.localStorage.getItem(GUIDED_ONBOARDING_DRAFT_KEY)
    setGuidedDraft(parseGuidedOnboardingDraft(storedDraft))
  }, [])

  const planKey = searchParams.get('plan') as PlanKey | null
  const selectedPlan = planKey && planKey in plans ? plans[planKey] : null
  const next = safeInternalPath(searchParams.get('next'))
  const passwordReady = isStrongPassword(password)

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!acceptedLegal) {
      setError('Debes aceptar los Términos de Servicio y la Política de Privacidad.')
      return
    }

    if (!passwordReady) {
      setError(PASSWORD_POLICY_MESSAGE)
      return
    }

    setLoading(true)

    try {
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      const acceptedAt = new Date().toISOString()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            company_name: organizationName.trim(),
            workspace_name: organizationName.trim(),
            selected_plan: selectedPlan?.id || null,
            signup_source: selectedPlan ? 'pricing' : 'guided_resolution',
            terms_version: '2026-08-03',
            privacy_version: '2026-08-03',
            legal_accepted_at: acceptedAt,
          },
        },
      })

      if (signUpError) {
        setError(authErrorMessage(signUpError))
        return
      }

      if (data.session) {
        router.replace(next)
        router.refresh()
        return
      }

      setConfirmationSent(true)
    } catch {
      setError('No fue posible completar el registro.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl shadow-black/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Revisa tu correo</h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            Enviamos un enlace de confirmación a <strong className="text-foreground">{email}</strong>. Después de confirmar, continuarás con el caso que quieres resolver y la configuración segura de tu espacio.
          </p>
          {selectedPlan && (
            <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
              Conservamos tu interés en el plan <strong className="text-foreground">{selectedPlan.name}</strong> para continuar después de verificar tu correo.
            </p>
          )}

          {!selectedPlan && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Tu orientación está guardada</p>
                  {guidedDraft ? (
                    <p className="mt-2 text-sm font-semibold leading-6 text-foreground">“{guidedDraft.problem}”</p>
                  ) : (
                    <p className="mt-2 text-sm font-semibold leading-6 text-foreground">Tu registro continúa directamente con la configuración de tu primer diagnóstico.</p>
                  )}
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Después de verificar tu correo continuarás desde aquí; no tendrás que escribir nuevamente tu situación.</p>
                </div>
              </div>
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">El enlace puede tardar unos minutos. Revisa también la carpeta de correo no deseado.</p>
          <Button asChild variant="outline" className="mt-7 w-full">
            <Link href={`/sign-in?next=${encodeURIComponent(next)}`}>Ya confirmé mi correo</Link>
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-md">
        <section className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">K</div>
            <div>
              <h1 className="text-2xl font-bold">Crea tu cuenta Kumplio</h1>
              <p className="mt-1 text-sm text-muted-foreground">Verifica tu correo y continúa con la situación que necesitas resolver.</p>
            </div>
          </div>

          {selectedPlan && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Plan seleccionado</p>
                  <p className="mt-1 font-bold">{selectedPlan.name} · {selectedPlan.price}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{selectedPlan.description}</p>
                  <Link href="/pricing" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Cambiar plan</Link>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <label className="block space-y-2" htmlFor="organization">
              <span className="text-sm font-medium">Nombre de tu espacio de trabajo</span>
              <span className="relative block">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="organization" type="text" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} minLength={2} maxLength={160} placeholder="Tu nombre, estudio o empresa" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" required />
              </span>
              <span className="block text-xs leading-5 text-muted-foreground">Puede ser tu nombre, el de tu estudio profesional o el de tu organización.</span>
            </label>

            <label className="block space-y-2" htmlFor="email">
              <span className="text-sm font-medium">Correo electrónico</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="tu@correo.cl" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" required />
              </span>
            </label>

            <label className="block space-y-2" htmlFor="password">
              <span className="text-sm font-medium">Contraseña</span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" placeholder="Mínimo 12 caracteres" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary" required />
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              <PasswordRequirements password={password} />
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-3 text-sm">
              <input type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" required />
              <span className="leading-6 text-muted-foreground">
                Acepto los <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">Términos de Servicio</Link> y la <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">Política de Privacidad</Link>.
              </span>
            </label>

            <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>La creación de cuenta no inicia un cobro automático. La contratación y facturación se confirman por separado.</span>
            </div>

            <Button type="submit" disabled={loading || !passwordReady || !acceptedLegal} className="w-full">
              {loading ? 'Creando cuenta…' : 'Crear cuenta y continuar'}
            </Button>
          </form>

          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">Inicia sesión</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
