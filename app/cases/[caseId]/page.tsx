import { redirect } from 'next/navigation'

export default async function LegacyCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params
  redirect(`/app/casos/${caseId}`)
}
