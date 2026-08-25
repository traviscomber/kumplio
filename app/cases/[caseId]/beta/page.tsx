import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LegacyBetaCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  redirect(`/app/casos/${caseId}`)
}
