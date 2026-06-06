'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserDocuments, deleteDocument } from '@/lib/services/documents';
import { Document } from '@/lib/types/documents';
import { useAuth } from '@/lib/auth-context';

export function DocumentsList() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDocuments = async () => {
      try {
        console.log('[v0] Fetching documents');
        const docs = await getUserDocuments(user.id);
        setDocuments(docs);
        setError(null);
      } catch (err) {
        console.error('[v0] Error fetching documents:', err);
        setError('Error al cargar los documentos');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const handleDelete = async (docId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) return;

    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('[v0] Delete error:', err);
      alert('Error al eliminar el documento');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando documentos...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="text-4xl mb-2">📭</div>
        <p>No hay documentos aún. ¡Carga tu primer documento arriba!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors"
        >
          <Link href={`/documents/${doc.id}`} className="flex-1 min-w-0">
            <div className="space-y-1">
              <div className="font-medium truncate text-foreground">{doc.filename}</div>
              <div className="text-sm text-muted-foreground flex gap-3">
                <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                <span>
                  {doc.industry && (
                    <span className="px-2 py-0.5 rounded bg-muted text-xs">
                      {doc.industry}
                    </span>
                  )}
                </span>
                <span>{new Date(doc.created_at).toLocaleDateString('es-CL')}</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 ml-4">
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(doc.status)}`}>
              {getStatusLabel(doc.status)}
            </span>
            <button
              onClick={() => handleDelete(doc.id)}
              className="text-muted-foreground hover:text-destructive transition-colors text-sm"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusLabel(status: Document['status']): string {
  const labels: Record<Document['status'], string> = {
    uploading: 'Cargando',
    processing: 'Procesando',
    completed: 'Completado',
    error: 'Error',
  };
  return labels[status];
}

function getStatusColor(status: Document['status']): string {
  const colors: Record<Document['status'], string> = {
    uploading: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    processing: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    completed: 'bg-green-500/10 text-green-700 dark:text-green-400',
    error: 'bg-red-500/10 text-red-700 dark:text-red-400',
  };
  return colors[status];
}
