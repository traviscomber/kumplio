'use client'

import { useState } from 'react'
import { ChevronDown, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExportMenuProps {
  documentId: string
  documentName: string
}

const extensions = {
  pdf: 'pdf',
  excel: 'xlsx',
  csv: 'csv',
} as const

function safeDownloadName(value: string) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'documento'
}

export function ExportMenu({ documentId, documentName }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<keyof typeof extensions | null>(null)
  const [error, setError] = useState('')

  async function handleExport(format: keyof typeof extensions) {
    setExportingFormat(format)
    setError('')

    try {
      const response = await fetch(
        `/api/export?documentId=${encodeURIComponent(documentId)}&format=${format}`,
        { credentials: 'same-origin', cache: 'no-store' },
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'No fue posible exportar el documento.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = window.document.createElement('a')
      const timestamp = new Date().toISOString().slice(0, 10)

      anchor.href = url
      anchor.download = `reporte-${safeDownloadName(documentName)}-${timestamp}.${extensions[format]}`
      window.document.body.appendChild(anchor)
      anchor.click()
      window.document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      setIsOpen(false)
    } catch (exportError) {
      const message = exportError instanceof Error
        ? exportError.message
        : 'No fue posible exportar el documento.'
      console.error('[export-menu]', message)
      setError(message)
    } finally {
      setExportingFormat(null)
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setIsOpen((current) => !current)
          setError('')
        }}
        className="flex items-center gap-2"
        aria-expanded={isOpen}
      >
        <Download className="h-4 w-4" />
        Exportar
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-card p-1 shadow-lg">
          {(['pdf', 'excel', 'csv'] as const).map((format) => {
            const labels = {
              pdf: 'Exportar a PDF',
              excel: 'Exportar a Excel',
              csv: 'Exportar a CSV',
            }
            const active = exportingFormat === format

            return (
              <button
                key={format}
                type="button"
                onClick={() => void handleExport(format)}
                disabled={exportingFormat !== null}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:opacity-50"
              >
                {active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {active ? 'Preparando archivo…' : labels[format]}
              </button>
            )
          })}
          {error && <p className="border-t border-border px-3 py-2 text-xs leading-5 text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}
