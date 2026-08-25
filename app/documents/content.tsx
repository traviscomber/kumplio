'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FileText, Shield, Zap } from 'lucide-react'
import { DocumentUpload } from '@/components/documents/upload'
import { DocumentsList } from '@/components/documents/list'
import { Button } from '@/components/ui/button'

export function DocumentsContent() {
  const searchParams = useSearchParams()
  const isActivation = searchParams.get('activation') === '1'
  const activationCaseId = searchParams.get('case')
  const [refreshKey, setRefreshKey] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleUploadSuccess() {
    setSuccessMessage(
      isActivation && activationCaseId
        ? 'Primer antecedente agregado. El documento quedó cargado y enviado a análisis; todavía requiere revisión humana.'
        : 'Documento cargado y enviado a análisis; el resultado requiere revisión humana.',
    )
    setErrorMessage(null)
    setRefreshKey((current) => current + 1)
    window.setTimeout(() => setSuccessMessage(null), 4000)
  }

  function handleUploadError(error: string) {
    setErrorMessage(error)
    setSuccessMessage(null)
    window.setTimeout(() => setErrorMessage(null), 6000)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="border-b border-border/70 pb-7">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Documentos</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          Aporta archivos para extraer antecedentes útiles. La extracción es preliminar y requiere revisión humana.
        </p>
      </header>

      {successMessage && (
        <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400" role="status">
          <p>{successMessage}</p>
          {isActivation && activationCaseId ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/app/casos/${encodeURIComponent(activationCaseId)}`}>Volver al caso</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/inicio?case=${encodeURIComponent(activationCaseId)}`}>Ver siguiente paso</Link>
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {errorMessage && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive" role="alert">{errorMessage}</div>}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-8">
          <section>
            <p className="text-sm font-semibold text-primary">Aportar antecedente</p>
            <h2 className="mt-1 text-2xl font-bold">Carga un documento</h2>
            <p className="mt-2 mb-5 text-sm leading-6 text-muted-foreground">Selecciona la categoría y carga un PDF o TXT con texto legible.</p>
            <div className="rounded-2xl border bg-card p-5 sm:p-6">
              <DocumentUpload onSuccess={handleUploadSuccess} onError={handleUploadError} />
            </div>
          </section>

          <section className="border-t border-border/70 pt-7">
            <h2 className="text-2xl font-bold">Documentos cargados</h2>
            <p className="mt-2 mb-5 text-sm text-muted-foreground">Antecedentes disponibles para análisis y revisión.</p>
            <DocumentsList key={refreshKey} />
          </section>
        </div>

        <aside className="space-y-5 lg:border-l lg:border-border/70 lg:pl-6">
          <h2 className="font-bold">Qué ocurre después</h2>
          {[
            { Icon: FileText, title: 'PDF y TXT', description: 'Hasta 10 MB con texto extraíble.' },
            { Icon: Zap, title: 'Extracción preliminar', description: 'Kumplio identifica antecedentes y posibles obligaciones.' },
            { Icon: Shield, title: 'Revisión necesaria', description: 'Cargar un archivo no acredita cumplimiento ni verifica evidencia automáticamente.' },
          ].map(({ Icon, title, description }) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
