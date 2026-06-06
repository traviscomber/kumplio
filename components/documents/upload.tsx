'use client';

import { useState, useCallback } from 'react';
import { uploadDocument } from '@/lib/services/documents';
import { useAuth } from '@/lib/auth-context';

interface DocumentUploadProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function DocumentUpload({ onSuccess, onError }: DocumentUploadProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!user) {
        onError?.('Usuario no autenticado');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        onError?.('Solo PDF, DOCX y TXT son permitidos');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        onError?.('El archivo es muy grande (máx 10MB)');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        console.log('[v0] Starting file upload');
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const next = prev + Math.random() * 30;
            return next > 90 ? 90 : next;
          });
        }, 300);

        const doc = await uploadDocument(file, user.id, selectedIndustry);

        // Trigger async processing
        console.log('[v0] Triggering document processing');
        fetch('/api/documents/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: doc.id,
            userId: user.id,
          }),
        }).catch((err) => console.error('[v0] Processing trigger error:', err));

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Reset form
        setSelectedIndustry('');
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          onSuccess?.();
        }, 500);
      } catch (error) {
        console.error('[v0] Upload failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al cargar el documento';
        onError?.(errorMessage);
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [user, selectedIndustry, onSuccess, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Industry selector */}
      <div className="flex gap-2">
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          disabled={isUploading}
          className="px-3 py-2 rounded-lg border border-border bg-input text-foreground disabled:opacity-50"
        >
          <option value="">Selecciona una industria</option>
          <option value="licitaciones">Compras Públicas & Licitaciones</option>
          <option value="mineria">Minería</option>
          <option value="construccion">Construcción</option>
          <option value="finanzas">Servicios Financieros</option>
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
            <div className="text-xs text-muted-foreground">
              PDF, DOCX o TXT • Máximo 10MB
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
