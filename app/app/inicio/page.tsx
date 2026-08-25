import { Suspense } from 'react'
import { DailyComplianceContent } from '@/app/dashboard/daily-content'
import { Skeleton } from '@/components/ui/skeleton'

export default async function AppHomePage({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  const selectedCaseId = (await searchParams).case
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mx-auto mb-8 max-w-5xl">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Qué necesita tu atención</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Una vista clara de lo que cambió y del siguiente paso que conviene resolver.</p>
      </header>
      <Suspense fallback={<HomeSkeleton />}>
        <DailyComplianceContent selectedCaseId={selectedCaseId} />
      </Suspense>
    </main>
  )
}

function HomeSkeleton() {
  return <div className="mx-auto max-w-5xl space-y-6"><Skeleton className="h-52 rounded-3xl" /><Skeleton className="h-40 rounded-2xl" /></div>
}
