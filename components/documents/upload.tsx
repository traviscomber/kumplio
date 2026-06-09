'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { uploadDocument } from '@/lib/services/documents'
import { useAuth } from '@/lib/auth-context'

interface DocumentUploadProps {
  onSuccess?: (documentId: string) => void
  onError?: (error: string) => void
}

export function DocumentUpload({ onSuccess, onError }: DocumentUploadProps) {
  const { user } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedDocType, setSelectedDocType] = useState<string>('contrato')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFile = useCallback(
    async (file: File) => {
      if (!user) {
        onError?.('Usuario no autenticado')
        return
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        onError?.('Solo PDF, DOCX y TXT son permitidos')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        onError?.('El archivo es muy grande (máx 10MB)')
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        // Create Supabase client
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        )

        // Simulate upload progress while the actual upload happens
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const next = prev + Math.random() * 30
            return next > 90 ? 90 : next
          })
        }, 300)

        // Upload document
        const { documentId, projectId } = await uploadDocument(supabase, file, selectedDocType)

        clearInterval(progressInterval)
        setUploadProgress(100)

        // Trigger async processing
        fetch('/api/documents/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId }),
        }).catch((err) => console.error('[upload] Processing trigger error:', err))

        // Reset form
        setSelectedDocType('contrato')
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
          onSuccess?.(documentId)
        }, 500)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al cargar'
        onError?.(errorMessage)
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [user, selectedDocType, onSuccess, onError]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className="space-y-4">
      {/* Document type selector */}
      <div className="flex gap-2">
        <select
          value={selectedDocType}
          onChange={(e) => setSelectedDocType(e.target.value)}
          disabled={isUploading}
          className="px-3 py-2 rounded-lg border border-border bg-input text-foreground disabled:opacity-50"
        >
          <option value="contrato">Contrato</option>
          <option value="politica">Política de Privacidad</option>
          <option value="rat">RAT (Registro Activos Tratamiento)</option>
          <option value="otro">Otro Documento</option>
        </select>
      </div>

      {/* Drag & drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted'}
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary'}
        `}
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">Cargando: {Math.round(uploadProgress)}%</div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-2xl">📄</div>
            <div className="text-sm font-medium">
              Arrastra tu documento aquí o{' '}
              <label className="text-primary cursor-pointer hover:underline">
                selecciona un archivo
                <input
                  type="file"
                  onChange={handleInputChange}
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            <div className="text-xs text-muted-foreground">PDF, DOCX o TXT • Máximo 10MB</div>
          </div>
        )}
      </div>
    </div>
  )
}
