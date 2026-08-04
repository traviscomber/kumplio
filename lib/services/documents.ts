import type { SupabaseClient } from '@supabase/supabase-js'
import type { DocumentStatus } from '@/lib/types/documents'
import { checkDocumentLimit } from '../rate-limit'

type AppSupabaseClient = SupabaseClient<any, any, any>

export async function uploadDocument(
  supabase: AppSupabaseClient,
  file: File,
  documentType: string,
): Promise<{ documentId: string; projectId: string }> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) throw new Error('User not authenticated')

    const userId = userData.user.id
    const limitCheck = await checkDocumentLimit(userId, supabase)
    if (!limitCheck.allowed) {
      const resetDate = limitCheck.nextResetAt
        ? new Date(limitCheck.nextResetAt).toLocaleDateString('es-CL')
        : 'N/A'
      throw new Error(`Plan gratuito: un documento cada siete días. Próxima carga: ${resetDate}.`)
    }

    let projectId: string
    const { data: existingProject, error: existingProjectError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Default')
      .limit(1)
      .maybeSingle()

    if (existingProjectError) throw existingProjectError

    if (existingProject?.id) {
      projectId = String(existingProject.id)
    } else {
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: 'Default',
          description: 'Ámbito predeterminado para documentos',
          status: 'active',
        })
        .select('id')
        .single()

      if (createError || !newProject?.id) {
        throw new Error(`No fue posible crear el ámbito: ${createError?.message || 'missing project id'}`)
      }
      projectId = String(newProject.id)
    }

    const timestamp = Date.now()
    const fileNameSafe = file.name.replace(/[^a-z0-9._-]/gi, '_')
    const uploadPath = `${userId}/${timestamp}-${fileNameSafe}`

    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(uploadPath, file, {
        upsert: false,
        contentType: file.type || undefined,
      })

    if (storageError) throw new Error(`No fue posible almacenar el archivo: ${storageError.message}`)

    const { data: docData, error: dbError } = await supabase
      .from('documents')
      .insert({
        name: file.name,
        file_url: uploadPath,
        document_type: documentType,
        status: 'pending',
        project_id: projectId,
        user_id: userId,
        upload_date: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (dbError || !docData?.id) {
      await supabase.storage.from('documents').remove([uploadPath])
      throw new Error(`No fue posible registrar el documento: ${dbError?.message || 'missing document id'}`)
    }

    return { documentId: String(docData.id), projectId }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error'
    console.error('[documents] upload failed', message)
    throw error
  }
}

export async function getUserDocuments(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, project_id, user_id, name, file_url, document_type, upload_date, status, created_at, projects(name)')
    .eq('user_id', userId)
    .order('upload_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getDocument(supabase: AppSupabaseClient, documentId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, project_id, user_id, name, file_url, document_type, upload_date, status, created_at, projects(name)')
    .eq('id', documentId)
    .single()

  if (error) throw error
  return data
}

export async function updateDocumentStatus(
  supabase: AppSupabaseClient,
  documentId: string,
  status: DocumentStatus,
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ status })
    .eq('id', documentId)

  if (error) throw error
}

export async function getDocumentObligations(
  supabase: AppSupabaseClient,
  documentId: string,
) {
  const { data, error } = await supabase
    .from('obligations')
    .select('id, project_id, document_id, obligation_text, responsible_party, due_date, priority, status, is1dora_confidence, created_at')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getDocumentRisks(
  supabase: AppSupabaseClient,
  documentId: string,
) {
  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('project_id')
    .eq('id', documentId)
    .single()

  if (documentError || !document?.project_id) throw documentError || new Error('Document has no project')

  const { data, error } = await supabase
    .from('risks')
    .select('*')
    .eq('project_id', document.project_id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function deleteDocument(
  supabase: AppSupabaseClient,
  documentId: string,
): Promise<void> {
  try {
    const { data: document, error: getError } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .single()

    if (getError) throw getError

    if (document?.file_url) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([String(document.file_url)])
      if (storageError) throw storageError
    }

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) throw deleteError
  } catch (error) {
    console.error('[documents] delete failed', error)
    throw error
  }
}
