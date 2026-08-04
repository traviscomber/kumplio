export type DocumentFormat = 'pdf' | 'txt'
export type DocumentStatus = 'pending' | 'analyzing' | 'analyzed' | 'error'
export type ObligationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Document {
  id: string
  project_id: string
  user_id: string
  name: string
  file_url: string | null
  document_type: string | null
  upload_date: string | null
  status: DocumentStatus
  created_at: string | null
  projects?: { name?: string | null } | null
}

export interface Obligation {
  id: string
  project_id: string
  document_id: string | null
  obligation_text: string
  responsible_party: string | null
  due_date: string | null
  priority: ObligationPriority | null
  status: string | null
  is1dora_confidence: number | null
  created_at: string | null
}

export interface UploadProgress {
  status: 'uploading' | DocumentStatus
  progress: number
  message: string
  error?: string
}
