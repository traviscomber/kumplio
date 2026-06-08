'use client';

import { useState } from 'react';
import { DocumentUpload } from '@/components/documents/upload';
import { DocumentsList } from '@/components/documents/list';
import { UploadGuide } from '@/components/onboarding/upload-guide';
import { SampleDocuments } from '@/components/onboarding/sample-documents';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';

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
          ✓ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
          ✕ {errorMessage}
        </div>
      )}

      {/* Two-column layout: Upload + Guide */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Upload (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Area */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-2">Sube tu primer documento</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Arrastra un archivo o selecciona uno de tu computadora
            </p>
            <DocumentUpload
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
            />
          </div>

          {/* Documents List */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-4">Mis documentos</h2>
            <DocumentsList key={refreshKey} />
          </div>
        </div>

        {/* Right: Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Upload Guide */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Cómo funciona</h3>
            <UploadGuide />
          </div>

          {/* Quick Stats */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex gap-3">
              <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Procesamiento rápido</p>
                <p className="text-xs text-blue-800">La mayoría de documentos se analizan en 30-60 segundos</p>
              </div>
            </div>
          </div>

          {/* Sample Documents */}
          <div className="bg-card border border-border rounded-lg p-6">
            <SampleDocuments />
          </div>
        </div>
      </div>

      {/* What Vera Analyzes Section */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/2 border border-primary/10 rounded-lg p-8">
        <h2 className="text-xl font-semibold mb-6 text-foreground">Qué Vera analiza en tus documentos</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-foreground">Cumplimiento Legal</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Detecta incumplimientos con Ley 19.628, 21.719 y normativas chilenas
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-foreground">Riesgos Contractuales</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Identifica cláusulas problemáticas, responsabilidades y riesgos ocultos
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-foreground">Datos Personales</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Mapea datos personales y verifica consentimiento informado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
