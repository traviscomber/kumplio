'use client'

export const dynamic = 'force-dynamic'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { safeInternalPath } from '@/lib/navigation/safe-internal-path'
import { Button } from '@/components/ui/button'
import { authErrorMessage } from '@/lib/auth/password-policy'

const successMessages: Record<string, string> = {
  'password-updated': 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
  'email-confirmed': 'Tu correo fue confirmado. Inicia sesión para continuar.',
}

export default function SignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const next = safeInternalPath(searchParams.get('next'))
  const successMessage = successMessages[searchParams.get('message') || '']

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(authErrorMessage(signInError))
        return
      }

      router.replace(next)
      router.refresh()
    } catch {
      setError('No fue posible iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-md">
        <section className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">K</div>
            <div>
              <h1 className="text-2xl font-bold">Accede a Kumplio</h1>
              <p className="mt-1 text-sm text-muted-foreground">Continúa exactamente en el espacio que intentabas abrir.</p>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {successMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <label className="block space-y-2" htmlFor="email">
              <span className="text-sm font-medium">Correo electrónico</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="tu@empresa.cl" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" required />
              </span>
            </label>

            <label className="block space-y-2" htmlFor="password">
              <span className="flex items-center justify-between gap-4 text-sm font-medium">
                <span>Contraseña</span>
                <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="text-xs font-semibold text-primary hover:underline">Olvidé mi contraseña</Link>
              </span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="••••••••••" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary" required />
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link href={`/sign-up?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">Crea una cuenta</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
