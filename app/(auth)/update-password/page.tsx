'use client'

export const dynamic = 'force-dynamic'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PasswordRequirements } from '@/components/auth/password-requirements'
import { PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE, authErrorMessage, isStrongPassword } from '@/lib/auth/password-policy'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [validSession, setValidSession] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordReady = isStrongPassword(password) && password === confirmation

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return
      setValidSession(Boolean(data.user && !authError))
      setCheckingSession(false)
    })
    return () => { active = false }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (!passwordReady) {
      setError(PASSWORD_POLICY_MESSAGE)
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(authErrorMessage(updateError))
        return
      }
      await supabase.auth.signOut()
      router.replace('/sign-in?message=password-updated')
      router.refresh()
    } catch {
      setError('No fue posible actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Validando enlace…</main>
  }

  if (!validSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl shadow-black/5">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-5 text-2xl font-bold">El enlace no es válido</h1>
          <p className="mt-3 leading-7 text-muted-foreground">El enlace pudo vencer, haber sido utilizado o abrirse sin completar la verificación.</p>
          <Button asChild className="mt-7 w-full"><Link href="/forgot-password">Solicitar un nuevo enlace</Link></Button>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">K</div>
          <h1 className="mt-5 text-2xl font-bold">Define una nueva contraseña</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Después del cambio, cerraremos la sesión de recuperación y podrás ingresar normalmente.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /><p className="text-sm text-destructive">{error}</p></div>}

          <label className="block space-y-2" htmlFor="password">
            <span className="text-sm font-medium">Nueva contraseña</span>
            <span className="relative block">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary" required />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </span>
            <PasswordRequirements password={password} />
          </label>

          <label className="block space-y-2" htmlFor="confirmation">
            <span className="text-sm font-medium">Confirma la contraseña</span>
            <span className="relative block">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input id="confirmation" type={showPassword ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" required />
            </span>
            {confirmation && password !== confirmation && <span className="text-xs text-destructive">Las contraseñas no coinciden.</span>}
          </label>

          <Button type="submit" disabled={loading || !passwordReady} className="w-full">{loading ? 'Actualizando…' : 'Guardar nueva contraseña'}</Button>
        </form>
      </section>
    </main>
  )
}
