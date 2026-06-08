'use client';

import { useState } from 'react';
import { DocumentUpload } from '@/components/documents/upload';
import { DocumentsList } from '@/components/documents/list';

export function DocumentsContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUploadSuccess = () => {
    setSuccessMessage('Documento cargado exitosamente');
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleUploadError = (error: string) => {
    setErrorMessage(error);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Documentos</h1>
        <p className="text-muted-foreground">
          Carga y analiza contratos, TDRs, normativas y documentos críticos con IA
        </p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
          ✕ {errorMessage}
        </div>
      )}

      {/* Upload area */}
      <div className="bg-card border border-border rounded-lg p-8">
        <h2 className="text-lg font-semibold mb-4">Sube un documento</h2>
        <DocumentUpload
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />
      </div>

      {/* Documents list */}
      <div className="bg-card border border-border rounded-lg p-8">
        <h2 className="text-lg font-semibold mb-4">Mis documentos</h2>
        <DocumentsList key={refreshKey} />
      </div>
    </div>
  );
}
