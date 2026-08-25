'use client'

import { Suspense } from 'react'
import { TopNav } from '@/components/layout/top-nav'
import { DocumentsContent } from './content'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export default function DocumentsPageClient({ showTopNav = true }: { showTopNav?: boolean } = {}) {
  return (
    <div className="min-h-screen bg-background">
      {showTopNav ? <TopNav /> : null}
      <main className="container mx-auto px-4 py-8 sm:px-6">
        <Suspense fallback={<DocumentsSkeleton />}>
          <DocumentsContent />
        </Suspense>
      </main>
    </div>
  )
}

function DocumentsSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Cargando documentos">
      <Skeleton className="h-12 w-64 max-w-full" />
      <Skeleton className="h-48" />
      <div className="space-y-3">
        {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    </div>
  )
}
