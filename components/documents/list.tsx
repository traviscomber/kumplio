'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { deleteDocument, getUserDocuments } from '@/lib/services/documents'
import { createClient } from '@/lib/supabase/client'
import type { Document } from '@/lib/types/documents'

export function DocumentsList() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setDocuments([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchDocuments() {
      setLoading(true)
      try {
        const supabase = createClient()
        const rows = await getUserDocuments(supabase, user!.id)
        if (!cancelled) {
          setDocuments(rows as Document[])
          setError(null)
        }
      } catch (fetchError) {
        console.error('[documents/list]', fetchError)
        if (!cancelled) setError('Error al cargar los documentos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchDocuments()
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleDelete(documentId: string) {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este documento?')) return

    try {
      const supabase = createClient()
      await deleteDocument(supabase, documentId)
      setDocuments((current) => current.filter((document) => document.id !== documentId))
    } catch (deleteError) {
      console.error('[documents/list] delete failed', deleteError)
      window.alert('Error al eliminar el documento')
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Cargando documentos...</div>
  }

  if (error) {
    return <div className="py-8 text-center text-destructive">{error}</div>
  }

  if (documents.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <div className="mb-2 text-4xl">📭</div>
        <p>No hay documentos aún. Carga tu primer documento arriba.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <div
          key={document.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-card/80"
        >
          <Link href={`/documents/${document.id}`} className="min-w-0 flex-1">
            <div className="space-y-1">
              <div className="truncate font-medium text-foreground">{document.filename}</div>
              <div className="flex gap-3 text-sm text-muted-foreground">
                <span>{((document.file_size || 0) / 1024).toFixed(1)} KB</span>
                {document.industry && (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs">{document.industry}</span>
                )}
                <span>{new Date(document.created_at).toLocaleDateString('es-CL')}</span>
              </div>
            </div>
          </Link>

          <div className="ml-4 flex items-center gap-2">
            <span className={`rounded px-2 py-1 text-xs ${getStatusColor(document.status)}`}>
              {getStatusLabel(document.status)}
            </span>
            <button
              type="button"
              onClick={() => void handleDelete(document.id)}
              className="text-sm text-muted-foreground transition-colors hover:text-destructive"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function getStatusLabel(status: Document['status']) {
  return {
    uploading: 'Cargando',
    processing: 'Procesando',
    completed: 'Completado',
    error: 'Error',
  }[status]
}

function getStatusColor(status: Document['status']) {
  return {
    uploading: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    processing: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
    error: 'bg-red-500/10 text-red-700 dark:text-red-400',
  }[status]
}
