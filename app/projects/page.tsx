import { Suspense } from 'react'
import { TopNav } from '@/components/layout/top-nav'
import { ProjectsContent } from './content'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <Suspense fallback={<ProjectsSkeleton />}>
          <ProjectsContent />
        </Suspense>
      </main>
    </div>
  )
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}
