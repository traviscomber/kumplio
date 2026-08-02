import type { ReactNode } from 'react'
import Link from 'next/link'
import { FileClock } from 'lucide-react'

export default async function ControlDetailLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ controlId: string }>
}) {
  const { controlId } = await params

  return (
    <>
      {children}
      <div className="container mx-auto px-6 pb-8">
        <section className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><FileClock className="h-5 w-5" /></div>
            <div>
              <h2 className="font-bold">¿Falta respaldo para este control?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Crea una solicitud con responsable, vencimiento y revisión trazable.</p>
            </div>
          </div>
          <Link href={`/evidence/requests?controlId=${controlId}`} className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground">
            Solicitar evidencia
          </Link>
        </section>
      </div>
    </>
  )
}
