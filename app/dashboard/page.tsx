import { Suspense } from 'react'
import { DailyComplianceContent } from './daily-content'
import { WorkspaceNav } from '@/components/workspace-nav'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <DailyComplianceContent />
        </Suspense>
      </main>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Skeleton className="h-52 rounded-3xl" />
      <div className="space-y-4">
        {Array(3).fill(0).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
