'use client'

import { Suspense } from 'react'
import { TopNav } from '@/components/layout/top-nav'
import { DocumentsContent } from './content'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto px-6 py-8">
        <Suspense fallback={<DocumentsSkeleton />}>
          <DocumentsContent />
        </Suspense>
      </main>
    </div>
  )
}

function DocumentsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-48" />
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}
