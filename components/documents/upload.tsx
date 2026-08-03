'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { uploadDocument } from '@/lib/services/documents'
import { createClient } from '@/lib/supabase/client'

interface DocumentUploadProps {
  onSuccess?: (documentId: string) => void
  onError?: (error: string) => void
}

const allowedTypes = new Set(['application/pdf', 'text/plain'])
const maximumFileSize = 10 * 1024 * 1024

export function DocumentUpload({ onSuccess, onError }: DocumentUploadProps) {
  const { user } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedDocType, setSelectedDocType] = useState('contrato')

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleFile = useCallback(async (file: File) => {
    if (!user) {
      onError?.('Usuario no autenticado')
      return
    }

    if (!allowedTypes.has(file.type)) {
      onError?.('Actualmente se admiten archivos PDF y TXT.')
      return
    }

    if (file.size <= 0 || file.size > maximumFileSize) {
      onError?.('El archivo debe pesar entre 1 byte y 10 MB.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    let progressInterval: ReturnType<typeof setInterval> | null = null

    try {
      const supabase = createClient()
      progressInterval = setInterval(() => {
        setUploadProgress((current) => Math.min(90, current + Math.random() * 20))
      }, 300)

      const { documentId } = await uploadDocument(supabase, file, selectedDocType)
      const processingResponse = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })

      if (!processingResponse.ok) {
        const payload = await processingResponse.json().catch(() => ({}))
        throw new Error(payload.error || 'No fue posible iniciar el procesamiento del documento.')
      }

      setUploadProgress(100)
      setSelectedDocType('contrato')
      onSuccess?.(documentId)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Error desconocido al cargar')
    } finally {
      if (progressInterval) clearInterval(progressInterval)
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 300)
    }
  }, [onError, onSuccess, selectedDocType, user])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void handleFile(file)
  }, [handleFile])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void handleFile(file)
    event.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={selectedDocType}
          onChange={(event) => setSelectedDocType(event.target.value)}
          disabled={isUploading}
          className="rounded-lg border border-border bg-input px-3 py-2 text-foreground disabled:opacity-50"
        >
          <option value="contrato">Contrato</option>
          <option value="politica">Política de Privacidad</option>
          <option value="rat">RAT (Registro Activos Tratamiento)</option>
          <option value="otro">Otro documento</option>
        </select>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted'
        } ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-primary'}`}
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">Cargando: {Math.round(uploadProgress)}%</div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-2xl">📄</div>
            <div className="text-sm font-medium">
              Arrastra tu documento aquí o{' '}
              <label className="cursor-pointer text-primary hover:underline">
                selecciona un archivo
                <input
                  type="file"
                  onChange={handleInputChange}
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            <div className="text-xs text-muted-foreground">PDF o TXT · Máximo 10 MB</div>
          </div>
        )}
      </div>
    </div>
  )
}
