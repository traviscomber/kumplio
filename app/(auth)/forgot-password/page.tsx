'use client'

export const dynamic = 'force-dynamic'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams()
  const [supabase] = useState(() => createClient())
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (resetError) {
        setError(resetError.message)
        return
      }
      setSent(true)
    } catch {
      setError('No fue posible solicitar el cambio de contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl shadow-black/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div>
          <h1 className="mt-5 text-2xl font-bold">Revisa tu correo</h1>
          <p className="mt-3 leading-7 text-muted-foreground">Si existe una cuenta asociada a <strong className="text-foreground">{email}</strong>, recibirás un enlace para definir una nueva contraseña.</p>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Por seguridad, no confirmamos públicamente si una dirección está registrada.</p>
          <Button asChild variant="outline" className="mt-7 w-full"><Link href="/sign-in">Volver a iniciar sesión</Link></Button>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        <Link href="/sign-in" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Volver</Link>
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">K</div>
          <h1 className="mt-5 text-2xl font-bold">Recupera tu acceso</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Ingresa el correo de tu cuenta. Te enviaremos un enlace seguro y temporal.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /><p className="text-sm text-destructive">{error}</p></div>}
          <label className="block space-y-2" htmlFor="email">
            <span className="text-sm font-medium">Correo electrónico</span>
            <span className="relative block">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="tu@empresa.cl" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" required />
            </span>
          </label>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Enviando enlace…' : 'Enviar enlace de recuperación'}</Button>
        </form>
      </section>
    </main>
  )
}
