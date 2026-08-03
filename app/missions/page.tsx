import { Suspense } from 'react'
import { WorkspaceNav } from '@/components/workspace-nav'
import { Skeleton } from '@/components/ui/skeleton'
import { MissionsContent } from './content'

export const dynamic = 'force-dynamic'

export default function MissionsPage() {
  return (
    <>
      <WorkspaceNav />
      <main className="container mx-auto px-4 py-8 sm:px-6">
        <Suspense fallback={<MissionsSkeleton />}>
          <MissionsContent />
        </Suspense>
      </main>
    </>
  )
}

function MissionsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-2xl" />)}
      </div>
    </div>
  )
}
