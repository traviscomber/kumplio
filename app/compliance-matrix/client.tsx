'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ComplianceMatrix } from '@/lib/types/documents';
import { ComplianceMatrixView } from '@/components/documents/matrix-view';
import { TopNav } from '@/components/layout/top-nav';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface MatrixWithDocument extends ComplianceMatrix {
  document_name?: string;
}

export default function ComplianceMatrixPageClient() {
  const [matrix, setMatrix] = useState<MatrixWithDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  useEffect(() => {
    const loadMatrix = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = '/sign-in';
          return;
        }

        // Get all documents for this user
        const { data: docs } = await supabase
          .from('documents')
          .select('id, filename')
          .eq('user_id', user.id);

        if (!docs) {
          setMatrix([]);
          setLoading(false);
          return;
        }

        // Get all compliance matrix entries for these documents
        const docIds = docs.map((d) => d.id);
        if (docIds.length === 0) {
          setMatrix([]);
          setLoading(false);
          return;
        }

        const { data: matrixData } = await supabase
          .from('compliance_matrix')
          .select('*')
          .in('document_id', docIds);

        // Merge document info
        const enriched = (matrixData || []).map((m) => ({
          ...m,
          document_name: docs.find((d) => d.id === m.document_id)?.filename,
        }));

        setMatrix(enriched);
      } catch (err) {
        console.error('[v0] Error loading matrix:', err);
        setError('Error al cargar la matriz de cumplimiento');
      } finally {
        setLoading(false);
      }
    };

    loadMatrix();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from('compliance_matrix')
        .update({ status: newStatus })
        .eq('id', id);

      if (err) throw err;

      // Update local state
      setMatrix((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus as any } : m))
      );
    } catch (err) {
      console.error('[v0] Error updating status:', err);
    }
  };

  // Filter matrix by document if selected
  const displayedMatrix = selectedDocument
    ? matrix.filter((m) => m.document_id === selectedDocument)
    : matrix;

  // Get unique documents
  const documents = Array.from(
    new Map(matrix.map((m) => [m.document_id, m.document_name])).entries()
  ).map(([id, name]) => ({ id, name }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto px-6 py-8">
          <p className="text-muted-foreground">Cargando matriz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <Link href="/documents" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 w-fit">
          <ChevronLeft className="w-4 h-4" />
          Volver
        </Link>

        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Matriz de Cumplimiento</h1>
            <p className="text-muted-foreground">
              {displayedMatrix.length} obligaciones en total
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-destructive">
              {error}
            </div>
          )}

          {/* Document filter */}
          {documents.length > 1 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDocument(null)}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedDocument === null
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  Todos ({matrix.length})
                </button>
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc.id)}
                    className={`px-4 py-2 rounded transition-colors ${
                      selectedDocument === doc.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {doc.name} ({matrix.filter((m) => m.document_id === doc.id).length})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matrix view */}
          {displayedMatrix.length > 0 ? (
            <ComplianceMatrixView
              matrix={displayedMatrix}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">
                No hay obligaciones aún. Carga un documento para comenzar.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
