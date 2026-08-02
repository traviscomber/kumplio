import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-xl shadow-black/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">No pudimos confirmar el acceso</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          El enlace pudo haber vencido o ya fue utilizado. Intenta iniciar sesión; si la cuenta todavía no está confirmada, solicita un nuevo registro con el mismo correo.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild><Link href="/sign-in">Ir a iniciar sesión</Link></Button>
          <Button variant="outline" asChild><Link href="/sign-up"><ArrowLeft className="mr-2 h-4 w-4" />Volver al registro</Link></Button>
        </div>
      </section>
    </main>
  )
}
