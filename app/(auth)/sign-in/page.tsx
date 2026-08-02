'use client'

export const dynamic = 'force-dynamic'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function SignIn() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        setError(signInError.message)
        return
      }

      router.replace('/onboarding')
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
              <h1 className="text-2xl font-bold">Accede a KUMPLIO</h1>
              <p className="mt-1 text-sm text-muted-foreground">Cumplimiento continuo respaldado por evidencia.</p>
            </div>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
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
              <span className="text-sm font-medium">Contraseña</span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="••••••••••" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" required />
              </span>
            </label>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link href="/sign-up" className="font-semibold text-primary hover:underline">Crea una cuenta</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
