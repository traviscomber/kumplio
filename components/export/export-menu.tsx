'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown } from 'lucide-react';

interface ExportMenuProps {
  documentId: string;
  documentName: string;
}

export function ExportMenu({ documentId, documentName }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setExportingFormat(format);
    try {
      const response = await fetch(`/api/export?documentId=${documentId}&format=${format}`);

      if (!response.ok) {
        throw new Error('Error exporting document');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `reporte-${documentName}-${timestamp}`;

      if (format === 'pdf') {
        a.download = `${filename}.pdf`;
      } else if (format === 'excel') {
        a.download = `${filename}.xlsx`;
      } else if (format === 'csv') {
        a.download = `${filename}.csv`;
      }

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[v0] Export error:', error);
      alert('Error al exportar el documento');
    } finally {
      setExportingFormat(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Exportar
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportingFormat === 'pdf'}
            className="w-full px-4 py-2 text-left text-sm hover:bg-secondary rounded-t-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span>📄</span>
            {exportingFormat === 'pdf' ? 'Exportando PDF...' : 'Exportar a PDF'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exportingFormat === 'excel'}
            className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span>📊</span>
            {exportingFormat === 'excel' ? 'Exportando Excel...' : 'Exportar a Excel'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exportingFormat === 'csv'}
            className="w-full px-4 py-2 text-left text-sm hover:bg-secondary rounded-b-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span>📋</span>
            {exportingFormat === 'csv' ? 'Exportando CSV...' : 'Exportar a CSV'}
          </button>
        </div>
      )}
    </div>
  );
}
