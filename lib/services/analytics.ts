import type { SupabaseClient } from '@supabase/supabase-js'

type AnalyticsDocument = {
  id: string
  filename: string
  status: string
  created_at: string
}

type MatrixItem = {
  document_id: string
  risk_level: string | null
  status: string | null
  due_date: string | null
  obligation: string | null
}

type ObligationItem = {
  document_id: string
  type: string | null
}

const emptyAnalytics = {
  totalDocuments: 0,
  completedDocuments: 0,
  averageComplianceScore: 0,
  riskDistribution: [
    { name: 'Crítico', value: 0, fill: 'var(--chart-1)' },
    { name: 'Alto', value: 0, fill: 'var(--chart-2)' },
    { name: 'Medio', value: 0, fill: 'var(--chart-3)' },
    { name: 'Bajo', value: 0, fill: 'var(--chart-4)' },
  ],
  documentTimeline: [] as Array<{ name: string; uploaded: number; analyzed: number; date: string }>,
  obligationsByType: [] as Array<{ type: string; count: number; fill: string }>,
  upcomingDeadlines: [] as Array<{ obligation: string; dueDate: string; status: string | null; risk: string | null }>,
}

const emptyStats = {
  totalDocuments: 0,
  totalObligations: 0,
  criticalItems: 0,
  highRiskItems: 0,
  pendingItems: 0,
  lastUpdated: null as string | null,
}

async function loadDocuments(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, filename, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as AnalyticsDocument[]
}

async function loadRelatedData(supabase: SupabaseClient, documentIds: string[]) {
  if (!documentIds.length) {
    return { matrix: [] as MatrixItem[], obligations: [] as ObligationItem[] }
  }

  const [matrixResult, obligationsResult] = await Promise.all([
    supabase
      .from('compliance_matrix')
      .select('document_id, risk_level, status, due_date, obligation')
      .in('document_id', documentIds),
    supabase
      .from('obligations')
      .select('document_id, type')
      .in('document_id', documentIds),
  ])

  if (matrixResult.error) throw matrixResult.error
  if (obligationsResult.error) throw obligationsResult.error

  return {
    matrix: (matrixResult.data || []) as MatrixItem[],
    obligations: (obligationsResult.data || []) as ObligationItem[],
  }
}

export async function getAnalyticsData(supabase: SupabaseClient, userId: string) {
  const documents = await loadDocuments(supabase, userId)
  if (!documents.length) return emptyAnalytics

  const documentIds = documents.map((document) => document.id)
  const { matrix, obligations } = await loadRelatedData(supabase, documentIds)

  const riskDistribution = [
    { name: 'Crítico', value: matrix.filter((item) => item.risk_level === 'critical').length, fill: 'var(--chart-1)' },
    { name: 'Alto', value: matrix.filter((item) => item.risk_level === 'high').length, fill: 'var(--chart-2)' },
    { name: 'Medio', value: matrix.filter((item) => item.risk_level === 'medium').length, fill: 'var(--chart-3)' },
    { name: 'Bajo', value: matrix.filter((item) => item.risk_level === 'low').length, fill: 'var(--chart-4)' },
  ]

  const documentTimeline = documents.map((document) => ({
    name: document.filename.slice(0, 15),
    uploaded: 1,
    analyzed: document.status === 'completed' ? 1 : 0,
    date: new Date(document.created_at).toLocaleDateString('es-CL'),
  }))

  const typeCount = new Map<string, number>()
  for (const obligation of obligations) {
    const type = obligation.type || 'General'
    typeCount.set(type, (typeCount.get(type) || 0) + 1)
  }

  const chartFills = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']
  const obligationsByType = Array.from(typeCount.entries())
    .sort(([left], [right]) => left.localeCompare(right, 'es'))
    .map(([type, count], index) => ({ type, count, fill: chartFills[index % chartFills.length] }))

  const now = Date.now()
  const upcomingDeadlines = matrix
    .filter((item) => item.due_date && new Date(item.due_date).getTime() > now)
    .sort((left, right) => new Date(left.due_date!).getTime() - new Date(right.due_date!).getTime())
    .slice(0, 5)
    .map((item) => ({
      obligation: (item.obligation || 'Obligación sin título').slice(0, 80),
      dueDate: item.due_date!,
      status: item.status,
      risk: item.risk_level,
    }))

  const completedDocumentIds = new Set(
    documents.filter((document) => document.status === 'completed').map((document) => document.id),
  )
  const evaluatedItems = matrix.filter((item) => completedDocumentIds.has(item.document_id))
  const completedItems = evaluatedItems.filter((item) => item.status === 'completed').length
  const averageComplianceScore = evaluatedItems.length
    ? Math.round((completedItems / evaluatedItems.length) * 100)
    : 0

  return {
    totalDocuments: documents.length,
    completedDocuments: documents.filter((document) => document.status === 'completed').length,
    averageComplianceScore,
    riskDistribution,
    documentTimeline,
    obligationsByType,
    upcomingDeadlines,
  }
}

export async function getDashboardStats(supabase: SupabaseClient, userId: string) {
  const documents = await loadDocuments(supabase, userId)
  if (!documents.length) return emptyStats

  const { matrix, obligations } = await loadRelatedData(
    supabase,
    documents.map((document) => document.id),
  )

  return {
    totalDocuments: documents.length,
    totalObligations: obligations.length,
    criticalItems: matrix.filter((item) => item.risk_level === 'critical').length,
    highRiskItems: matrix.filter((item) => item.risk_level === 'high').length,
    pendingItems: matrix.filter((item) => item.status === 'pending').length,
    lastUpdated: new Date().toISOString(),
  }
}
