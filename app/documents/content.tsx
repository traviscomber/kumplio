'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FileText, Shield, Zap } from 'lucide-react'
import { DocumentUpload } from '@/components/documents/upload'
import { DocumentsList } from '@/components/documents/list'
import { UploadGuide } from '@/components/onboarding/upload-guide'
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
        : 'Documento cargado y enviado a análisis.',
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
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Documentos</h1>
        <p className="max-w-3xl leading-7 text-muted-foreground">
          Carga archivos PDF o TXT para identificar posibles obligaciones. Los resultados son preliminares y requieren revisión humana.
        </p>
      </div>

      {successMessage && (
        <div className="space-y-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400">
          <p>{successMessage}</p>
          {isActivation && activationCaseId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/inicio?case=${encodeURIComponent(activationCaseId)}`}>
                Volver a Inicio y ver el siguiente paso
              </Link>
            </Button>
          ) : null}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-2 text-xl font-semibold">Carga un documento</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Selecciona la categoría del documento y carga un archivo con texto legible.
            </p>
            <DocumentUpload onSuccess={handleUploadSuccess} onError={handleUploadError} />
          </section>

          <section className="rounded-lg border border-border bg-card p-8">
            <h2 className="mb-4 text-xl font-semibold">Mis documentos</h2>
            <DocumentsList key={refreshKey} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="space-y-4 rounded-lg bg-muted/50 p-6">
            <h3 className="text-lg font-semibold text-foreground">Cómo funciona</h3>
            <UploadGuide />
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-semibold">Alcance actual</h3>
            <div className="mt-4 space-y-4">
              {[
                {
                  Icon: FileText,
                  title: 'PDF y TXT',
                  description: 'Archivos de hasta 10 MB con texto extraíble.',
                },
                {
                  Icon: Zap,
                  title: 'Extracción preliminar',
                  description: 'Identifica posibles obligaciones y registra confianza técnica.',
                },
                {
                  Icon: Shield,
                  title: 'Sin declaración automática',
                  description: 'No determina cumplimiento ni reemplaza revisión profesional.',
                },
              ].map(({ Icon, title, description }) => (
                <div key={title} className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
