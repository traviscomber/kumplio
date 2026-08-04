'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type ReviewDecision = 'approve' | 'reject' | 'request_changes' | 'supersede'

async function requireReviewer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) throw new Error('Debes iniciar sesión para revisar contenido regulatorio.')

  const allowlist = (process.env.REGULATORY_REVIEWER_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  const isReviewer = user.app_metadata?.regulatory_reviewer === true
    || (user.email ? allowlist.includes(user.email.toLowerCase()) : false)

  if (!isReviewer) throw new Error('No tienes permisos de revisor regulatorio.')

  return user
}

export async function submitReviewDecision(formData: FormData) {
  const user = await requireReviewer()
  const caseId = String(formData.get('caseId') || '')
  const decision = String(formData.get('decision') || '') as ReviewDecision
  const rationale = String(formData.get('rationale') || '').trim()
  const editedRule = String(formData.get('editedRule') || '').trim()

  if (!caseId) throw new Error('Falta el caso de revisión.')
  if (!['approve', 'reject', 'request_changes', 'supersede'].includes(decision)) {
    throw new Error('Decisión de revisión inválida.')
  }
  if (decision !== 'approve' && rationale.length < 10) {
    throw new Error('Agrega una justificación de al menos 10 caracteres.')
  }

  let proposal: Record<string, unknown> | null = null
  if (editedRule) {
    try {
      proposal = JSON.parse(editedRule) as Record<string, unknown>
    } catch {
      throw new Error('La propuesta editada debe ser JSON válido.')
    }
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('record_regulatory_review_decision_v1', {
    p_case_id: caseId,
    p_decision: decision,
    p_rationale: rationale || null,
    p_reviewer_id: user.id,
    p_proposed_changes: proposal,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/legal-review')
}
