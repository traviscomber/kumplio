'use client'

export const dynamic = 'force-dynamic'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Building2, CheckCircle2, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function SignUp() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const callbackUrl = `${window.location.origin}/auth/callback?next=/onboarding`
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            company_name: organizationName.trim(),
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.session) {
        router.replace('/onboarding')
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
            Enviamos un enlace de confirmación a <strong className="text-foreground">{email}</strong>. Después de confirmar, continuarás con la configuración segura de tu workspace.
          </p>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">El enlace puede tardar unos minutos. Revisa también la carpeta de correo no deseado.</p>
          <Button asChild variant="outline" className="mt-7 w-full"><Link href="/sign-in">Ya confirmé mi correo</Link></Button>
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
              <h1 className="text-2xl font-bold">Crea tu cuenta KUMPLIO</h1>
              <p className="mt-1 text-sm text-muted-foreground">El workspace se configurará después de verificar tu identidad.</p>
            </div>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <label className="block space-y-2" htmlFor="organization">
              <span className="text-sm font-medium">Nombre de la organización</span>
              <span className="relative block">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="organization" type="text" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} minLength={2} maxLength={160} placeholder="Mi Empresa SpA" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" required />
              </span>
            </label>

            <label className="block space-y-2" htmlFor="email">
              <span className="text-sm font-medium">Correo electrónico</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="tu@empresa.cl" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" required />
              </span>
            </label>

            <label className="block space-y-2" htmlFor="password">
              <span className="text-sm font-medium">Contraseña</span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} autoComplete="new-password" placeholder="Mínimo 10 caracteres" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" required />
              </span>
              <span className="text-xs text-muted-foreground">Usa una contraseña única que no ocupes en otros servicios.</span>
            </label>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creando cuenta…' : 'Crear cuenta y verificar correo'}
            </Button>
          </form>

          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link href="/sign-in" className="font-semibold text-primary hover:underline">Inicia sesión</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
