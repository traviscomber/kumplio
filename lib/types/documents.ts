// Document types for BrightScope

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  s3_key: string;
  upload_date: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  industry?: string;
  content_text?: string;
  extraction_complete: boolean;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Obligation {
  id: string;
  document_id: string;
  obligation_text: string;
  type: 'deadline' | 'responsibility' | 'requirement' | 'risk';
  severity: 'critical' | 'high' | 'medium' | 'low';
  owner?: string;
  deadline?: string;
  evidence_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceMatrix {
  id: string;
  document_id: string;
  obligation: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  responsible?: string;
  due_date?: string;
  evidence?: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface UploadProgress {
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}
