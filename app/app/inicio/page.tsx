import { Suspense } from 'react'
import { DailyComplianceContent } from '@/app/dashboard/daily-content'
import { Skeleton } from '@/components/ui/skeleton'

export default async function AppHomePage({ searchParams }: { searchParams: Promise<{ case?: string }> }) {
  const selectedCaseId = (await searchParams).case
  return (
    <main className="container mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
      <header className="mx-auto mb-14 max-w-5xl border-b border-border pb-8 md:mb-20 md:pb-10">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Operación diaria</p>
        <h1 className="font-heading mt-4 text-4xl font-normal leading-[1.1] tracking-[-0.025em] sm:text-5xl">Qué necesita tu atención</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">Una vista clara de lo que cambió y del siguiente paso que conviene resolver.</p>
      </header>
      <Suspense fallback={<HomeSkeleton />}>
        <DailyComplianceContent selectedCaseId={selectedCaseId} />
      </Suspense>
    </main>
  )
}

function HomeSkeleton() {
  return <div className="mx-auto max-w-5xl space-y-6"><Skeleton className="h-52 rounded-[4px]" /><Skeleton className="h-40 rounded-[4px]" /></div>
}
