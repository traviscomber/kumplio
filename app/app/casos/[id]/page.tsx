import type { Metadata } from 'next'
import { CanonicalCasePage } from '@/components/cases/canonical-case-page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resolver caso',
  description: 'Trabajo, decisiones, resultados y evidencia de un caso guiado en Kumplio.',
  robots: { index: false, follow: false },
}

export default async function CanonicalCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CanonicalCasePage caseId={id} />
}
