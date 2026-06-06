// Document service for BrightScope
import { createClient } from '@supabase/supabase-js';
import { Document, UploadProgress } from '@/lib/types/documents';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a document to Supabase storage and create a document record
 */
export async function uploadDocument(
  file: File,
  userId: string,
  industry?: string
): Promise<Document> {
  console.log('[v0] Starting document upload:', file.name);

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `documents/${userId}/${fileName}`;

  try {
    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create document record in database
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        filename: file.name,
        file_type: fileExt,
        file_size: file.size,
        s3_key: filePath,
        upload_date: new Date().toISOString(),
        status: 'processing',
        industry,
        extraction_complete: false,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    console.log('[v0] Document created:', data.id);
    return data as Document;
  } catch (error) {
    console.error('[v0] Upload error:', error);
    throw error;
  }
}

/**
 * Get all documents for a user
 */
export async function getUserDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[v0] Error fetching documents:', error);
    throw error;
  }

  return data as Document[];
}

/**
 * Get a single document
 */
export async function getDocument(documentId: string): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .select()
    .eq('id', documentId)
    .single();

  if (error) throw error;
  return data as Document;
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  documentId: string,
  status: Document['status'],
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId);

  if (error) throw error;
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  // Delete from storage
  const document = await getDocument(documentId);
  
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.s3_key]);

  if (storageError) console.warn('[v0] Storage delete warning:', storageError);

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (dbError) throw dbError;
}

/**
 * Get document obligations and compliance matrix
 */
export async function getDocumentAnalysis(documentId: string) {
  const [obligationsData, matrixData] = await Promise.all([
    supabase
      .from('obligations')
      .select()
      .eq('document_id', documentId),
    supabase
      .from('compliance_matrix')
      .select()
      .eq('document_id', documentId),
  ]);

  if (obligationsData.error) throw obligationsData.error;
  if (matrixData.error) throw matrixData.error;

  return {
    obligations: obligationsData.data,
    complianceMatrix: matrixData.data,
  };
}
