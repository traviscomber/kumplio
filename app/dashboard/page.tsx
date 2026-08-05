import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowRight, Workflow } from 'lucide-react'
import { DailyComplianceContent } from './daily-content'
import { WorkspaceNav } from '@/components/workspace-nav'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-6 py-8">
        <div className="mx-auto mb-6 flex max-w-5xl justify-end">
          <Link
            href="/operations"
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-bold hover:bg-muted"
          >
            <Workflow className="h-4 w-4 text-primary" />
            Abrir centro operacional
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
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
