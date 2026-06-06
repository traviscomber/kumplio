'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface ExportButtonProps {
  documentId: string;
  documentName: string;
  format?: 'pdf' | 'excel' | 'csv';
}

export function ExportButton({ documentId, documentName, format = 'pdf' }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/export?documentId=${documentId}&format=${format}`);

      if (!response.ok) {
        throw new Error('Error exporting document');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Determine filename and type based on format
      const timestamp = new Date().toISOString().split('T')[0];
      let filename = `reporte-${documentName}-${timestamp}`;

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
      setIsLoading(false);
    }
  };

  const formatLabel = {
    pdf: 'PDF',
    excel: 'Excel',
    csv: 'CSV',
  }[format];

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isLoading}
    >
      <Download className="w-4 h-4 mr-2" />
      {isLoading ? 'Exportando...' : `Exportar ${formatLabel}`}
    </Button>
  );
}
