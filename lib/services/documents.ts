// Document service for KUMPLIO - aligned with real schema
import { createClient } from '@supabase/supabase-js'
import { checkDocumentLimit } from '../rate-limit'

/**
 * Upload a document to Supabase storage and create a document record.
 * Handles rate limiting (1/week free tier), project auto-creation, and storage upload.
 */
export async function uploadDocument(
  supabase: ReturnType<typeof createClient>,
  file: File,
  documentType: string
): Promise<{ documentId: string; projectId: string }> {
  try {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      throw new Error('User not authenticated')
    }

    const userId = userData.user.id

    // Check rate limit for free tier
    const limitCheck = await checkDocumentLimit(userId, supabase)
    if (!limitCheck.allowed) {
      const resetDate = limitCheck.nextResetAt ? new Date(limitCheck.nextResetAt).toLocaleDateString() : 'N/A'
      throw new Error(
        `Free tier: 1 document per week. Next scan available: ${resetDate}. Upgrade to Pro for unlimited.`
      )
    }

    // Get or create default project for this user
    let projectId: string
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Default')
      .limit(1)
      .single()

    if (existingProject?.id) {
      projectId = existingProject.id
    } else {
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: 'Default',
          description: 'Default project for document uploads',
          status: 'active',
        })
        .select('id')
        .single()

      if (createError) throw new Error(`Failed to create project: ${createError.message}`)
      projectId = newProject.id
    }

    // Upload file to storage under user's folder
    const timestamp = Date.now()
    const fileNameSafe = file.name.replace(/[^a-z0-9._-]/gi, '_')
    const uploadPath = `${userId}/${timestamp}-${fileNameSafe}`

    const { error: storageError } = await supabase.storage.from('documents').upload(uploadPath, file, {
      upsert: false,
    })

    if (storageError) throw new Error(`Storage upload failed: ${storageError.message}`)

    // Create document record with status='processing'
    const { data: docData, error: dbError } = await supabase
      .from('documents')
      .insert({
        name: file.name,
        file_url: uploadPath,
        document_type: documentType,
        status: 'processing',
        project_id: projectId,
        user_id: userId,
        upload_date: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (dbError) {
      // Clean up storage on DB failure
      await supabase.storage.from('documents').remove([uploadPath])
      throw new Error(`Database insert failed: ${dbError.message}`)
    }

    return { documentId: docData.id, projectId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error'
    console.error('[documents.ts] uploadDocument:', message)
    throw error
  }
}

/**
 * Get all documents for a user (with their project details)
 */
export async function getUserDocuments(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*, projects(name)')
    .eq('user_id', userId)
    .order('upload_date', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single document by ID
 */
export async function getDocument(supabase: ReturnType<typeof createClient>, documentId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*, projects(name)')
    .eq('id', documentId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update document status (to 'completed' after successful processing)
 */
export async function updateDocumentStatus(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  status: 'processing' | 'completed' | 'error',
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({
      status,
      ...(errorMessage && { error_message: errorMessage }),
    })
    .eq('id', documentId)

  if (error) throw error
}

/**
 * Get obligations extracted from a document
 */
export async function getDocumentObligations(
  supabase: ReturnType<typeof createClient>,
  documentId: string
) {
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('project_id')
    .eq('id', documentId)
    .single()

  if (docError) throw docError

  const { data, error } = await supabase
    .from('obligations')
    .select('*')
    .eq('project_id', doc.project_id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get risks extracted from a document
 */
export async function getDocumentRisks(supabase: ReturnType<typeof createClient>, documentId: string) {
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('project_id')
    .eq('id', documentId)
    .single()

  if (docError) throw docError

  const { data, error } = await supabase
    .from('risks')
    .select('*')
    .eq('project_id', doc.project_id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Delete a document and its associated storage file
 */
export async function deleteDocument(supabase: ReturnType<typeof createClient>, documentId: string): Promise<void> {
  try {
    // Get document to find the file_url
    const { data: doc, error: getError } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .single()

    if (getError) throw getError

    // Delete from storage if file_url exists
    if (doc?.file_url) {
      await supabase.storage.from('documents').remove([doc.file_url])
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) throw deleteError
  } catch (error) {
    console.error('[documents.ts] deleteDocument:', error)
    throw error
  }
}
